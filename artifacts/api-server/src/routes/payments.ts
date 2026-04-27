import { Router, type IRouter } from "express";
import { db, recurringPaymentsTable, userActionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { status, accountId } = req.query as { status?: string; accountId?: string };

  let conditions = [eq(recurringPaymentsTable.userId, userId)];

  if (status && ["active", "cancelled", "disputed"].includes(status)) {
    conditions.push(eq(recurringPaymentsTable.status, status as "active" | "cancelled" | "disputed"));
  }

  if (accountId) {
    const aid = parseInt(accountId, 10);
    if (!isNaN(aid)) {
      conditions.push(eq(recurringPaymentsTable.accountId, aid));
    }
  }

  const payments = await db
    .select()
    .from(recurringPaymentsTable)
    .where(and(...conditions));

  res.json(
    payments.map((p) => ({
      id: p.id,
      merchantName: p.merchantName,
      amount: p.amount,
      currency: p.currency,
      frequency: p.frequency,
      category: p.category,
      status: p.status,
      nextChargeDate: p.nextChargeDate,
      lastChargeDate: p.lastChargeDate,
      accountId: p.accountId,
      cancellationDifficulty: p.cancellationDifficulty,
      logoUrl: p.logoUrl,
    }))
  );
});

router.get("/:paymentId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const paymentId = parseInt(String(req.params.paymentId), 10);

  const [payment] = await db
    .select()
    .from(recurringPaymentsTable)
    .where(and(eq(recurringPaymentsTable.id, paymentId), eq(recurringPaymentsTable.userId, userId)))
    .limit(1);

  if (!payment) {
    res.status(404).json({ error: "not_found", message: "Payment not found" });
    return;
  }

  res.json({
    id: payment.id,
    merchantName: payment.merchantName,
    amount: payment.amount,
    currency: payment.currency,
    frequency: payment.frequency,
    category: payment.category,
    status: payment.status,
    nextChargeDate: payment.nextChargeDate,
    lastChargeDate: payment.lastChargeDate,
    accountId: payment.accountId,
    cancellationDifficulty: payment.cancellationDifficulty,
    logoUrl: payment.logoUrl,
  });
});

router.patch("/:paymentId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const paymentId = parseInt(String(req.params.paymentId), 10);
  const { status } = req.body as { status: "active" | "cancelled" | "disputed" };

  if (!status || !["active", "cancelled", "disputed"].includes(status)) {
    res.status(400).json({ error: "validation_error", message: "Valid status required" });
    return;
  }

  const [payment] = await db
    .select()
    .from(recurringPaymentsTable)
    .where(and(eq(recurringPaymentsTable.id, paymentId), eq(recurringPaymentsTable.userId, userId)))
    .limit(1);

  if (!payment) {
    res.status(404).json({ error: "not_found", message: "Payment not found" });
    return;
  }

  const [updated] = await db
    .update(recurringPaymentsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(recurringPaymentsTable.id, paymentId))
    .returning();

  // Log the action
  if (status === "cancelled") {
    await db.insert(userActionsTable).values({
      userId,
      type: "cancelled",
      merchantName: payment.merchantName,
      amount: payment.amount,
      description: `Successfully cancelled ${payment.merchantName} subscription ($${payment.amount}/month)`,
    });
  } else if (status === "disputed") {
    await db.insert(userActionsTable).values({
      userId,
      type: "disputed",
      merchantName: payment.merchantName,
      amount: payment.amount,
      description: `Opened dispute for ${payment.merchantName} charge ($${payment.amount})`,
    });
  }

  res.json({
    id: updated.id,
    merchantName: updated.merchantName,
    amount: updated.amount,
    currency: updated.currency,
    frequency: updated.frequency,
    category: updated.category,
    status: updated.status,
    nextChargeDate: updated.nextChargeDate,
    lastChargeDate: updated.lastChargeDate,
    accountId: updated.accountId,
    cancellationDifficulty: updated.cancellationDifficulty,
    logoUrl: updated.logoUrl,
  });
});

router.get("/:paymentId/workflow", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const paymentId = parseInt(String(req.params.paymentId), 10);

  const [payment] = await db
    .select()
    .from(recurringPaymentsTable)
    .where(and(eq(recurringPaymentsTable.id, paymentId), eq(recurringPaymentsTable.userId, userId)))
    .limit(1);

  if (!payment) {
    res.status(404).json({ error: "not_found", message: "Payment not found" });
    return;
  }

  const workflow = generateCancellationWorkflow(payment.merchantName, payment.cancellationDifficulty);
  res.json(workflow);
});

function generateCancellationWorkflow(merchantName: string, difficulty: string) {
  const workflows: Record<string, object> = {
    netflix: {
      merchantName: "Netflix",
      difficulty: "easy",
      cancellationUrl: "https://www.netflix.com/cancelplan",
      estimatedTime: "2-3 minutes",
      tips: [
        "Your account remains active until the end of the billing period",
        "You can restart your membership at any time",
      ],
      steps: [
        { stepNumber: 1, title: "Sign In", description: "Go to netflix.com and sign in to your account", actionType: "navigate", actionUrl: "https://netflix.com" },
        { stepNumber: 2, title: "Account Settings", description: "Click your profile icon in the top right, then select 'Account'", actionType: "click" },
        { stepNumber: 3, title: "Cancel Membership", description: "Scroll down to the 'Membership & Billing' section and click 'Cancel Membership'", actionType: "click", actionUrl: "https://www.netflix.com/cancelplan" },
        { stepNumber: 4, title: "Confirm Cancellation", description: "Click 'Finish Cancellation' to confirm", actionType: "click" },
      ],
    },
    spotify: {
      merchantName: "Spotify",
      difficulty: "easy",
      cancellationUrl: "https://www.spotify.com/account/subscription/",
      estimatedTime: "3-5 minutes",
      tips: [
        "After cancellation, you'll be switched to the free plan",
        "You keep your playlists and saved music",
      ],
      steps: [
        { stepNumber: 1, title: "Visit Account Page", description: "Go to spotify.com and log in to your account", actionType: "navigate", actionUrl: "https://www.spotify.com/account/" },
        { stepNumber: 2, title: "Subscription Settings", description: "Click 'Subscription' in the left sidebar", actionType: "click" },
        { stepNumber: 3, title: "Change Plan", description: "Click 'Change plan' button", actionType: "click" },
        { stepNumber: 4, title: "Cancel Premium", description: "Scroll to bottom and click 'Cancel Premium'", actionType: "click" },
        { stepNumber: 5, title: "Confirm", description: "Follow the prompts to confirm cancellation", actionType: "click" },
      ],
    },
  };

  const lowerMerchant = merchantName.toLowerCase().replace(/\s/g, "");
  const known = workflows[lowerMerchant];
  if (known) return known;

  // Generic workflow
  return {
    merchantName,
    difficulty,
    estimatedTime: difficulty === "easy" ? "5 minutes" : difficulty === "medium" ? "10-15 minutes" : "20-30 minutes",
    tips: [
      "Keep records of all cancellation attempts",
      "Screenshot or save confirmation emails",
      "If the merchant won't cancel, use your bank's stop-payment option",
    ],
    steps: [
      { stepNumber: 1, title: "Find Account Page", description: `Visit ${merchantName}'s website and log in to your account`, actionType: "navigate" },
      { stepNumber: 2, title: "Go to Settings", description: "Navigate to Account Settings, Membership, or Billing section", actionType: "click" },
      { stepNumber: 3, title: "Find Cancellation", description: "Look for 'Cancel', 'Cancel Subscription', or 'Cancel Membership' link", actionType: "click" },
      { stepNumber: 4, title: "Confirm Cancellation", description: "Follow the prompts and confirm your cancellation. Save any confirmation number or email", actionType: "click" },
      ...(difficulty === "hard" ? [
        { stepNumber: 5, title: "If Unsuccessful", description: `Call ${merchantName} customer support or use live chat to request cancellation`, actionType: "call" },
        { stepNumber: 6, title: "Bank Option", description: "If the merchant still won't cancel, use our ACH Revocation Letter or Stop Payment Request to block future charges through your bank", actionType: "email" },
      ] : []),
    ],
  };
}

export default router;
