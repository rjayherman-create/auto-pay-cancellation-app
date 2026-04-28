/**
 * cleanup-preview-webhooks.ts
 *
 * One-off script that removes stale Railway preview webhook endpoints from the
 * Stripe dashboard.  These were created by preview deploys before the guard
 * introduced in Task #16 was in place and will never receive live events.
 *
 * Recommended usage flow:
 *
 *   1. Preview what will be deleted (no changes made):
 *        DRY_RUN=true pnpm --filter @workspace/api-server cleanup:preview-webhooks
 *
 *   2. Apply deletions once you have confirmed the list looks correct:
 *        APP_DOMAIN=myapp.com CONFIRM_DELETE=true \
 *          pnpm --filter @workspace/api-server cleanup:preview-webhooks
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY   — a real sk_test_... or sk_live_... key
 *
 * Optional env vars:
 *   APP_DOMAIN          — the production custom domain (e.g. "myapp.com").
 *                         Endpoints whose URLs contain this string are NEVER
 *                         deleted, even if they match the preview pattern.
 *                         Strongly recommended to set this before deleting.
 *   DRY_RUN=true        — list what would be deleted without actually deleting
 *                         (overrides CONFIRM_DELETE).
 *   CONFIRM_DELETE=true — required for any real deletion run. Forces operators
 *                         to deliberately opt in to destructive changes.
 *
 * Safety guarantees:
 *   - Only deletes endpoints whose URL contains ".up.railway.app"
 *     (Railway's ephemeral preview domain pattern).
 *   - Never deletes endpoints whose URL contains APP_DOMAIN.
 *   - Never deletes endpoints whose URL contains a Replit domain
 *     (*.replit.app, *.repl.co, *.replit.dev).
 *   - Idempotent: already-deleted endpoints are simply absent on re-run.
 *   - Refuses to delete if CONFIRM_DELETE=true is not set (unless DRY_RUN).
 */

import { getUncachableStripeClient } from "./stripeClient.js";

// ─── helpers ──────────────────────────────────────────────────────────────────

export function isRailwayPreviewUrl(url: string): boolean {
  return url.includes(".up.railway.app");
}

export function isProductionUrl(url: string, productionDomain: string | undefined): boolean {
  if (!productionDomain) return false;
  return url.includes(productionDomain);
}

export function isReplitUrl(url: string): boolean {
  return (
    url.includes(".replit.app") ||
    url.includes(".repl.co") ||
    url.includes(".replit.dev") ||
    url.includes("replit.dev")
  );
}

export function shouldDelete(url: string, productionDomain: string | undefined): boolean {
  if (!isRailwayPreviewUrl(url)) return false;
  if (isProductionUrl(url, productionDomain)) return false;
  if (isReplitUrl(url)) return false;
  return true;
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Stripe Preview Webhook Cleanup ===");

  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  const isReal = stripeKey.startsWith("sk_test_") || stripeKey.startsWith("sk_live_");

  if (!isReal) {
    console.error(
      "[cleanup] STRIPE_SECRET_KEY is not set or is not a real key.\n" +
        "          Set sk_test_... or sk_live_... and re-run."
    );
    process.exit(1);
  }

  const productionDomain = process.env.APP_DOMAIN?.trim() || undefined;
  const dryRun = process.env.DRY_RUN === "true";
  const confirmDelete = process.env.CONFIRM_DELETE === "true";

  console.log(`[cleanup] Key prefix     : ${stripeKey.startsWith("sk_live_") ? "sk_live_..." : "sk_test_..."}`);
  if (productionDomain) {
    console.log(`[cleanup] Prod domain    : ${productionDomain}  (endpoints containing this URL will be kept)`);
  } else {
    console.log("[cleanup] Prod domain    : NOT SET — strongly recommended to set APP_DOMAIN before deleting");
    console.log("          (URLs on *.up.railway.app that are production endpoints would not be protected)");
  }
  console.log(`[cleanup] Dry run        : ${dryRun ? "YES — no deletions will occur" : "no"}`);
  console.log(`[cleanup] Confirm delete : ${confirmDelete ? "yes" : "NOT SET"}`);
  console.log("");

  const stripe = await getUncachableStripeClient();

  // Fetch all webhook endpoints (auto-paginate through all pages).
  console.log("[cleanup] Fetching all webhook endpoints from Stripe...");
  const allEndpoints: { id: string; url: string }[] = [];

  for await (const endpoint of stripe.webhookEndpoints.list({ limit: 100 })) {
    allEndpoints.push({ id: endpoint.id, url: endpoint.url });
  }

  console.log(`[cleanup] Total endpoints found: ${allEndpoints.length}`);
  console.log("");

  const toDelete = allEndpoints.filter((ep) => shouldDelete(ep.url, productionDomain));
  const kept = allEndpoints.filter((ep) => !shouldDelete(ep.url, productionDomain));

  if (kept.length > 0) {
    console.log(`[cleanup] Keeping ${kept.length} endpoint(s) (production / Replit / non-preview):`);
    for (const ep of kept) {
      console.log(`          ✓ keep  ${ep.id}  ${ep.url}`);
    }
    console.log("");
  }

  if (toDelete.length === 0) {
    console.log("[cleanup] No stale Railway preview webhook endpoints found — nothing to do.");
    return;
  }

  console.log(`[cleanup] Preview — ${toDelete.length} stale endpoint(s) targeted for deletion:`);
  for (const ep of toDelete) {
    console.log(`          – target  ${ep.id}  ${ep.url}`);
  }
  console.log("");

  if (dryRun) {
    console.log(`[cleanup] Dry run complete. ${toDelete.length} endpoint(s) would be deleted.`);
    console.log("[cleanup] To apply: set CONFIRM_DELETE=true (and optionally APP_DOMAIN) and re-run without DRY_RUN.");
    return;
  }

  if (!confirmDelete) {
    console.error(
      "[cleanup] Aborting — CONFIRM_DELETE=true is required for real deletions.\n" +
        "          Run with DRY_RUN=true first to review the target list,\n" +
        "          then re-run with CONFIRM_DELETE=true to apply."
    );
    process.exit(1);
  }

  console.log(`[cleanup] Deleting ${toDelete.length} stale preview endpoint(s)...`);

  let deleted = 0;
  let errors = 0;

  for (const ep of toDelete) {
    try {
      await stripe.webhookEndpoints.del(ep.id);
      console.log(`          ✓ deleted  ${ep.id}  ${ep.url}`);
      deleted++;
    } catch (err: any) {
      console.error(`          ✗ failed   ${ep.id}  ${ep.url}  — ${err.message}`);
      errors++;
    }
  }

  console.log("");
  console.log(`[cleanup] Done. Deleted: ${deleted}  Errors: ${errors}`);

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error("[cleanup-preview-webhooks] Unexpected error:", err.message);
  process.exit(1);
});
