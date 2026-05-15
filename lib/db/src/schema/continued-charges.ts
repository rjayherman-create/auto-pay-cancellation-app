import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const continuedChargesTable = pgTable("continued_charges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  merchantName: text("merchant_name").notNull(),
  cancellationDate: text("cancellation_date"),
  extractedCharges: jsonb("extracted_charges"),
  timelineData: jsonb("timeline_data"),
  evidenceSummary: text("evidence_summary"),
  disputePacket: text("dispute_packet"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContinuedChargeSchema = createInsertSchema(
  continuedChargesTable
).omit({
  id: true,
  createdAt: true,
});

export type InsertContinuedCharge = z.infer<typeof insertContinuedChargeSchema>;
export type ContinuedCharge = typeof continuedChargesTable.$inferSelect;
