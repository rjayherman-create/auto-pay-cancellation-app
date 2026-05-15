import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const disputePaymentTypeEnum = pgEnum("dispute_payment_type", [
  "ACH",
  "CARD",
]);

export const disputeStatusEnum = pgEnum("dispute_status", [
  "draft",
  "generated",
  "sent_to_merchant",
  "sent_to_bank",
  "waiting",
  "resolved",
  "still_charging",
]);

export const paymentDisputesTable = pgTable("payment_disputes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  merchantName: text("merchant_name").notNull(),
  bankName: text("bank_name").notNull(),
  paymentType: disputePaymentTypeEnum("payment_type").notNull(),
  accountLast4: text("account_last4"),
  lastChargeAmount: text("last_charge_amount"),
  lastChargeDate: text("last_charge_date"),
  cancellationDate: text("cancellation_date"),
  disputeReason: text("dispute_reason"),
  status: disputeStatusEnum("status").notNull().default("draft"),
  evidenceFiles: jsonb("evidence_files"),
  generatedLetter: text("generated_letter"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentDisputeSchema = createInsertSchema(
  paymentDisputesTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPaymentDispute = z.infer<typeof insertPaymentDisputeSchema>;
export type PaymentDispute = typeof paymentDisputesTable.$inferSelect;
