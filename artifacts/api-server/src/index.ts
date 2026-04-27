import app from "./app.js";
import { initDb } from "@workspace/db";

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
  const databaseUrl = resolveDbUrl();
  if (!databaseUrl) {
    console.warn("[Stripe] No database URL found — skipping Stripe initialization.");
    return;
  }

  // Check whether a real Stripe secret key is present
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const hasRealStripeKey = stripeKey.startsWith("sk_test_") || stripeKey.startsWith("sk_live_");

  try {
    const { runMigrations } = await import("stripe-replit-sync");
    console.log("[Stripe] Running schema migrations...");
    await runMigrations({ databaseUrl });
    console.log("[Stripe] Schema ready.");

    if (!hasRealStripeKey) {
      // No real Stripe key — billing sync/webhook setup cannot run.
      console.log("[Stripe] Skipping sync/webhook setup — no real Stripe key detected.");
      console.log("[Stripe] To enable billing: set STRIPE_SECRET_KEY to your real Stripe secret key (sk_test_... or sk_live_...).");
      return;
    }

    const { getStripeSync } = await import("./stripeClient.js");
    const stripeSync = await getStripeSync();

    const domain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
    if (domain) {
      const webhookUrl = `https://${domain}/api/stripe/webhook`;
      console.log("[Stripe] Setting up managed webhook:", webhookUrl);
      const result = await stripeSync.findOrCreateManagedWebhook(webhookUrl);
      console.log("[Stripe] Webhook configured:", (result as any)?.webhook?.url || "complete");
    }

    stripeSync
      .syncBackfill()
      .then(() => console.log("[Stripe] Data sync complete"))
      .catch((err: any) => console.error("[Stripe] Sync error:", err.message));
  } catch (error: any) {
    console.error("[Stripe] Initialization error:", error.message);
  }
}

// ─── Start server immediately so Railway health checks pass ──────────────────
app.listen(port, () => {
  console.log(`[AutoPay Cancel API] Server listening on port ${port}`);
});

// ─── DB init + Stripe run in background (non-fatal) ──────────────────────────
async function initBackground() {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[DB] Initializing schema (attempt ${attempt}/${maxAttempts})...`);
      await initDb();
      console.log("[DB] Schema ready.");
      break;
    } catch (err: any) {
      console.error(`[DB] Init attempt ${attempt} failed:`, err.message);
      if (attempt < maxAttempts) {
        const delay = attempt * 2000;
        console.log(`[DB] Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error("[DB] All init attempts failed — server will respond with DB errors until connection recovers.");
      }
    }
  }

  await initStripe();
}

initBackground().catch((err) => console.error("[Background init] Unexpected error:", err.message));
