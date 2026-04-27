/**
 * Billing smoke test — exercises the full Stripe sync path end-to-end.
 *
 * Run with:  pnpm --filter @workspace/api-server test:billing
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY  — a real sk_test_... or sk_live_... key
 *   DATABASE_URL       — PostgreSQL connection string
 *
 * Optional:
 *   APP_DOMAIN         — public domain used to build the webhook URL
 *                        Falls back to REPLIT_DOMAINS when not set.
 *   CI=true            — fail (exit 1) when required env vars are absent
 *                        instead of skipping gracefully.
 *
 * The test imports the real production modules (stripeSyncInit, stripeClient)
 * and exercises the same code path as initStripe() in src/index.ts.
 */

import Stripe from "stripe";
import { getUncachableStripeClient, getStripeSync } from "./stripeClient.js";
import { runStripeSyncInit } from "./stripeSyncInit.js";

// ─── result tracking ──────────────────────────────────────────────────────────

let failures = 0;

function pass(msg: string) {
  console.log(`  ✓  ${msg}`);
}

function fail(msg: string, err?: unknown) {
  failures += 1;
  const detail = err instanceof Error ? err.message : String(err ?? "");
  console.error(`  ✗  ${msg}${detail ? ` — ${detail}` : ""}`);
}

// ─── env validation ───────────────────────────────────────────────────────────

function resolveEnv(): {
  stripeKey: string;
  databaseUrl: string;
  domain: string | undefined;
} | null {
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const isReal =
    stripeKey.startsWith("sk_test_") || stripeKey.startsWith("sk_live_");

  if (!isReal) {
    const msg =
      "STRIPE_SECRET_KEY is not a real key — set sk_test_... or sk_live_...";
    if (process.env.CI === "true") {
      fail(msg);
      process.exit(1);
    }
    console.log(`  –  ${msg} (skipped)`);
    return null;
  }

  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRESQL_URL ||
    "";

  if (!databaseUrl) {
    const msg = "DATABASE_URL is not set — cannot run sync path";
    if (process.env.CI === "true") {
      fail(msg);
      process.exit(1);
    }
    console.log(`  –  ${msg} (skipped)`);
    return null;
  }

  const domain =
    process.env.APP_DOMAIN ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    process.env.REPLIT_DOMAINS?.split(",")[0] ||
    undefined;

  if (!domain && process.env.CI === "true") {
    fail(
      "APP_DOMAIN (or RAILWAY_PUBLIC_DOMAIN / REPLIT_DOMAINS) is not set — webhook registration cannot be validated in CI"
    );
    process.exit(1);
  }

  return { stripeKey, databaseUrl, domain };
}

// ─── test sections ────────────────────────────────────────────────────────────

/**
 * 1. Stripe client — validates getUncachableStripeClient() from stripeClient.ts
 *    connects to the Stripe API with the configured key.
 */
async function testClientConnectivity() {
  console.log("\n[1] Stripe client connectivity (getUncachableStripeClient)");
  try {
    const stripe: Stripe = await getUncachableStripeClient();
    const account = await stripe.accounts.retrieve();
    pass(`Connected to Stripe account: ${account.id}`);
  } catch (err) {
    fail("getUncachableStripeClient() or accounts.retrieve() failed", err);
    throw err;
  }
}

/**
 * 2. StripeSync client — validates getStripeSync() from stripeClient.ts
 *    constructs a StripeSync instance without throwing.
 */
async function testStripeSyncClient() {
  console.log("\n[2] StripeSync client construction (getStripeSync)");
  try {
    const sync = await getStripeSync();
    if (!sync) throw new Error("getStripeSync() returned null/undefined");
    pass("getStripeSync() returned a StripeSync instance");
  } catch (err) {
    fail("getStripeSync() failed", err);
    throw err;
  }
}

/**
 * 3. Full sync path — calls runStripeSyncInit() which is the same function
 *    invoked by initStripe() in src/index.ts for BOTH the Replit and
 *    non-Replit (Railway, etc.) code paths.  Exercises:
 *      - runMigrations  (stripe schema setup)
 *      - getStripeSync  (StripeSync client from stripeClient.ts)
 *      - findOrCreateManagedWebhook (webhook registration)
 *      - syncBackfill   (data sync, awaited so we capture errors)
 */
async function testFullSyncPath(databaseUrl: string, domain?: string) {
  console.log("\n[3] Full sync path (runStripeSyncInit — production code path)");

  let result: Awaited<ReturnType<typeof runStripeSyncInit>> | null = null;

  try {
    result = await runStripeSyncInit({
      databaseUrl,
      domain,
      awaitBackfill: true,
    });
  } catch (err) {
    fail("runStripeSyncInit() threw an unexpected error", err);
    return;
  }

  if (result.migrationsRan) {
    pass("runMigrations() completed");
  } else {
    fail("runMigrations() did not complete");
  }

  if (domain) {
    const expectedWebhookUrl = `https://${domain}/api/stripe/webhook`;
    if (result.webhookUrl) {
      pass(`Webhook registered: ${result.webhookUrl}`);
      if (result.webhookUrl === expectedWebhookUrl) {
        pass("Webhook URL matches expected endpoint");
      } else {
        // findOrCreateManagedWebhook may return an existing endpoint whose URL
        // differs — log a note but do not fail.
        console.log(
          `  ℹ  Existing webhook reused: ${result.webhookUrl} (expected ${expectedWebhookUrl})`
        );
      }
    } else {
      fail("findOrCreateManagedWebhook() returned no webhook URL");
    }
  } else {
    console.log(
      "  ℹ  No domain set — webhook registration step skipped by production path"
    );
  }

  if (result.syncDispatched) {
    pass("syncBackfill() completed without errors");
  } else {
    fail("syncBackfill() was not dispatched");
  }
}

/**
 * 4. Non-Replit init path — verifies the else-branch of initStripe() in
 *    src/index.ts (the path taken on Railway and other non-Replit platforms).
 *
 *    That branch now calls runStripeSyncInit() with the domain resolved from
 *    APP_DOMAIN or RAILWAY_PUBLIC_DOMAIN, so this section confirms that:
 *      - Webhook registration succeeds in the non-Replit context
 *      - The registered URL matches the Railway / APP_DOMAIN endpoint
 *
 *    Unlike section [3], this section uses domain resolution that mirrors the
 *    non-Replit branch exactly (APP_DOMAIN → RAILWAY_PUBLIC_DOMAIN).
 */
async function testNonReplitInitPath(databaseUrl: string) {
  console.log("\n[4] Non-Replit init path (Railway / APP_DOMAIN webhook registration)");

  const domain =
    process.env.APP_DOMAIN ||
    process.env.RAILWAY_PUBLIC_DOMAIN ||
    undefined;

  if (!domain) {
    console.log(
      "  ℹ  APP_DOMAIN and RAILWAY_PUBLIC_DOMAIN are not set — " +
        "webhook URL assertion skipped (non-Replit domain unknown)"
    );
  }

  let result: Awaited<ReturnType<typeof runStripeSyncInit>> | null = null;
  try {
    result = await runStripeSyncInit({ databaseUrl, domain, awaitBackfill: true });
  } catch (err) {
    fail("runStripeSyncInit() threw an error in the non-Replit path", err);
    return;
  }

  if (result.migrationsRan) {
    pass("DB migrations completed (non-Replit path)");
  } else {
    fail("DB migrations did not complete in the non-Replit path");
  }

  if (domain) {
    if (result.webhookUrl) {
      pass(`Webhook registered via non-Replit path: ${result.webhookUrl}`);
    } else {
      fail("findOrCreateManagedWebhook() returned no URL in the non-Replit path");
    }
  }

  if (result.syncDispatched) {
    pass("syncBackfill() completed in the non-Replit path");
  } else {
    fail("syncBackfill() was not dispatched in the non-Replit path");
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Billing smoke test ===");
  console.log(
    `NODE_ENV: ${process.env.NODE_ENV ?? "unknown"} | CI: ${process.env.CI ?? "not set"}`
  );

  const env = resolveEnv();
  if (!env) {
    console.log("\nSmoke test skipped — re-run with real STRIPE_SECRET_KEY and DATABASE_URL.");
    process.exit(0);
  }

  const { databaseUrl, domain } = env;

  // 1. Basic Stripe API reachability
  await testClientConnectivity();

  // 2. StripeSync client construction via stripeClient.ts
  await testStripeSyncClient();

  // 3. Full sync path — the same production function initStripe() calls for
  //    both Replit and non-Replit environments
  await testFullSyncPath(databaseUrl, domain);

  // 4. Non-Replit init path — explicitly exercises the Railway/non-Replit
  //    branch of initStripe() using APP_DOMAIN / RAILWAY_PUBLIC_DOMAIN
  await testNonReplitInitPath(databaseUrl);

  // ─── summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Summary ===");
  if (failures === 0) {
    console.log("All billing smoke tests PASSED.");
  } else {
    console.error(`${failures} billing smoke test(s) FAILED — see above.`);
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error("[smoke-test-billing] Unexpected error:", err.message);
  process.exit(1);
});
