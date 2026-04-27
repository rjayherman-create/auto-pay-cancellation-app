/**
 * stripeSyncInit.ts
 *
 * Encapsulates the Replit-managed Stripe sync path so it can be imported and
 * exercised directly by integration tests without pulling in the full
 * server entry-point (src/index.ts).
 */

import type Stripe from "stripe";
import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient.js";

export interface StripeSyncResult {
  migrationsRan: boolean;
  webhookUrl: string | null;
  webhookEndpoint: Stripe.WebhookEndpoint | null;
  syncDispatched: boolean;
}

/**
 * Runs the full Replit-managed Stripe sync path:
 *   1. runMigrations  – creates the stripe schema in the database
 *   2. getStripeSync  – constructs the StripeSync client (from stripeClient.ts)
 *   3. findOrCreateManagedWebhook – registers (or reuses) the webhook endpoint
 *   4. syncBackfill   – fires background backfill and awaits completion
 *
 * Returns a result object suitable for assertions in integration tests.
 *
 * @param databaseUrl  PostgreSQL connection string (required)
 * @param domain       Public domain used to build the webhook URL (optional)
 * @param awaitBackfill  When true, awaits syncBackfill() fully (default: false)
 */
export async function runStripeSyncInit({
  databaseUrl,
  domain,
  awaitBackfill = false,
}: {
  databaseUrl: string;
  domain?: string;
  awaitBackfill?: boolean;
}): Promise<StripeSyncResult> {
  const result: StripeSyncResult = {
    migrationsRan: false,
    webhookUrl: null,
    webhookEndpoint: null,
    syncDispatched: false,
  };

  console.log("[Stripe] Running Replit schema migrations...");
  await runMigrations({ databaseUrl });
  result.migrationsRan = true;
  console.log("[Stripe] Schema ready.");

  const stripeSync = await getStripeSync();

  if (domain) {
    const webhookUrl = `https://${domain}/api/stripe/webhook`;
    console.log("[Stripe] Setting up managed webhook:", webhookUrl);
    const endpoint = await stripeSync.findOrCreateManagedWebhook(webhookUrl);
    result.webhookUrl = endpoint.url;
    result.webhookEndpoint = endpoint;
    console.log("[Stripe] Webhook configured:", endpoint.url);
  }

  if (awaitBackfill) {
    console.log("[Stripe] Running syncBackfill (awaited)...");
    await stripeSync.syncBackfill();
    console.log("[Stripe] Data sync complete.");
  } else {
    stripeSync
      .syncBackfill()
      .then(() => console.log("[Stripe] Data sync complete."))
      .catch((err: Error) => console.error("[Stripe] Sync error:", err.message));
  }
  result.syncDispatched = true;

  return result;
}
