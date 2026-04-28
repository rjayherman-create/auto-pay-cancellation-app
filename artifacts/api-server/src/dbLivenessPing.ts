/**
 * Periodic DB liveness ping.
 *
 * Separated from index.ts so it can be unit-tested without importing the
 * full server entry point (which starts Express and reads environment vars).
 */

export interface DbLivenessPingDeps {
  /** Execute a lightweight query against the DB pool. Should throw on error. */
  queryPool: () => Promise<void>;
  /** Read the current DB-ready state. */
  getDbState: () => { dbReady: boolean; dbDownSince: string | null };
  /** Write a new DB-ready state (partial merge). */
  setDbState: (state: {
    dbReady?: boolean;
    lastDbPingAt?: string | null;
    dbDownSince?: string | null;
  }) => void;
  /** Interval between pings in milliseconds. */
  intervalMs: number;
}

/**
 * Start the periodic liveness ping.
 *
 * Calls `queryPool` on every tick.
 *
 * On success:
 *   - Always records `lastDbPingAt` with the current timestamp.
 *   - If `dbReady` was false (recovering), sets `dbReady: true` and
 *     clears `dbDownSince`.
 *
 * On failure:
 *   - If `dbReady` was true (first failure), sets `dbReady: false` and
 *     records `dbDownSince` with the current timestamp.
 *   - Subsequent failures while already down are silent (dbDownSince is
 *     preserved so callers know when the outage started).
 *
 * Returns the interval handle so the caller can clear it on shutdown.
 */
export function startDbLivenessPing(deps: DbLivenessPingDeps): NodeJS.Timeout {
  const { queryPool, getDbState, setDbState, intervalMs } = deps;

  const interval = setInterval(async () => {
    const now = new Date().toISOString();
    try {
      await queryPool();
      const { dbReady } = getDbState();
      if (!dbReady) {
        console.log("[DB] Liveness ping recovered — marking DB ready.");
        setDbState({ dbReady: true, lastDbPingAt: now, dbDownSince: null });
      } else {
        setDbState({ lastDbPingAt: now });
      }
    } catch (err: any) {
      const { dbReady, dbDownSince } = getDbState();
      if (dbReady) {
        console.error("[DB] Liveness ping failed — marking DB not ready:", err.message);
        setDbState({ dbReady: false, dbDownSince: now });
      } else if (!dbDownSince) {
        setDbState({ dbDownSince: now });
      }
    }
  }, intervalMs);

  return interval;
}
