import { Router, type IRouter } from "express";
import { db, bankAccountsTable, recurringPaymentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";
import { isDevBypassAllowed } from "../authConfig.js";

const router: IRouter = Router();

// Helper: get or create a demo bank account for the user
async function getOrCreateDemoAccount(userId: number) {
  const [existing] = await db
    .select()
    .from(bankAccountsTable)
    .where(eq(bankAccountsTable.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(bankAccountsTable)
    .values({
      userId,
      bankName: "First National Demo Bank",
      accountType: "checking",
      lastFour: "4242",
      isActive: true,
      plaidAccessToken: "demo-access-token",
      plaidItemId: "demo-item-id",
    })
    .returning();

  return created;
}

// 20 realistic subscriptions for testing and marketing demos
const DEMO_SUBSCRIPTIONS = [
  // ── Streaming ──────────────────────────────────────────────────────────────
  {
    merchantName: "Netflix",
    amount: 15.99,
    frequency: "monthly" as const,
    category: "streaming",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(3),
    nextChargeDate: daysFromNow(27),
  },
  {
    merchantName: "Hulu",
    amount: 17.99,
    frequency: "monthly" as const,
    category: "streaming",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(8),
    nextChargeDate: daysFromNow(22),
  },
  {
    merchantName: "Disney+",
    amount: 13.99,
    frequency: "monthly" as const,
    category: "streaming",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(15),
    nextChargeDate: daysFromNow(15),
  },
  {
    merchantName: "HBO Max",
    amount: 15.99,
    frequency: "monthly" as const,
    category: "streaming",
    status: "cancelled" as const,
    cancellationDifficulty: "medium" as const,
    lastChargeDate: daysAgo(45),
    nextChargeDate: daysFromNow(90),
  },
  // ── Music ──────────────────────────────────────────────────────────────────
  {
    merchantName: "Spotify",
    amount: 10.99,
    frequency: "monthly" as const,
    category: "music",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(1),
    nextChargeDate: daysFromNow(29),
  },
  {
    merchantName: "Apple Music",
    amount: 10.99,
    frequency: "monthly" as const,
    category: "music",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(12),
    nextChargeDate: daysFromNow(18),
  },
  // ── Software / Productivity ────────────────────────────────────────────────
  {
    merchantName: "Adobe Creative Cloud",
    amount: 54.99,
    frequency: "monthly" as const,
    category: "software",
    status: "active" as const,
    cancellationDifficulty: "hard" as const,
    lastChargeDate: daysAgo(5),
    nextChargeDate: daysFromNow(25),
  },
  {
    merchantName: "Microsoft 365",
    amount: 99.99,
    frequency: "annually" as const,
    category: "software",
    status: "active" as const,
    cancellationDifficulty: "medium" as const,
    lastChargeDate: daysAgo(30),
    nextChargeDate: daysFromNow(335),
  },
  {
    merchantName: "Notion",
    amount: 16.00,
    frequency: "monthly" as const,
    category: "software",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(7),
    nextChargeDate: daysFromNow(23),
  },
  {
    merchantName: "Dropbox Plus",
    amount: 11.99,
    frequency: "monthly" as const,
    category: "software",
    status: "disputed" as const,
    cancellationDifficulty: "medium" as const,
    lastChargeDate: daysAgo(2),
    nextChargeDate: daysFromNow(28),
  },
  // ── Cloud Storage ──────────────────────────────────────────────────────────
  {
    merchantName: "Google One",
    amount: 2.99,
    frequency: "monthly" as const,
    category: "cloud storage",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(20),
    nextChargeDate: daysFromNow(10),
  },
  {
    merchantName: "iCloud+",
    amount: 2.99,
    frequency: "monthly" as const,
    category: "cloud storage",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(4),
    nextChargeDate: daysFromNow(26),
  },
  // ── Fitness ────────────────────────────────────────────────────────────────
  {
    merchantName: "Planet Fitness",
    amount: 24.99,
    frequency: "monthly" as const,
    category: "fitness",
    status: "active" as const,
    cancellationDifficulty: "hard" as const,
    lastChargeDate: daysAgo(10),
    nextChargeDate: daysFromNow(20),
  },
  {
    merchantName: "Peloton Membership",
    amount: 44.00,
    frequency: "monthly" as const,
    category: "fitness",
    status: "active" as const,
    cancellationDifficulty: "medium" as const,
    lastChargeDate: daysAgo(6),
    nextChargeDate: daysFromNow(24),
  },
  // ── Food / Delivery ────────────────────────────────────────────────────────
  {
    merchantName: "HelloFresh",
    amount: 71.94,
    frequency: "monthly" as const,
    category: "food delivery",
    status: "active" as const,
    cancellationDifficulty: "hard" as const,
    lastChargeDate: daysAgo(7),
    nextChargeDate: daysFromNow(7),
  },
  {
    merchantName: "DoorDash DashPass",
    amount: 9.99,
    frequency: "monthly" as const,
    category: "food delivery",
    status: "active" as const,
    cancellationDifficulty: "easy" as const,
    lastChargeDate: daysAgo(14),
    nextChargeDate: daysFromNow(16),
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    merchantName: "Amazon Prime",
    amount: 14.99,
    frequency: "monthly" as const,
    category: "shopping",
    status: "active" as const,
    cancellationDifficulty: "medium" as const,
    lastChargeDate: daysAgo(22),
    nextChargeDate: daysFromNow(8),
  },
  // ── News / Media ───────────────────────────────────────────────────────────
  {
    merchantName: "New York Times",
    amount: 25.00,
    frequency: "monthly" as const,
    category: "news",
    status: "active" as const,
    cancellationDifficulty: "hard" as const,
    lastChargeDate: daysAgo(16),
    nextChargeDate: daysFromNow(14),
  },
  {
    merchantName: "Wall Street Journal",
    amount: 38.99,
    frequency: "monthly" as const,
    category: "news",
    status: "disputed" as const,
    cancellationDifficulty: "hard" as const,
    lastChargeDate: daysAgo(9),
    nextChargeDate: daysFromNow(21),
  },
  // ── Misc ───────────────────────────────────────────────────────────────────
  {
    merchantName: "Audible",
    amount: 14.95,
    frequency: "monthly" as const,
    category: "books",
    status: "active" as const,
    cancellationDifficulty: "medium" as const,
    lastChargeDate: daysAgo(18),
    nextChargeDate: daysFromNow(12),
  },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// POST /api/admin/seed-demo
// Resets the current user's data to a rich marketing/testing dataset.
// Only available in development or when ENABLE_DEV_BYPASS=true.
router.post("/seed-demo", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!isDevBypassAllowed()) {
    res.status(403).json({ error: "forbidden", message: "Demo seeding is not available in production." });
    return;
  }

  try {
    const userId = req.userId!;
    const account = await getOrCreateDemoAccount(userId);

    // Clear existing payments for this user
    await db
      .delete(recurringPaymentsTable)
      .where(eq(recurringPaymentsTable.userId, userId));

    // Insert all demo subscriptions
    await db.insert(recurringPaymentsTable).values(
      DEMO_SUBSCRIPTIONS.map((sub) => ({
        userId,
        accountId: account.id,
        merchantName: sub.merchantName,
        amount: sub.amount,
        frequency: sub.frequency,
        category: sub.category,
        status: sub.status,
        cancellationDifficulty: sub.cancellationDifficulty,
        lastChargeDate: sub.lastChargeDate,
        nextChargeDate: sub.nextChargeDate,
        currency: "USD",
      }))
    );

    res.json({
      success: true,
      count: DEMO_SUBSCRIPTIONS.length,
      message: `Loaded ${DEMO_SUBSCRIPTIONS.length} demo subscriptions.`,
    });
  } catch (err: any) {
    console.error("[Admin] seed-demo error:", err.message);
    res.status(500).json({ error: "server_error", message: err.message });
  }
});

export default router;
