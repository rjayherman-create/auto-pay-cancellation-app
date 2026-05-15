import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, merchantDirectoryTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

type MerchantDirectoryRow = typeof merchantDirectoryTable.$inferSelect;

function mapMerchant(row: MerchantDirectoryRow) {
  return {
    merchant_name: row.merchantName,
    category: row.category,
    cancellation_email: row.cancellationEmail,
    cancellation_address: row.cancellationAddress,
    cancellation_phone: row.cancellationPhone,
    cancellation_url: row.cancellationUrl,
    accepts_email: row.acceptsEmail,
    accepts_mail: row.acceptsMail,
    accepts_portal: row.acceptsPortal,
    accepts_hand_delivery: row.acceptsHandDelivery,
    recommended_method: row.recommendedMethod,
    secure_message_steps: row.secureMessageSteps,
    proof_tips: row.proofTips,
    source: "directory",
  };
}

function fallbackMerchant(merchantName: string) {
  const cleanName = merchantName.trim() || "the merchant";
  const normalizedEmailDomain = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "");

  return {
    merchant_name: cleanName,
    category: "Merchant",
    cancellation_email: normalizedEmailDomain ? `support@${normalizedEmailDomain}.com` : null,
    cancellation_address: null,
    cancellation_phone: null,
    cancellation_url: null,
    accepts_email: true,
    accepts_mail: true,
    accepts_portal: true,
    accepts_hand_delivery: false,
    recommended_method: "email_and_certified_mail_if_address_known",
    secure_message_steps: "Log into your account and look for Account, Billing, Membership, Subscription, or Support messages.",
    proof_tips: "Keep sent email screenshots, portal confirmation screenshots, cancellation numbers, certified mail receipts, tracking numbers, and any replies.",
    source: "fallback",
  };
}

router.get("/:merchant", requireAuth, async (req, res) => {
  try {
    const merchantName = String(req.params.merchant || "").trim();

    if (!merchantName) {
      res.status(400).json({ error: "validation_error", message: "Merchant name is required" });
      return;
    }

    const [merchant] = await db
      .select()
      .from(merchantDirectoryTable)
      .where(eq(sql`LOWER(${merchantDirectoryTable.merchantName})`, merchantName.toLowerCase()))
      .limit(1);

    res.json(merchant ? mapMerchant(merchant) : fallbackMerchant(merchantName));
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to load merchant delivery instructions",
    });
  }
});

export default router;
