export interface DbState {
  dbReady: boolean;
  lastDbPingAt: string | null;
  dbDownSince: string | null;
}

const state: DbState = {
  dbReady: false,
  lastDbPingAt: null,
  dbDownSince: null,
};

export function setDbState(update: Partial<DbState>): void {
  Object.assign(state, update);
}

export function getDbState(): DbState {
  return { ...state };
}
