import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { continuedChargesTable, db } from "@workspace/db";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

type UploadedEvidence = {
  name: string;
  size?: number;
  type?: string;
  lastModified?: number;
};

type ExtractedCharge = {
  merchant: string;
  amount: string;
  date: string;
  source?: string;
};

type TimelineItem = {
  type: "Cancellation Request" | "Continued Charge";
  date: string;
  amount?: string;
  merchant?: string;
};

function defaultCancellationDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  date.setDate(10);
  return date.toISOString().slice(0, 10);
}

function buildMockTransactions(merchantName: string, evidenceFiles: UploadedEvidence[]): ExtractedCharge[] {
  const cleanMerchant = merchantName.trim() || "Selected Merchant";
  const sourceNames = evidenceFiles.length ? evidenceFiles.map((file) => file.name) : ["uploaded statement"];
  return [
    {
      merchant: cleanMerchant,
      amount: "$24.99",
      date: "2026-05-01",
      source: sourceNames[0],
    },
    {
      merchant: cleanMerchant,
      amount: "$24.99",
      date: "2026-04-01",
      source: sourceNames[1] || sourceNames[0],
    },
    {
      merchant: cleanMerchant,
      amount: "$24.99",
      date: "2026-03-01",
      source: sourceNames[2] || sourceNames[0],
    },
  ];
}

function generateDisputePacket(input: {
  merchantName: string;
  cancellationDate: string;
  continuedCharges: ExtractedCharge[];
  timeline: TimelineItem[];
  evidenceSummary: string;
}) {
  const total = input.continuedCharges
    .map((charge) => Number(charge.amount.replace(/[^0-9.-]/g, "")))
    .filter((amount) => Number.isFinite(amount))
    .reduce((sum, amount) => sum + amount, 0);

  return `DISPUTE PACKET

Merchant:
${input.merchantName}

Summary:
The customer canceled services on ${input.cancellationDate}, but continued charges were detected after cancellation.

Timeline:
${input.timeline.map((item) => `${item.date} - ${item.type}${item.amount ? ` - ${item.amount}` : ""}`).join("\n")}

Evidence Summary:
${input.evidenceSummary}

Requested Resolution:
- Stop future charges
- Refund continued charges${total > 0 ? ` totaling $${total.toFixed(2)}` : ""}
- Revoke authorization for future debits or card-on-file charges
- Provide written confirmation of the dispute outcome
`;
}

function mapContinuedCharge(row: typeof continuedChargesTable.$inferSelect) {
  return {
    id: row.id,
    merchantName: row.merchantName,
    cancellationDate: row.cancellationDate,
    extractedCharges: row.extractedCharges,
    timelineData: row.timelineData,
    evidenceSummary: row.evidenceSummary,
    disputePacket: row.disputePacket,
    createdAt: row.createdAt,
  };
}

router.post("/analyze", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const body = req.body as {
      merchantName?: string;
      cancellationDate?: string;
      files?: UploadedEvidence[];
    };

    const merchantName = body.merchantName?.trim();
    if (!merchantName) {
      res.status(400).json({ success: false, error: "merchantName is required" });
      return;
    }

    const cancellationDate = body.cancellationDate?.trim() || defaultCancellationDate();
    const evidenceFiles = Array.isArray(body.files) ? body.files : [];
    const extractedCharges = buildMockTransactions(merchantName, evidenceFiles);
    const continuedCharges = extractedCharges.filter((transaction) => transaction.date > cancellationDate);

    const timeline: TimelineItem[] = [
      {
        type: "Cancellation Request" as const,
        date: cancellationDate,
      },
      ...continuedCharges.map((charge) => ({
        type: "Continued Charge" as const,
        date: charge.date,
        amount: charge.amount,
        merchant: charge.merchant,
      })),
    ].sort((a, b) => a.date.localeCompare(b.date));

    const evidenceSummary = `The customer canceled their subscription on ${cancellationDate}.
Despite cancellation, additional charges continued afterward.

Detected Continued Charges:
${continuedCharges.map((charge) => `- ${charge.date} | ${charge.amount} | ${charge.merchant}`).join("\n") || "- None detected"}

Uploaded Evidence:
${evidenceFiles.map((file) => `- ${file.name}`).join("\n") || "- No files attached"}`;

    const disputePacket = generateDisputePacket({
      merchantName,
      cancellationDate,
      continuedCharges,
      timeline,
      evidenceSummary,
    });

    const [saved] = await db
      .insert(continuedChargesTable)
      .values({
        userId,
        merchantName,
        cancellationDate,
        extractedCharges,
        timelineData: timeline,
        evidenceSummary,
        disputePacket,
      })
      .returning();

    return res.json({
      success: true,
      data: mapContinuedCharge(saved),
      continuedCharges,
      timeline,
      evidenceSummary,
      disputePacket,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Failed to analyze charges",
    });
  }
});

router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const rows = await db
    .select()
    .from(continuedChargesTable)
    .where(eq(continuedChargesTable.userId, userId))
    .orderBy(desc(continuedChargesTable.createdAt));

  res.json(rows.map(mapContinuedCharge));
});

export default router;
