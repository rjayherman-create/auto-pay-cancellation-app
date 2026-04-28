/**
 * Unit tests for the DB liveness ping (dbLivenessPing.ts).
 *
 * Verifies the behaviours of startDbLivenessPing():
 *   [1] A pool query failure while dbReady=true  → setDbState({ dbReady: false, dbDownSince: <ts> })
 *   [2] Repeated failures while already down     → setDbState called only once (dbDownSince preserved)
 *   [3] A pool query success while dbReady=false → setDbState({ dbReady: true, lastDbPingAt: <ts>, dbDownSince: null })
 *   [4] Steady-state success while dbReady=true  → setDbState({ lastDbPingAt: <ts> }) on every tick
 *   [5] clearInterval on the returned handle stops future ticks (SIGTERM teardown)
 *
 * Run with:
 *   pnpm --filter @workspace/api-server test:db-ping
 *
 * No external services or credentials required — all assertions are against
 * the pure interval callback logic using injected stubs.
 */

import { startDbLivenessPing } from "./dbLivenessPing.js";

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

/** Wait long enough for at least one interval tick to fire. */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── test cases ───────────────────────────────────────────────────────────────

/**
 * [1] Pool query fails while dbReady=true
 *     → setDbState must be called with { dbReady: false } and a dbDownSince timestamp.
 *     → subsequent failures must NOT re-call setDbState (dbDownSince is preserved).
 */
async function testFailureMarksDbNotReady() {
  console.log("\n[1] Pool query fails while dbReady=true → setDbState({ dbReady: false, dbDownSince })");

  let state = { dbReady: true, dbDownSince: null as string | null };
  const setDbStateCalls: Array<Record<string, unknown>> = [];

  const interval = startDbLivenessPing({
    queryPool: async () => { throw new Error("connection refused"); },
    getDbState: () => ({ ...state }),
    setDbState: (s) => {
      Object.assign(state, s);
      setDbStateCalls.push({ ...s });
    },
    intervalMs: 5,
  });

  // Let two ticks fire so we can confirm setDbState is only called once.
  await wait(25);
  clearInterval(interval);

  assert(
    setDbStateCalls.length >= 1,
    "setDbState was called at least once after the query failed"
  );
  assert(
    setDbStateCalls[0].dbReady === false,
    "first setDbState call set dbReady: false"
  );
  assert(
    typeof setDbStateCalls[0].dbDownSince === "string",
    "first setDbState call recorded a dbDownSince timestamp"
  );
  assert(
    setDbStateCalls.length === 1,
    "setDbState called exactly once (idempotent — dbDownSince already set on subsequent ticks)"
  );
}

/**
 * [2] Pool query succeeds while dbReady=false (recovery)
 *     → setDbState must be called with { dbReady: true, lastDbPingAt, dbDownSince: null }.
 *     → after recovery, steady-state success ticks update only lastDbPingAt.
 */
async function testRecoveryMarksDbReady() {
  console.log("\n[2] Pool query succeeds while dbReady=false → recovery with dbReady: true");

  let state = { dbReady: false, dbDownSince: "2026-01-01T00:00:00.000Z" as string | null };
  const setDbStateCalls: Array<Record<string, unknown>> = [];

  const interval = startDbLivenessPing({
    queryPool: async () => { /* success — no throw */ },
    getDbState: () => ({ ...state }),
    setDbState: (s) => {
      Object.assign(state, s);
      setDbStateCalls.push({ ...s });
    },
    intervalMs: 5,
  });

  // Let two ticks fire.
  await wait(25);
  clearInterval(interval);

  assert(
    setDbStateCalls.length >= 1,
    "setDbState was called at least once after the query succeeded"
  );
  assert(
    setDbStateCalls[0].dbReady === true,
    "first setDbState call set dbReady: true"
  );
  assert(
    typeof setDbStateCalls[0].lastDbPingAt === "string",
    "first setDbState call recorded a lastDbPingAt timestamp"
  );
  assert(
    setDbStateCalls[0].dbDownSince === null,
    "first setDbState call cleared dbDownSince (set to null)"
  );
}

/**
 * [3] Steady-state: dbReady=true + query succeeds on every tick
 *     → setDbState is called on every tick to update lastDbPingAt.
 *     → dbReady is NOT changed (stays true).
 */
async function testSteadyStateSuccessUpdatesLastPingAt() {
  console.log("\n[3] Steady-state success while dbReady=true → lastDbPingAt updated each tick");

  let state = { dbReady: true, dbDownSince: null as string | null };
  const setDbStateCalls: Array<Record<string, unknown>> = [];

  const interval = startDbLivenessPing({
    queryPool: async () => { /* success */ },
    getDbState: () => ({ ...state }),
    setDbState: (s) => {
      Object.assign(state, s);
      setDbStateCalls.push({ ...s });
    },
    intervalMs: 5,
  });

  await wait(25);
  clearInterval(interval);

  assert(
    setDbStateCalls.length >= 1,
    "setDbState called each tick to update lastDbPingAt"
  );
  assert(
    setDbStateCalls.every((c) => typeof c.lastDbPingAt === "string"),
    "every call includes a lastDbPingAt string timestamp"
  );
  assert(
    setDbStateCalls.every((c) => c.dbReady === undefined),
    "dbReady is not included (no state change — only lastDbPingAt updated)"
  );
}

/**
 * [4] Steady-state: dbReady=false + query fails on every tick
 *     → setDbState is called once to record dbDownSince if not already set.
 *     → subsequent failure ticks are silent.
 */
async function testSteadyStateFailureSilentAfterFirstRecord() {
  console.log("\n[4] Steady-state failure while dbReady=false → dbDownSince recorded once, then silent");

  // Start with dbDownSince already set (outage already known).
  let state = { dbReady: false, dbDownSince: "2026-01-01T00:00:00.000Z" as string | null };
  const setDbStateCalls: Array<Record<string, unknown>> = [];

  const interval = startDbLivenessPing({
    queryPool: async () => { throw new Error("still down"); },
    getDbState: () => ({ ...state }),
    setDbState: (s) => {
      Object.assign(state, s);
      setDbStateCalls.push({ ...s });
    },
    intervalMs: 5,
  });

  await wait(25);
  clearInterval(interval);

  assert(
    setDbStateCalls.length === 0,
    "setDbState not called when dbReady=false and dbDownSince already set (fully silent)"
  );
}

/**
 * [5] SIGTERM teardown — clearing the returned interval handle stops pings.
 *     After clearInterval() no further setDbState calls should occur.
 */
async function testIntervalTeardown() {
  console.log("\n[5] clearInterval on returned handle stops all future pings (SIGTERM teardown)");

  let queryCallCount = 0;

  const interval = startDbLivenessPing({
    queryPool: async () => { queryCallCount++; },
    getDbState: () => ({ dbReady: false, dbDownSince: null }),
    setDbState: () => {},
    intervalMs: 5,
  });

  // Let a couple of ticks fire, then clear.
  await wait(20);
  const countAtClear = queryCallCount;
  clearInterval(interval);

  // Wait again — no new ticks should fire.
  await wait(20);
  const countAfterClear = queryCallCount;

  assert(
    countAtClear > 0,
    "ping fired at least once before clearInterval (interval was active)"
  );
  assert(
    countAfterClear === countAtClear,
    "no additional pings fired after clearInterval (interval properly stopped)"
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== DB liveness ping — unit tests ===");
  console.log("Verifies that startDbLivenessPing() correctly updates dbReady, lastDbPingAt, and dbDownSince.");

  await testFailureMarksDbNotReady();
  await testRecoveryMarksDbReady();
  await testSteadyStateSuccessUpdatesLastPingAt();
  await testSteadyStateFailureSilentAfterFirstRecord();
  await testIntervalTeardown();

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}  Failed: ${failed}`);

  if (failed > 0) {
    console.error(`\n${failed} test(s) FAILED — the DB liveness ping behaviour has regressed!`);
    process.exit(1);
  } else {
    console.log(`\nAll ${passed} tests PASSED — DB liveness ping is correctly implemented.`);
  }
}

main().catch((err) => {
  console.error("Unexpected error in test runner:", err);
  process.exit(1);
});
