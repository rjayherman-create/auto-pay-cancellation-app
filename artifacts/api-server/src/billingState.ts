export interface BillingState {
  billingActive: boolean;
  keyPrefix?: string;
}

const state: BillingState = {
  billingActive: false,
};

export function setBillingState(update: BillingState): void {
  state.billingActive = update.billingActive;
  state.keyPrefix = update.keyPrefix;
}

export function getBillingState(): BillingState {
  return { ...state };
}
