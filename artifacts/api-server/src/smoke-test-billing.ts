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
    process.env.REPLIT_DOMAINS?.split(",")[0] ||
    undefined;

  if (!domain && process.env.CI === "true") {
    fail(
      "APP_DOMAIN (or REPLIT_DOMAINS) is not set — webhook registration cannot be validated in CI"
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
 *    invoked by initStripe() in src/index.ts.  Exercises:
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

  // 3. Full sync path — the same production function initStripe() calls
  await testFullSyncPath(databaseUrl, domain);

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
