/**
 * Unit tests for the RAILWAY_ENVIRONMENT guard (stripeEnvGuard.ts).
 *
 * Verifies the critical safety property from task-13: preview / staging
 * Railway deploys must never pass APP_DOMAIN to runStripeSyncInit() —
 * that would overwrite the production webhook.  Instead, preview deploys
 * must use RAILWAY_PUBLIC_DOMAIN (their own ephemeral URL).
 *
 * Run with:
 *   pnpm --filter @workspace/api-server test:env-guard
 *
 * No external services or credentials are required — all assertions are
 * purely against the domain-resolution logic.
 */

import { resolveRailwayWebhookDomain } from "./stripeEnvGuard.js";

// ─── result tracking ──────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓  ${description}`);
    passed++;
  } else {
    console.error(`  ✗  ${description}`);
    failed++;
  }
}

// ─── test cases ───────────────────────────────────────────────────────────────

/**
 * [1] The primary safety property.
 *
 * For every non-production RAILWAY_ENVIRONMENT, the domain that would be
 * passed to runStripeSyncInit() must be derived from RAILWAY_PUBLIC_DOMAIN
 * only — APP_DOMAIN must never appear, regardless of whether it is set.
 */
function testPreviewNeverReceivesAppDomain() {
  console.log(
    "\n[1] Preview / staging: runStripeSyncInit() receives RAILWAY_PUBLIC_DOMAIN — never APP_DOMAIN"
  );

  const previewEnvNames = ["staging", "pr-42", "preview", "my-feature-branch", "dev"];

  for (const railwayEnv of previewEnvNames) {
    // Both domain vars are set — guard must prefer RAILWAY_PUBLIC_DOMAIN.
    const domainWhenBothSet = resolveRailwayWebhookDomain({
      RAILWAY_ENVIRONMENT: railwayEnv,
      APP_DOMAIN: "app.example.com",
      RAILWAY_PUBLIC_DOMAIN: "preview-abc.up.railway.app",
    });
    assert(
      domainWhenBothSet === "preview-abc.up.railway.app",
      `RAILWAY_ENVIRONMENT="${railwayEnv}" + both domains set → domain is RAILWAY_PUBLIC_DOMAIN (not APP_DOMAIN)`
    );
    assert(
      domainWhenBothSet !== "app.example.com",
      `RAILWAY_ENVIRONMENT="${railwayEnv}" → APP_DOMAIN is never passed to runStripeSyncInit()`
    );

    // Only RAILWAY_PUBLIC_DOMAIN is set — guard must return it.
    const domainOnlyRailway = resolveRailwayWebhookDomain({
      RAILWAY_ENVIRONMENT: railwayEnv,
      RAILWAY_PUBLIC_DOMAIN: "preview-abc.up.railway.app",
    });
    assert(
      domainOnlyRailway === "preview-abc.up.railway.app",
      `RAILWAY_ENVIRONMENT="${railwayEnv}" + only RAILWAY_PUBLIC_DOMAIN → RAILWAY_PUBLIC_DOMAIN is returned`
    );

    // Only APP_DOMAIN is set, no RAILWAY_PUBLIC_DOMAIN — guard must return undefined
    // (webhook registration is skipped; APP_DOMAIN is NOT used as a fallback).
    const domainOnlyApp = resolveRailwayWebhookDomain({
      RAILWAY_ENVIRONMENT: railwayEnv,
      APP_DOMAIN: "app.example.com",
    });
    assert(
      domainOnlyApp === undefined,
      `RAILWAY_ENVIRONMENT="${railwayEnv}" + only APP_DOMAIN (no RAILWAY_PUBLIC_DOMAIN) → undefined (APP_DOMAIN never used as fallback)`
    );

    // Neither domain var is set — guard must return undefined.
    const domainNone = resolveRailwayWebhookDomain({
      RAILWAY_ENVIRONMENT: railwayEnv,
    });
    assert(
      domainNone === undefined,
      `RAILWAY_ENVIRONMENT="${railwayEnv}" + no domain vars → undefined`
    );
  }
}

/**
 * [2] Production Railway service — APP_DOMAIN is preferred.
 *
 * Confirms that RAILWAY_ENVIRONMENT="production" still passes APP_DOMAIN to
 * runStripeSyncInit() when it is set.
 */
function testProductionPrefersAppDomain() {
  console.log("\n[2] Production Railway service: runStripeSyncInit() receives APP_DOMAIN");

  const domain = resolveRailwayWebhookDomain({
    RAILWAY_ENVIRONMENT: "production",
    APP_DOMAIN: "app.example.com",
    RAILWAY_PUBLIC_DOMAIN: "prod.up.railway.app",
  });
  assert(
    domain === "app.example.com",
    'RAILWAY_ENVIRONMENT="production" + both domains set → APP_DOMAIN is passed to runStripeSyncInit()'
  );
}

/**
 * [3] Production Railway service — falls back to RAILWAY_PUBLIC_DOMAIN when
 *     APP_DOMAIN is absent.
 */
function testProductionFallsBackToRailwayPublicDomain() {
  console.log(
    "\n[3] Production Railway service: falls back to RAILWAY_PUBLIC_DOMAIN when APP_DOMAIN absent"
  );

  const domain = resolveRailwayWebhookDomain({
    RAILWAY_ENVIRONMENT: "production",
    RAILWAY_PUBLIC_DOMAIN: "prod.up.railway.app",
  });
  assert(
    domain === "prod.up.railway.app",
    'RAILWAY_ENVIRONMENT="production" + only RAILWAY_PUBLIC_DOMAIN → RAILWAY_PUBLIC_DOMAIN is returned'
  );
}

/**
 * [4] RAILWAY_ENVIRONMENT unset — treated as production (ensures non-Railway
 *     hosts such as bare-metal VMs or containers still register the webhook).
 */
function testUnsetRailwayEnvTreatedAsProduction() {
  console.log("\n[4] RAILWAY_ENVIRONMENT unset → treated as production");

  const domainWithAppDomain = resolveRailwayWebhookDomain({
    APP_DOMAIN: "app.example.com",
  });
  assert(
    domainWithAppDomain === "app.example.com",
    "RAILWAY_ENVIRONMENT unset + APP_DOMAIN set → APP_DOMAIN is returned"
  );

  const domainWithRailwayPublic = resolveRailwayWebhookDomain({
    RAILWAY_PUBLIC_DOMAIN: "prod.up.railway.app",
  });
  assert(
    domainWithRailwayPublic === "prod.up.railway.app",
    "RAILWAY_ENVIRONMENT unset + RAILWAY_PUBLIC_DOMAIN set → RAILWAY_PUBLIC_DOMAIN is returned"
  );

  const domainNoDomainVars = resolveRailwayWebhookDomain({});
  assert(
    domainNoDomainVars === undefined,
    "RAILWAY_ENVIRONMENT unset + no domain vars → undefined (no URL to register)"
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("=== Stripe RAILWAY_ENVIRONMENT guard — unit tests ===");
  console.log(
    "Asserts the domain passed to runStripeSyncInit() for each environment type."
  );

  testPreviewNeverReceivesAppDomain();
  testProductionPrefersAppDomain();
  testProductionFallsBackToRailwayPublicDomain();
  testUnsetRailwayEnvTreatedAsProduction();

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);

  if (failed > 0) {
    console.error(
      `\n${failed} test(s) FAILED — the RAILWAY_ENVIRONMENT guard has regressed!`
    );
    process.exit(1);
  } else {
    console.log(
      `\nAll ${passed} tests PASSED — preview deploy guard is intact.`
    );
  }
}

main();
