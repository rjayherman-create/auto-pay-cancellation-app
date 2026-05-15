import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const merchantDirectoryTable = pgTable("merchant_directory", {
  id: serial("id").primaryKey(),
  merchantName: text("merchant_name").notNull(),
  category: text("category"),
  cancellationEmail: text("cancellation_email"),
  cancellationAddress: text("cancellation_address"),
  cancellationPhone: text("cancellation_phone"),
  cancellationUrl: text("cancellation_url"),
  secureMessageSteps: text("secure_message_steps"),
  acceptsEmail: boolean("accepts_email").notNull().default(false),
  acceptsMail: boolean("accepts_mail").notNull().default(true),
  acceptsPortal: boolean("accepts_portal").notNull().default(false),
  acceptsHandDelivery: boolean("accepts_hand_delivery").notNull().default(false),
  recommendedMethod: text("recommended_method").notNull().default("certified_mail"),
  proofTips: text("proof_tips"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMerchantDirectorySchema = createInsertSchema(
  merchantDirectoryTable
).omit({
  id: true,
  createdAt: true,
});

export type InsertMerchantDirectory = z.infer<typeof insertMerchantDirectorySchema>;
export type MerchantDirectory = typeof merchantDirectoryTable.$inferSelect;
