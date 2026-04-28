/**
 * Unit tests for the Replit-path domain resolution helper
 * (resolveReplitWebhookDomain in stripeEnvGuard.ts).
 *
 * Covers:
 *   [1] APP_DOMAIN is preferred when set
 *   [2] REPLIT_DOMAINS is used as a fallback when APP_DOMAIN is absent
 *   [3] Multi-domain REPLIT_DOMAINS — only the first entry is used
 *   [4] Neither variable set → undefined (webhook registration skipped)
 *
 * Run with:
 *   pnpm --filter @workspace/api-server test:replit-domain
 *
 * No external services or credentials are required — all assertions are
 * purely against the domain-resolution logic.
 */

import { resolveReplitWebhookDomain } from "./stripeEnvGuard.js";

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
 * [1] APP_DOMAIN is preferred.
 *
 * When APP_DOMAIN is set it should always be returned, even when
 * REPLIT_DOMAINS is also present.
 */
function testAppDomainPreferred() {
  console.log("\n[1] APP_DOMAIN is preferred over REPLIT_DOMAINS");

  const domainBothSet = resolveReplitWebhookDomain({
    APP_DOMAIN: "app.example.com",
    REPLIT_DOMAINS: "repl1.replit.dev,repl2.replit.dev",
  });
  assert(
    domainBothSet === "app.example.com",
    "APP_DOMAIN + REPLIT_DOMAINS both set → APP_DOMAIN is returned"
  );

  const domainAppOnly = resolveReplitWebhookDomain({
    APP_DOMAIN: "app.example.com",
  });
  assert(
    domainAppOnly === "app.example.com",
    "Only APP_DOMAIN set → APP_DOMAIN is returned"
  );
}

/**
 * [2] REPLIT_DOMAINS fallback — single domain.
 *
 * When APP_DOMAIN is absent and REPLIT_DOMAINS contains a single entry,
 * that entry is returned.
 */
function testReplitDomainsFallbackSingle() {
  console.log("\n[2] REPLIT_DOMAINS fallback (single domain)");

  const domain = resolveReplitWebhookDomain({
    REPLIT_DOMAINS: "my-repl.replit.dev",
  });
  assert(
    domain === "my-repl.replit.dev",
    "APP_DOMAIN absent + single REPLIT_DOMAINS → that domain is returned"
  );
}

/**
 * [3] Multi-domain REPLIT_DOMAINS — first entry only.
 *
 * When REPLIT_DOMAINS is a comma-separated list only the first entry
 * should be used.
 */
function testReplitDomainsMultiFirstEntryUsed() {
  console.log("\n[3] Multi-domain REPLIT_DOMAINS — first entry is used");

  const domain = resolveReplitWebhookDomain({
    REPLIT_DOMAINS: "first.replit.dev,second.replit.dev,third.replit.dev",
  });
  assert(
    domain === "first.replit.dev",
    "Multiple REPLIT_DOMAINS → first entry is returned"
  );
  assert(
    domain !== "second.replit.dev",
    "Multiple REPLIT_DOMAINS → second entry is NOT returned"
  );
  assert(
    domain !== "third.replit.dev",
    "Multiple REPLIT_DOMAINS → third entry is NOT returned"
  );

  // Whitespace around entries should not affect selection.
  const domainWithSpaces = resolveReplitWebhookDomain({
    REPLIT_DOMAINS: " first-spaced.replit.dev , second.replit.dev",
  });
  assert(
    domainWithSpaces === "first-spaced.replit.dev",
    "REPLIT_DOMAINS with surrounding spaces → first entry is trimmed and returned"
  );
}

/**
 * [4] No domain variables → undefined.
 *
 * When neither APP_DOMAIN nor REPLIT_DOMAINS is set the helper returns
 * undefined so that runStripeSyncInit() can skip webhook registration.
 */
function testNoDomainVarsReturnsUndefined() {
  console.log("\n[4] No domain variables → undefined");

  const domainEmpty = resolveReplitWebhookDomain({});
  assert(
    domainEmpty === undefined,
    "No domain vars → undefined (webhook registration skipped)"
  );

  // An empty string is treated as not set.
  const domainEmptyStrings = resolveReplitWebhookDomain({
    APP_DOMAIN: "",
    REPLIT_DOMAINS: "",
  });
  assert(
    domainEmptyStrings === undefined,
    "Empty APP_DOMAIN + empty REPLIT_DOMAINS → undefined"
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("=== Replit-path webhook domain resolution — unit tests ===");
  console.log(
    "Asserts the domain passed to runStripeSyncInit() on the Replit platform."
  );

  testAppDomainPreferred();
  testReplitDomainsFallbackSingle();
  testReplitDomainsMultiFirstEntryUsed();
  testNoDomainVarsReturnsUndefined();

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);

  if (failed > 0) {
    console.error(
      `\n${failed} test(s) FAILED — the Replit domain resolution has regressed!`
    );
    process.exit(1);
  } else {
    console.log(
      `\nAll ${passed} tests PASSED — Replit domain resolution is intact.`
    );
  }
}

main();
