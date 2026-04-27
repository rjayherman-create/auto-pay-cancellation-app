export interface DbState {
  dbReady: boolean;
}

const state: DbState = {
  dbReady: false,
};

export function setDbState(update: DbState): void {
  state.dbReady = update.dbReady;
}

export function getDbState(): DbState {
  return { ...state };
}
