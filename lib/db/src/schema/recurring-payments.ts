import {
  pgTable,
  serial,
  text,
  real,
  date,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { bankAccountsTable } from "./bank-accounts";

export const paymentFrequencyEnum = pgEnum("payment_frequency", [
  "weekly",
  "monthly",
  "quarterly",
  "annually",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "active",
  "cancelled",
  "disputed",
]);

export const cancellationDifficultyEnum = pgEnum("cancellation_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const recurringPaymentsTable = pgTable("recurring_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  accountId: integer("account_id")
    .notNull()
    .references(() => bankAccountsTable.id, { onDelete: "cascade" }),
  merchantName: text("merchant_name").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: paymentFrequencyEnum("frequency").notNull(),
  category: text("category").notNull(),
  status: paymentStatusEnum("status").notNull().default("active"),
  nextChargeDate: date("next_charge_date").notNull(),
  lastChargeDate: date("last_charge_date"),
  cancellationDifficulty: cancellationDifficultyEnum("cancellation_difficulty")
    .notNull()
    .default("medium"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRecurringPaymentSchema = createInsertSchema(
  recurringPaymentsTable
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRecurringPayment = z.infer<typeof insertRecurringPaymentSchema>;
export type RecurringPayment = typeof recurringPaymentsTable.$inferSelect;
