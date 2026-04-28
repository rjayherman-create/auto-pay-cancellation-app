export type CancellationStatus =
  | "Not Started"
  | "Letter Created"
  | "Sent"
  | "Waiting"
  | "Canceled"
  | "Still Charging";

export type LetterType =
  | "Cancel Subscription"
  | "Refund Request"
  | "Dispute Continued Charges";

export type AutopayScore =
  | "Easy to cancel"
  | "May require phone call"
  | "May require written notice"
  | "Likely contract / membership issue"
  | "Watch for continued billing";

export type AutopayWorkflowItem = {
  id?: string;
  merchantName: string;
  amount?: number;
  frequency?: string;
  nextChargeDate?: string;
  customerName?: string;
  customerEmail?: string;
  accountLastFour?: string;
};

export type ProofVaultData = {
  generatedLetter?: string;
  dateSent?: string;
  companyName?: string;
  companyContact?: string;
  confirmationNumber?: string;
  notes?: string;
  proofFileNames?: string[];
};

export type CompanyDirectoryEntry = {
  merchantName: string;
  bestMethod: string;
  phone?: string;
  email?: string;
  mailingAddress?: string;
  website?: string;
  notes?: string;
};

export const STATUS_OPTIONS: CancellationStatus[] = [
  "Not Started",
  "Letter Created",
  "Sent",
  "Waiting",
  "Canceled",
  "Still Charging",
];

export const LETTER_TYPES: LetterType[] = [
  "Cancel Subscription",
  "Refund Request",
  "Dispute Continued Charges",
];

export const COMPANY_DIRECTORY: CompanyDirectoryEntry[] = [
  {
    merchantName: "Netflix",
    bestMethod: "Cancel online inside account settings",
    website: "https://www.netflix.com/cancelplan",
    notes: "Usually handled online. Keep confirmation email or screenshot.",
  },
  {
    merchantName: "Spotify",
    bestMethod: "Cancel online inside account settings",
    website: "https://www.spotify.com/account/subscription/",
    notes: "Premium usually remains active until the end of billing period.",
  },
  {
    merchantName: "Hulu",
    bestMethod: "Cancel online inside account settings",
    website: "https://secure.hulu.com/account",
    notes: "Check whether billing is through Hulu, Disney, Roku, Apple, or Amazon.",
  },
  {
    merchantName: "Disney",
    bestMethod: "Cancel online inside account settings",
    website: "https://www.disneyplus.com/account",
    notes: "Check bundle billing if Hulu or ESPN is included.",
  },
  {
    merchantName: "Amazon Prime",
    bestMethod: "Cancel online through Amazon membership settings",
    website: "https://www.amazon.com/prime",
    notes: "Save cancellation confirmation.",
  },
  {
    merchantName: "Apple",
    bestMethod: "Cancel through Apple Subscriptions",
    website: "https://support.apple.com/billing",
    notes: "Many app subscriptions must be canceled through Apple ID settings.",
  },
  {
    merchantName: "Google",
    bestMethod: "Cancel through Google Play subscriptions",
    website: "https://play.google.com/store/account/subscriptions",
    notes: "Many Android app subscriptions must be canceled through Google Play.",
  },
  {
    merchantName: "Planet Fitness",
    bestMethod: "May require club contact, written notice, or in-person cancellation",
    phone: "Check local club phone number",
    mailingAddress: "Check local club address",
    notes: "Gym memberships may have contract terms. Keep written proof.",
  },
  {
    merchantName: "LA Fitness",
    bestMethod: "May require online form, mail, or club contact",
    website: "https://www.lafitness.com",
    notes: "Gym cancellation rules may vary by location and membership type.",
  },
];

function safeKey(value: string): string {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function money(value?: number): string {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function storageKey(type: "status" | "proof", merchantName: string): string {
  return `autopay_${type}_${safeKey(merchantName)}`;
}

export function loadStatus(merchantName: string): CancellationStatus {
  if (typeof window === "undefined") return "Not Started";
  const saved = window.localStorage.getItem(storageKey("status", merchantName));
  return STATUS_OPTIONS.includes(saved as CancellationStatus)
    ? (saved as CancellationStatus)
    : "Not Started";
}

export function saveStatus(merchantName: string, status: CancellationStatus): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey("status", merchantName), status);
}

export function loadProof(merchantName: string): ProofVaultData {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(storageKey("proof", merchantName));
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function saveProof(merchantName: string, data: ProofVaultData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey("proof", merchantName), JSON.stringify(data));
}

export function daysUntil(dateString?: string): number | null {
  if (!dateString) return null;
  const today = new Date();
  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) return null;
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function daysSince(dateString?: string): number | null {
  if (!dateString) return null;
  const today = new Date();
  const past = new Date(dateString);
  if (Number.isNaN(past.getTime())) return null;
  today.setHours(0, 0, 0, 0);
  past.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
}

export function getAutopayScore(
  merchantName: string,
  status?: CancellationStatus
): AutopayScore {
  const name = merchantName.toLowerCase();
  if (status === "Still Charging") return "Watch for continued billing";
  if (
    name.includes("netflix") || name.includes("spotify") || name.includes("hulu") ||
    name.includes("disney") || name.includes("apple") || name.includes("google") ||
    name.includes("youtube") || name.includes("amazon")
  ) return "Easy to cancel";
  if (
    name.includes("gym") || name.includes("fitness") || name.includes("planet fitness") ||
    name.includes("blink") || name.includes("la fitness") || name.includes("ymca")
  ) return "May require phone call";
  if (name.includes("storage") || name.includes("membership") || name.includes("club"))
    return "May require written notice";
  if (
    name.includes("insurance") || name.includes("warranty") ||
    name.includes("loan") || name.includes("lease")
  ) return "Likely contract / membership issue";
  return "May require phone call";
}

export function findDirectoryEntry(merchantName: string): CompanyDirectoryEntry | undefined {
  const name = merchantName.toLowerCase();
  return COMPANY_DIRECTORY.find((entry) => {
    const entryName = entry.merchantName.toLowerCase();
    return name.includes(entryName) || entryName.includes(name);
  });
}

export function getAlertText(item: AutopayWorkflowItem): string[] {
  const alerts: string[] = [];
  const status = loadStatus(item.merchantName);
  const proof = loadProof(item.merchantName);
  const chargeDays = daysUntil(item.nextChargeDate);

  if (chargeDays !== null) {
    if (chargeDays >= 0) {
      alerts.push(`This subscription charges again in ${chargeDays} day${chargeDays === 1 ? "" : "s"}.`);
    } else {
      alerts.push(`This subscription appears to have charged ${Math.abs(chargeDays)} day${Math.abs(chargeDays) === 1 ? "" : "s"} ago.`);
    }
  }

  const sentDays = daysSince(proof.dateSent);
  if ((status === "Sent" || status === "Waiting") && sentDays !== null) {
    const remaining = 10 - sentDays;
    if (remaining > 0) {
      alerts.push(`Follow up if still charging after ${remaining} more day${remaining === 1 ? "" : "s"}.`);
    } else {
      alerts.push("Follow up now if the company is still charging you.");
    }
  }

  if (status === "Still Charging") {
    alerts.push("Consider sending a continued charge dispute letter.");
  }

  return alerts;
}

export function generateWorkflowLetter(params: {
  letterType: LetterType;
  merchantName: string;
  customerName?: string;
  customerEmail?: string;
  accountLastFour?: string;
  amount?: number;
  dateSent?: string;
}): string {
  const today = new Date().toLocaleDateString();
  const name = params.customerName || "[Your Name]";
  const email = params.customerEmail || "[Your Email]";
  const account = params.accountLastFour || "[Last 4 digits or account identifier]";
  const company = params.merchantName || "[Company Name]";
  const amount = params.amount ? money(params.amount) : "[Recent Charge Amount]";
  const sentDate = params.dateSent || "[Original Cancellation Date]";

  if (params.letterType === "Refund Request") {
    return `${today}

To: ${company}

Subject: Cancellation and Refund Request

Hello,

I am requesting cancellation of my account, membership, subscription, or recurring payment with ${company}.

Customer Name: ${name}
Customer Email: ${email}
Account / Card Identifier: ${account}

I am also requesting a refund of the recent charge in the amount of ${amount}. I did not intend to renew or continue this service, and I would like the account canceled to prevent any future recurring charges.

Please confirm in writing that:

1. My account or recurring payment has been canceled.
2. No future charges will be made.
3. My refund request has been reviewed.

Thank you,

${name}`;
  }

  if (params.letterType === "Dispute Continued Charges") {
    return `${today}

To: ${company}

Subject: Continued Charge After Cancellation

Hello,

I previously requested cancellation of my account, membership, subscription, or recurring payment with ${company}.

Customer Name: ${name}
Customer Email: ${email}
Account / Card Identifier: ${account}
Original Cancellation Date: ${sentDate}
Continued Charge Amount: ${amount}

Despite my cancellation request, I noticed that I was charged again. I am requesting that you review this account, stop any future recurring charges, and refund any charges made after my cancellation request.

Please confirm in writing that:

1. The recurring payment has been canceled.
2. No future charges will be made.
3. The continued charge has been reviewed for refund.

Thank you,

${name}`;
  }

  return `${today}

To: ${company}

Subject: Cancellation Request

Hello,

I am requesting cancellation of my account, membership, subscription, or recurring payment with ${company}.

Customer Name: ${name}
Customer Email: ${email}
Account / Card Identifier: ${account}

Please cancel this service and stop all future recurring charges.

Please confirm in writing that:

1. My account or recurring payment has been canceled.
2. No future charges will be made.
3. The cancellation effective date has been recorded.

Thank you,

${name}`;
}
