import { Router, type IRouter } from "express";
import { db, recurringPaymentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/email-template", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { paymentId, userName, userEmail } = req.body as {
    paymentId: number;
    userName: string;
    userEmail: string;
  };

  const [payment] = await db
    .select()
    .from(recurringPaymentsTable)
    .where(and(eq(recurringPaymentsTable.id, paymentId), eq(recurringPaymentsTable.userId, userId)))
    .limit(1);

  if (!payment) {
    res.status(404).json({ error: "not_found", message: "Payment not found" });
    return;
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  res.json({
    subject: `Cancellation Request - ${payment.merchantName} Account`,
    recipientEmail: `support@${payment.merchantName.toLowerCase().replace(/\s/g, "")}.com`,
    body: `Dear ${payment.merchantName} Customer Support,

I am writing to request the immediate cancellation of my subscription/membership associated with the following account:

Account Name: ${userName}
Email Address: ${userEmail}
Date: ${today}

I am requesting that:
1. My subscription be cancelled effective immediately
2. No further charges be made to my payment method
3. I receive written confirmation of this cancellation

Please confirm the cancellation via email to ${userEmail}.

If I do not receive confirmation within 5 business days, I will be forced to contact my bank to dispute any future charges and request a stop-payment order.

I appreciate your prompt attention to this matter.

Sincerely,
${userName}`,
  });
});

router.post("/ach-revocation", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { paymentId, userName, bankName, accountLastFour } = req.body as {
    paymentId: number;
    userName: string;
    bankName: string;
    accountLastFour: string;
  };

  const [payment] = await db
    .select()
    .from(recurringPaymentsTable)
    .where(and(eq(recurringPaymentsTable.id, paymentId), eq(recurringPaymentsTable.userId, userId)))
    .limit(1);

  if (!payment) {
    res.status(404).json({ error: "not_found", message: "Payment not found" });
    return;
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  res.json({
    title: `ACH Debit Authorization Revocation - ${payment.merchantName}`,
    content: `ACH DEBIT AUTHORIZATION REVOCATION LETTER

Date: ${today}

FROM:
${userName}
Account Ending In: ${accountLastFour}

TO:
${bankName}
(Your Bank/Credit Union)

RE: Revocation of ACH Debit Authorization

Dear Sir/Madam,

I, ${userName}, hereby revoke any and all authorizations I have given to ${payment.merchantName} to initiate Automated Clearing House (ACH) debit entries from my account ending in ${accountLastFour} at ${bankName}.

Merchant Information:
- Company Name: ${payment.merchantName}
- Charge Amount: $${payment.amount} ${payment.currency}
- Charge Frequency: ${payment.frequency}

Effective immediately, I am revoking all authorizations for this merchant to debit my account. Please deny any future ACH debit requests from ${payment.merchantName}.

I understand that this revocation does not eliminate any legitimate debt I may owe to ${payment.merchantName}, but I am exercising my legal right under the Electronic Fund Transfer Act (EFTA) and Regulation E to revoke ACH authorization.

Please confirm receipt of this revocation in writing.

Sincerely,

_________________________
${userName}
Date: ${today}`,
    instructions: [
      "Print this letter and sign it in the signature field above",
      `Take or mail this letter to your bank branch at ${bankName}`,
      "Keep a copy for your records",
      "Send via certified mail if mailing to have proof of delivery",
      "Ask your bank for written confirmation that they received this revocation",
      "Your bank is legally required to honor this revocation within 3 business days",
    ],
  });
});

router.post("/stop-payment", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { paymentId, userName, bankName, accountLastFour } = req.body as {
    paymentId: number;
    userName: string;
    bankName: string;
    accountLastFour: string;
  };

  const [payment] = await db
    .select()
    .from(recurringPaymentsTable)
    .where(and(eq(recurringPaymentsTable.id, paymentId), eq(recurringPaymentsTable.userId, userId)))
    .limit(1);

  if (!payment) {
    res.status(404).json({ error: "not_found", message: "Payment not found" });
    return;
  }

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  res.json({
    title: `Stop Payment Request - ${payment.merchantName}`,
    content: `STOP PAYMENT REQUEST FORM

Date: ${today}

Account Holder: ${userName}
Account Ending In: ${accountLastFour}
Bank: ${bankName}

PAYMENT DETAILS TO STOP:
- Payee/Merchant: ${payment.merchantName}
- Amount: $${payment.amount} ${payment.currency}
- Frequency: ${payment.frequency}
- Reason for Stop Payment: Unauthorized recurring charge / Cancellation not honored

I, ${userName}, request that ${bankName} place a stop payment order on all future payment transactions to ${payment.merchantName} from my account ending in ${accountLastFour}.

I understand that:
- A stop payment fee may apply (typically $25-35)
- Stop payment orders are typically valid for 6 months
- This stop payment may be renewed upon expiration
- This does not cancel my underlying obligation to ${payment.merchantName}

Account Holder Signature: _________________________
Date: ${today}`,
    instructions: [
      "Print or download this form",
      `Visit your ${bankName} branch in person or call their customer service number`,
      "Request a 'Stop Payment Order' for recurring charges from " + payment.merchantName,
      "Provide the merchant name, amount, and your account details",
      "Be aware there may be a small fee ($25-35) for this service",
      "Stop payment orders typically last 6 months and can be renewed",
      "Keep confirmation of the stop payment order for your records",
    ],
  });
});

export default router;
