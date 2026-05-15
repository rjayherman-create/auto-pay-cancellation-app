import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, paymentDisputesTable } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

const PAYMENT_TYPES = ["ACH", "CARD"] as const;
const STATUSES = [
  "draft",
  "generated",
  "sent_to_merchant",
  "sent_to_bank",
  "waiting",
  "resolved",
  "still_charging",
] as const;
type DisputePaymentType = (typeof PAYMENT_TYPES)[number];
type DisputeStatus = (typeof STATUSES)[number];
const VALID_PAYMENT_TYPES = new Set<DisputePaymentType>(PAYMENT_TYPES);
const VALID_STATUSES = new Set<DisputeStatus>(STATUSES);

function isDisputePaymentType(value: string): value is DisputePaymentType {
  return VALID_PAYMENT_TYPES.has(value as DisputePaymentType);
}

function isDisputeStatus(value: string): value is DisputeStatus {
  return VALID_STATUSES.has(value as DisputeStatus);
}

function mapDispute(dispute: typeof paymentDisputesTable.$inferSelect) {
  return {
    id: dispute.id,
    merchantName: dispute.merchantName,
    bankName: dispute.bankName,
    paymentType: dispute.paymentType,
    accountLast4: dispute.accountLast4,
    lastChargeAmount: dispute.lastChargeAmount,
    lastChargeDate: dispute.lastChargeDate,
    cancellationDate: dispute.cancellationDate,
    disputeReason: dispute.disputeReason,
    status: dispute.status,
    evidenceFiles: dispute.evidenceFiles,
    generatedLetter: dispute.generatedLetter,
    createdAt: dispute.createdAt,
    updatedAt: dispute.updatedAt,
  };
}

router.post("/create", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const body = req.body as {
      merchantName?: string;
      bankName?: string;
      paymentType?: string;
      accountLast4?: string;
      lastChargeAmount?: string;
      lastChargeDate?: string;
      cancellationDate?: string;
      disputeReason?: string;
      status?: string;
      evidenceFiles?: unknown;
      generatedLetter?: string;
    };

    if (!body.merchantName?.trim() || !body.bankName?.trim()) {
      res.status(400).json({ success: false, error: "merchantName and bankName are required" });
      return;
    }

    const paymentType = body.paymentType?.toUpperCase() || "ACH";
    if (!isDisputePaymentType(paymentType)) {
      res.status(400).json({ success: false, error: "paymentType must be ACH or CARD" });
      return;
    }

    const status = body.status || "draft";
    if (!isDisputeStatus(status)) {
      res.status(400).json({ success: false, error: "Invalid dispute status" });
      return;
    }

    const [created] = await db
      .insert(paymentDisputesTable)
      .values({
        userId,
        merchantName: body.merchantName.trim(),
        bankName: body.bankName.trim(),
        paymentType,
        accountLast4: body.accountLast4 || null,
        lastChargeAmount: body.lastChargeAmount || null,
        lastChargeDate: body.lastChargeDate || null,
        cancellationDate: body.cancellationDate || null,
        disputeReason: body.disputeReason || null,
        status,
        evidenceFiles: body.evidenceFiles ?? null,
        generatedLetter: body.generatedLetter || null,
      })
      .returning();

    return res.json({
      success: true,
      message: "Dispute created",
      data: mapDispute(created),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Failed to create dispute",
    });
  }
});

router.post("/generate-letter", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const {
      disputeId,
      merchantName,
      bankName,
      paymentType,
      lastChargeAmount,
      lastChargeDate,
      disputeReason,
    } = req.body as {
      disputeId?: number;
      merchantName?: string;
      bankName?: string;
      paymentType?: string;
      lastChargeAmount?: string;
      lastChargeDate?: string;
      disputeReason?: string;
    };

    if (!merchantName?.trim() || !bankName?.trim()) {
      res.status(400).json({ success: false, error: "merchantName and bankName are required" });
      return;
    }

    const mode = paymentType === "CARD" ? "recurring card charges" : "ACH withdrawals";

    const letter = `To: ${bankName}

I am formally requesting that you stop all future ${mode} from:

Merchant: ${merchantName}

Last Charge Amount: ${lastChargeAmount || "Unknown"}
Last Charge Date: ${lastChargeDate || "Unknown"}

Reason:
${disputeReason || "Unauthorized recurring charge after cancellation request"}

I revoke authorization for any future debits or recurring charges associated with this merchant.

Please block future transactions immediately.

Sincerely,
Account Holder
`;

    if (typeof disputeId === "number" && Number.isInteger(disputeId)) {
      await db
        .update(paymentDisputesTable)
        .set({ generatedLetter: letter, status: "generated", updatedAt: new Date() })
        .where(
          and(
            eq(paymentDisputesTable.id, disputeId),
            eq(paymentDisputesTable.userId, userId)
          )
        );
    }

    return res.json({
      success: true,
      letter,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
    });
  }
});

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;

  const disputes = await db
    .select()
    .from(paymentDisputesTable)
    .where(eq(paymentDisputesTable.userId, userId))
    .orderBy(desc(paymentDisputesTable.createdAt));

  res.json(disputes.map(mapDispute));
});

router.get("/:disputeId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const disputeId = parseInt(String(req.params.disputeId), 10);

  if (Number.isNaN(disputeId)) {
    res.status(400).json({ error: "validation_error", message: "Invalid dispute id" });
    return;
  }

  const [dispute] = await db
    .select()
    .from(paymentDisputesTable)
    .where(and(eq(paymentDisputesTable.id, disputeId), eq(paymentDisputesTable.userId, userId)))
    .limit(1);

  if (!dispute) {
    res.status(404).json({ error: "not_found", message: "Dispute not found" });
    return;
  }

  res.json(mapDispute(dispute));
});

router.patch("/:disputeId/status", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const disputeId = parseInt(String(req.params.disputeId), 10);
  const { status } = req.body as { status?: string };

  if (Number.isNaN(disputeId)) {
    res.status(400).json({ error: "validation_error", message: "Invalid dispute id" });
    return;
  }

  if (!status || !isDisputeStatus(status)) {
    res.status(400).json({ error: "validation_error", message: "Valid status required" });
    return;
  }

  const [updated] = await db
    .update(paymentDisputesTable)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(paymentDisputesTable.id, disputeId), eq(paymentDisputesTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "not_found", message: "Dispute not found" });
    return;
  }

  res.json(mapDispute(updated));
});

export default router;
