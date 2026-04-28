import app from "./app.js";
import { initDb, pool } from "@workspace/db";
import { setBillingState } from "./billingState.js";
import { setDbState, getDbState } from "./dbState.js";
import { startDbLivenessPing } from "./dbLivenessPing.js";
import { resolveReplitWebhookDomain } from "./stripeEnvGuard.js";

// ─── Startup diagnostics ──────────────────────────────────────────────────────
console.log("[Startup] NODE_ENV:", process.env.NODE_ENV ?? "(not set)");
console.log("[Startup] PORT:", process.env.PORT ?? "(not set)");
const dbUrl = process.env.DATABASE_URL;
console.log("[Startup] DATABASE_URL:", dbUrl && dbUrl.trim() ? "✓ set" : dbUrl === "" || dbUrl !== undefined ? "✗ SET BUT EMPTY — fix in Railway Variables" : "✗ NOT SET");
console.log("[Startup] POSTGRES_URL:", process.env.POSTGRES_URL?.trim() ? "✓ set" : "✗ not set");
console.log("[Startup] PGHOST:", process.env.PGHOST?.trim() ? `✓ ${process.env.PGHOST}` : "✗ not set");
console.log("[Startup] PGDATABASE:", process.env.PGDATABASE?.trim() ? `✓ ${process.env.PGDATABASE}` : "✗ not set");
console.log("[Startup] PGUSER:", process.env.PGUSER?.trim() ? "✓ set" : "✗ not set");
console.log("[Startup] PGPASSWORD:", process.env.PGPASSWORD?.trim() ? "✓ set" : "✗ not set");
console.log("[Startup] JWT_SECRET:", process.env.JWT_SECRET ? "✓ set" : "✗ not set (using dev default)");
console.log("[Startup] CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "✓ set" : "✗ NOT SET — auth will fail");
console.log("[Startup] CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY ? "✓ set" : "✗ not set");
console.log("[Startup] VITE_CLERK_PUBLISHABLE_KEY:", process.env.VITE_CLERK_PUBLISHABLE_KEY ? "✓ set (build-time)" : "✗ not set (must be set before build)");
console.log("[Startup] PLAID_CLIENT_ID:", process.env.PLAID_CLIENT_ID ? "✓ set" : "✗ not set");
console.log("[Startup] STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✓ set" : "✗ not set");

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

function resolveDbUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRESQL_URL) return process.env.POSTGRESQL_URL;
  if (process.env.DB_URL) return process.env.DB_URL;
  if (process.env.PGURL) return process.env.PGURL;

  const h = process.env.PGHOST || process.env.POSTGRES_HOST;
  const p = process.env.PGPORT || process.env.POSTGRES_PORT || "5432";
  const u = process.env.PGUSER || process.env.POSTGRES_USER;
  const pw = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const d = process.env.PGDATABASE || process.env.POSTGRES_DB;
  if (h && u && pw && d) {
    return `postgresql://${u}:${encodeURIComponent(pw)}@${h}:${p}/${d}`;
  }
  return undefined;
}

async function initStripe() {
  // Check whether a real Stripe secret key is present (done first so the
  // billing-status line always appears, regardless of DB availability).
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const hasRealStripeKey = stripeKey.startsWith("sk_test_") || stripeKey.startsWith("sk_live_");
  const env = process.env.NODE_ENV ?? "unknown";
  const keyPrefix = stripeKey.startsWith("sk_live_") ? "sk_live_..." : stripeKey.startsWith("sk_test_") ? "sk_test_..." : "none";
  if (hasRealStripeKey) {
    console.log(`[Stripe] Billing ACTIVE (key: ${keyPrefix} | env: ${env})`);
    setBillingState({ billingActive: true, keyPrefix });
  } else {
    console.log(`[Stripe] Billing INACTIVE — no real Stripe key (env: ${env})`);
    setBillingState({ billingActive: false });
  }

  if (!hasRealStripeKey) {
    console.log("[Stripe] No real Stripe key detected — skipping billing initialization.");
    console.log("[Stripe] To enable billing: set STRIPE_SECRET_KEY (sk_test_... or sk_live_...).");
    return;
  }

  // Replit-managed sync only runs on the Replit platform (requires Replit's
  // stripe-replit-sync DB schema which Railway does not provision).
  const isReplit = !!(process.env.REPL_ID || process.env.REPLIT_DOMAINS);

  if (isReplit) {
    const databaseUrl = resolveDbUrl();
    if (!databaseUrl) {
      console.warn("[Stripe] No database URL — skipping Replit sync.");
      return;
    }
    try {
      const { runStripeSyncInit } = await import("./stripeSyncInit.js");
      const domain = resolveReplitWebhookDomain(process.env);
      await runStripeSyncInit({ databaseUrl, domain });
    } catch (error: any) {
      console.error("[Stripe] Initialization error:", error.message);
    }
  } else {
    // Outside Replit (Railway, etc.) — use standard Stripe SDK directly.
    // stripeService.ts already uses getUncachableStripeClient() which works here.
    try {
      const { getUncachableStripeClient } = await import("./stripeClient.js");
      const stripe = await getUncachableStripeClient();
      const account = await stripe.accounts.retrieve();
      console.log("[Stripe] Connected to Stripe account:", account.id, "— billing ready.");
    } catch (error: any) {
      console.error("[Stripe] Failed to connect to Stripe:", error.message);
    }
  }
}

// ─── Periodic DB liveness ping ───────────────────────────────────────────────
const DB_PING_INTERVAL_MS = 30_000;

// ─── Start server immediately so Railway health checks pass ──────────────────
app.listen(port, () => {
  console.log(`[AutoPay Cancel API] Server listening on port ${port}`);
});

// ─── DB init + Stripe run in background (non-fatal) ──────────────────────────
async function initBackground() {
  let dbLivenessInterval: NodeJS.Timeout | null = null;

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[DB] Initializing schema (attempt ${attempt}/${maxAttempts})...`);
      await initDb();
      console.log("[DB] Schema ready.");
      setDbState({ dbReady: true });
      dbLivenessInterval = startDbLivenessPing({
        queryPool: () => pool.query("SELECT 1").then(() => undefined),
        getDbState,
        setDbState,
        intervalMs: DB_PING_INTERVAL_MS,
      });
      console.log("[DB] Liveness ping started (every 30s).");
      break;
    } catch (err: any) {
      console.error(`[DB] Init attempt ${attempt} failed:`, err.message);
      if (attempt < maxAttempts) {
        const delay = attempt * 2000;
        console.log(`[DB] Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error("[DB] All init attempts failed — server will respond with DB errors until connection recovers.");
        setDbState({ dbReady: false });
      }
    }
  }

  process.once("SIGTERM", () => {
    if (dbLivenessInterval !== null) {
      clearInterval(dbLivenessInterval);
      console.log("[DB] Liveness ping stopped (SIGTERM).");
    }
  });

  await initStripe();
}

initBackground().catch((err) => console.error("[Background init] Unexpected error:", err.message));
