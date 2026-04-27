import { Router, type IRouter } from "express";
import { getDb, bankAccountsTable, recurringPaymentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const accounts = await getDb()
    .select()
    .from(bankAccountsTable)
    .where(and(eq(bankAccountsTable.userId, userId), eq(bankAccountsTable.isActive, true)));

  res.json(
    accounts.map((a) => ({
      id: a.id,
      bankName: a.bankName,
      accountType: a.accountType,
      lastFour: a.lastFour,
      isActive: a.isActive,
      connectedAt: a.connectedAt,
    }))
  );
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { bankName, accountType, lastFour } = req.body as {
    bankName: string;
    accountType: "checking" | "savings" | "credit";
    lastFour: string;
  };

  if (!bankName || !accountType || !lastFour) {
    res.status(400).json({ error: "validation_error", message: "bankName, accountType, and lastFour are required" });
    return;
  }

  const [account] = await getDb()
    .insert(bankAccountsTable)
    .values({ userId, bankName, accountType, lastFour })
    .returning();

  // Auto-detect some mock recurring payments for the new account
  await seedPaymentsForAccount(userId, account.id);

  res.status(201).json({
    id: account.id,
    bankName: account.bankName,
    accountType: account.accountType,
    lastFour: account.lastFour,
    isActive: account.isActive,
    connectedAt: account.connectedAt,
  });
});

router.delete("/:accountId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const accountId = parseInt(req.params.accountId as string, 10);

  const [account] = await getDb()
    .select()
    .from(bankAccountsTable)
    .where(and(eq(bankAccountsTable.id, accountId), eq(bankAccountsTable.userId, userId)))
    .limit(1);

  if (!account) {
    res.status(404).json({ error: "not_found", message: "Account not found" });
    return;
  }

  await getDb()
    .update(bankAccountsTable)
    .set({ isActive: false })
    .where(eq(bankAccountsTable.id, accountId));

  res.json({ success: true, message: "Account disconnected" });
});

async function seedPaymentsForAccount(userId: number, accountId: number) {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const samplePayments = [
    {
      merchantName: "Netflix",
      amount: 15.99,
      frequency: "monthly" as const,
      category: "Entertainment",
      cancellationDifficulty: "easy" as const,
      nextChargeDate: nextMonth.toISOString().split("T")[0],
      lastChargeDate: today.toISOString().split("T")[0],
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    },
    {
      merchantName: "Spotify",
      amount: 9.99,
      frequency: "monthly" as const,
      category: "Music",
      cancellationDifficulty: "easy" as const,
      nextChargeDate: nextMonth.toISOString().split("T")[0],
      lastChargeDate: today.toISOString().split("T")[0],
      logoUrl: null,
    },
    {
      merchantName: "Adobe Creative Cloud",
      amount: 54.99,
      frequency: "monthly" as const,
      category: "Software",
      cancellationDifficulty: "hard" as const,
      nextChargeDate: nextMonth.toISOString().split("T")[0],
      lastChargeDate: today.toISOString().split("T")[0],
      logoUrl: null,
    },
    {
      merchantName: "Amazon Prime",
      amount: 14.99,
      frequency: "monthly" as const,
      category: "Shopping",
      cancellationDifficulty: "medium" as const,
      nextChargeDate: nextMonth.toISOString().split("T")[0],
      lastChargeDate: today.toISOString().split("T")[0],
      logoUrl: null,
    },
    {
      merchantName: "Gym Membership",
      amount: 49.99,
      frequency: "monthly" as const,
      category: "Health & Fitness",
      cancellationDifficulty: "hard" as const,
      nextChargeDate: nextMonth.toISOString().split("T")[0],
      lastChargeDate: today.toISOString().split("T")[0],
      logoUrl: null,
    },
  ];

  for (const p of samplePayments) {
    await getDb().insert(recurringPaymentsTable).values({
      userId,
      accountId,
      ...p,
    });
  }
}

export default router;
