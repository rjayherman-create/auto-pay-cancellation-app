import { Router, type IRouter } from "express";
import { db, bankAccountsTable, recurringPaymentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID?.trim();
const PLAID_SECRET = process.env.PLAID_SECRET?.trim();
const PLAID_ENV = (process.env.PLAID_ENV || "sandbox").trim();
const PLAID_BASE = `https://${PLAID_ENV}.plaid.com`;

const plaidAvailable = Boolean(PLAID_CLIENT_ID && PLAID_SECRET);

if (!plaidAvailable) {
  console.warn("[Plaid] PLAID_CLIENT_ID and PLAID_SECRET are not set — running in demo mode.");
} else {
  console.log(`[Plaid] Credentials loaded. Environment: ${PLAID_ENV} (${PLAID_BASE})`);
}

async function plaidRequest(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${PLAID_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      ...body,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    console.error("[Plaid] API error:", JSON.stringify(err));
    throw new Error(err.error_message || `Plaid error: ${res.status}`);
  }

  return res.json();
}

// POST /api/plaid/create-link-token
// Creates a Plaid Link token for the frontend to open the Plaid modal
router.post("/create-link-token", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;

  if (!plaidAvailable) {
    // Demo mode: return a fake token
    res.json({
      link_token: "demo-link-token",
      demo_mode: true,
      message: "Plaid is running in demo mode. Add PLAID_CLIENT_ID and PLAID_SECRET to enable real bank connections.",
    });
    return;
  }

  try {
    const data = await plaidRequest("/link/token/create", {
      user: { client_user_id: String(userId) },
      client_name: "Auto-Pay Cancel Assistant",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
    }) as any;

    res.json({ link_token: data.link_token });
  } catch (err: any) {
    console.error("[Plaid] create-link-token failed:", err.message);
    res.status(500).json({ error: "plaid_error", message: err.message });
  }
});

// POST /api/plaid/exchange-token
// Exchanges Plaid public_token for access_token and fetches account/transaction data
router.post("/exchange-token", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { public_token, institution_name } = req.body as {
    public_token: string;
    institution_name?: string;
  };

  if (!public_token) {
    res.status(400).json({ error: "validation_error", message: "public_token is required" });
    return;
  }

  // Demo mode — simulate connecting
  if (!plaidAvailable || public_token === "demo-link-token") {
    const [account] = await db
      .insert(bankAccountsTable)
      .values({
        userId,
        bankName: institution_name || "Demo Bank",
        accountType: "checking",
        lastFour: String(Math.floor(1000 + Math.random() * 9000)),
        plaidAccessToken: "demo-access-token",
      })
      .returning();

    await seedDemoPayments(userId, account.id);

    res.json({
      success: true,
      account: {
        id: account.id,
        bankName: account.bankName,
        lastFour: account.lastFour,
      },
      demo_mode: true,
    });
    return;
  }

  // Real Plaid flow
  const exchangeData = await plaidRequest("/item/public_token/exchange", {
    public_token,
  }) as any;

  const accessToken = exchangeData.access_token;

  // Fetch account details
  const accountsData = await plaidRequest("/accounts/get", {
    access_token: accessToken,
  }) as any;

  const plaidAccounts = accountsData.accounts || [];
  const firstAccount = plaidAccounts[0];

  const [account] = await db
    .insert(bankAccountsTable)
    .values({
      userId,
      bankName: institution_name || accountsData.item?.institution_id || "Connected Bank",
      accountType: (firstAccount?.subtype as "checking" | "savings" | "credit") || "checking",
      lastFour: firstAccount?.mask || "0000",
      plaidAccessToken: accessToken,
    })
    .returning();

  // Fetch and analyze transactions for recurring payments
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const txData = await plaidRequest("/transactions/get", {
    access_token: accessToken,
    start_date: ninetyDaysAgo.toISOString().split("T")[0],
    end_date: today.toISOString().split("T")[0],
    options: { count: 500 },
  }) as any;

  const transactions = txData.transactions || [];
  const recurring = detectRecurring(transactions);

  // Upsert recurring payments
  for (const r of recurring) {
    await db.insert(recurringPaymentsTable).values({
      userId,
      accountId: account.id,
      merchantName: r.name,
      amount: r.amount,
      frequency: r.cycle as "weekly" | "monthly" | "quarterly" | "annually",
      category: r.category,
      nextChargeDate: new Date().toISOString().split("T")[0],
      currency: "USD",
      cancellationDifficulty: "medium",
    }).onConflictDoNothing();
  }

  res.json({
    success: true,
    account: {
      id: account.id,
      bankName: account.bankName,
      lastFour: account.lastFour,
    },
    recurringCount: recurring.length,
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectRecurring(transactions: any[]) {
  const merchantAmounts = new Map<string, number[]>();

  for (const tx of transactions) {
    const name = tx.merchant_name || tx.name;
    if (!name) continue;

    const key = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const existing = merchantAmounts.get(key) || [];
    existing.push(Math.abs(tx.amount));
    merchantAmounts.set(key, existing);
  }

  const recurring = [];

  for (const [key, amounts] of merchantAmounts.entries()) {
    if (amounts.length >= 2) {
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const name = transactions.find(
        (tx) =>
          (tx.merchant_name || tx.name)
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, "") === key
      )?.merchant_name || key;

      recurring.push({
        name,
        amount: Math.round(avgAmount * 100) / 100,
        cycle: amounts.length >= 6 ? "weekly" : "monthly",
        category: guessCategory(name),
      });
    }
  }

  return recurring.slice(0, 20);
}

function guessCategory(name: string): string {
  const lc = name.toLowerCase();
  if (/netflix|hulu|disney|hbo|peacock|paramount|apple tv|youtube/.test(lc)) return "streaming";
  if (/spotify|apple music|tidal|pandora|deezer/.test(lc)) return "music";
  if (/gym|fitness|equinox|planet fitness|peloton/.test(lc)) return "fitness";
  if (/adobe|microsoft|google|dropbox|box|notion/.test(lc)) return "software";
  if (/amazon|prime/.test(lc)) return "shopping";
  return "subscription";
}

async function seedDemoPayments(userId: number, accountId: number) {
  const demos = [
    { merchantName: "Netflix", amount: "15.99", billingCycle: "monthly", category: "streaming" },
    { merchantName: "Spotify", amount: "9.99", billingCycle: "monthly", category: "music" },
    { merchantName: "Adobe Creative Cloud", amount: "54.99", billingCycle: "monthly", category: "software" },
    { merchantName: "Amazon Prime", amount: "14.99", billingCycle: "monthly", category: "shopping" },
    { merchantName: "Planet Fitness", amount: "24.99", billingCycle: "monthly", category: "fitness" },
  ];

  for (const demo of demos) {
    const existing = await db
      .select()
      .from(recurringPaymentsTable)
      .where(
        and(
          eq(recurringPaymentsTable.userId, userId),
          eq(recurringPaymentsTable.merchantName, demo.merchantName)
        )
      );

    if (existing.length === 0) {
      await db.insert(recurringPaymentsTable).values({
        userId,
        accountId,
        merchantName: demo.merchantName,
        amount: parseFloat(demo.amount),
        frequency: demo.billingCycle as "weekly" | "monthly" | "quarterly" | "annually",
        category: demo.category,
        nextChargeDate: new Date().toISOString().split("T")[0],
        currency: "USD",
        cancellationDifficulty: "medium",
      });
    }
  }
}

export default router;
