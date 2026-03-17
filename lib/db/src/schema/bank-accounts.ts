import { pgTable, serial, text, boolean, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const accountTypeEnum = pgEnum("account_type", [
  "checking",
  "savings",
  "credit",
]);

export const bankAccountsTable = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountType: accountTypeEnum("account_type").notNull(),
  lastFour: text("last_four").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccountsTable).omit({
  id: true,
  connectedAt: true,
});

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccountsTable.$inferSelect;
