export type CancellationStatus =
  | "Not Started"
  | "Letter Created"
  | "Sent"
  | "Waiting"
  | "Canceled"
  | "Still Charging";

export type LetterType =
  | "Cancel Subscription"
  | "Request Refund"
  | "Dispute Continued Charges";

export type AutopayItem = {
  id?: string;
  merchantName: string;
  amount: number;
  frequency?: string;
  nextChargeDate?: string;
};

export type ProofVaultData = {
  notes?: string;
  dateSent?: string;
  confirmationNumber?: string;
  companyContact?: string;
};

export function money(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function getMonthlyAmount(item: AutopayItem): number {
  const amount = Number(item.amount || 0);
  const frequency = String(item.frequency || "monthly").toLowerCase();

  if (frequency.includes("year")) return amount / 12;
  if (frequency.includes("annual")) return amount / 12;
  if (frequency.includes("week")) return amount * 4.33;
  if (frequency.includes("day")) return amount * 30;
  return amount;
}

export function calculateAutopaySummary(items: AutopayItem[]) {
  const monthlyTotal = items.reduce((sum, item) => sum + getMonthlyAmount(item), 0);
  const yearlyTotal = monthlyTotal * 12;

  return {
    count: items.length,
    monthlyTotal,
    yearlyTotal,
  };
}

function safeKey(value: string): string {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function getStatusStorageKey(merchantName: string): string {
  return `autopay_cancel_status_${safeKey(merchantName)}`;
}

export function getProofStorageKey(merchantName: string): string {
  return `autopay_proof_${safeKey(merchantName)}`;
}

export function loadStatus(merchantName: string): CancellationStatus {
  if (typeof window === "undefined") return "Not Started";
  const saved = window.localStorage.getItem(getStatusStorageKey(merchantName));
  const allowed: CancellationStatus[] = [
    "Not Started",
    "Letter Created",
    "Sent",
    "Waiting",
    "Canceled",
    "Still Charging",
  ];
  return allowed.includes(saved as CancellationStatus)
    ? (saved as CancellationStatus)
    : "Not Started";
}

export function saveStatus(merchantName: string, status: CancellationStatus) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStatusStorageKey(merchantName), status);
}

export function loadProof(merchantName: string): ProofVaultData {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(getProofStorageKey(merchantName));
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveProof(merchantName: string, data: ProofVaultData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getProofStorageKey(merchantName), JSON.stringify(data));
}

export function generateAutopayLetter(params: {
  letterType: LetterType;
  merchantName: string;
  customerName?: string;
  customerEmail?: string;
  accountLastFour?: string;
  amount?: number;
  dateSent?: string;
}): string {
  const {
    letterType,
    merchantName,
    customerName,
    customerEmail,
    accountLastFour,
    amount,
    dateSent,
  } = params;

  const today = new Date().toLocaleDateString();
  const name = customerName || "[Your Name]";
  const email = customerEmail || "[Your Email]";
  const lastFour = accountLastFour || "[Last 4 digits or account identifier]";
  const chargeAmount = amount ? money(amount) : "[Charge Amount]";
  const sentDate = dateSent || "[Date cancellation was sent]";

  if (letterType === "Request Refund") {
    return `${today}

To: ${merchantName}

Subject: Cancellation and Refund Request

Hello,

I am requesting cancellation of my account, membership, or recurring payment with ${merchantName}.

Customer Name: ${name}
Customer Email: ${email}
Account / Card Identifier: ${lastFour}

I am also requesting a refund of the recent charge in the amount of ${chargeAmount}. I did not intend to continue this service and would like the account canceled to prevent any future recurring charges.

Please confirm in writing that:
1. My account or recurring payment has been canceled.
2. No future charges will be made.
3. My refund request has been reviewed.

Thank you,

${name}`;
  }

  if (letterType === "Dispute Continued Charges") {
    return `${today}

To: ${merchantName}

Subject: Continued Charge After Cancellation

Hello,

I previously requested cancellation of my account, membership, or recurring payment with ${merchantName}.

Customer Name: ${name}
Customer Email: ${email}
Account / Card Identifier: ${lastFour}
Original Cancellation Date: ${sentDate}
Continued Charge Amount: ${chargeAmount}

Despite my cancellation request, I noticed that I was charged again. I am requesting that you review this account, stop any future recurring charges, and refund any charges made after my cancellation request.

Please provide written confirmation that:
1. The recurring payment has been canceled.
2. No future charges will be made.
3. The continued charge has been reviewed for refund.

Thank you,

${name}`;
  }

  return `${today}

To: ${merchantName}

Subject: Cancellation Request

Hello,

I am requesting cancellation of my account, membership, subscription, or recurring payment with ${merchantName}.

Customer Name: ${name}
Customer Email: ${email}
Account / Card Identifier: ${lastFour}

Please cancel this service and stop all future recurring charges.

Please confirm in writing that:
1. My account or recurring payment has been canceled.
2. No future charges will be made.
3. The cancellation effective date has been recorded.

Thank you,

${name}`;
}
