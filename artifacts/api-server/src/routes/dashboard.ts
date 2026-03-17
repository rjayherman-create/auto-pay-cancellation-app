import { Router, type IRouter } from "express";
import { db, recurringPaymentsTable, bankAccountsTable, userActionsTable } from "@workspace/db";
import { eq, and, sum } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/summary", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;

  const [activePayments, cancelledPayments, accounts, recentActions] = await Promise.all([
    db
      .select()
      .from(recurringPaymentsTable)
      .where(and(eq(recurringPaymentsTable.userId, userId), eq(recurringPaymentsTable.status, "active"))),
    db
      .select()
      .from(recurringPaymentsTable)
      .where(and(eq(recurringPaymentsTable.userId, userId), eq(recurringPaymentsTable.status, "cancelled"))),
    db
      .select()
      .from(bankAccountsTable)
      .where(and(eq(bankAccountsTable.userId, userId), eq(bankAccountsTable.isActive, true))),
    db
      .select()
      .from(userActionsTable)
      .where(eq(userActionsTable.userId, userId))
      .limit(10),
  ]);

  const totalMonthlySpend = activePayments.reduce((sum, p) => {
    const monthlyAmount =
      p.frequency === "weekly" ? p.amount * 4.33
      : p.frequency === "monthly" ? p.amount
      : p.frequency === "quarterly" ? p.amount / 3
      : p.amount / 12;
    return sum + monthlyAmount;
  }, 0);

  const totalSaved = cancelledPayments.reduce((sum, p) => sum + p.amount, 0);

  // Highlight high-cost subscriptions as potential savings
  const highCost = activePayments.filter((p) => p.amount > 20);
  const potentialMonthlySavings = highCost.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
    activeSubscriptions: activePayments.length,
    cancelledSubscriptions: cancelledPayments.length,
    potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
    totalSaved: Math.round(totalSaved * 100) / 100,
    connectedAccounts: accounts.length,
    recentActivity: recentActions.map((a) => ({
      id: a.id,
      type: a.type,
      merchantName: a.merchantName,
      amount: a.amount,
      date: a.createdAt,
      description: a.description,
    })),
  });
});

export default router;
