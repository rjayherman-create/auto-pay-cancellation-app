import {
  bigint,
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

export const workflowAnalyticsTable = pgTable("workflow_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  workflowId: text("workflow_id").notNull(),
  workflowType: text("workflow_type").notNull(),
  event: text("event").notNull(),
  step: text("step"),
  timestampMs: bigint("timestamp_ms", { mode: "number" }).notNull(),
  metadata: jsonb("metadata"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWorkflowAnalyticsSchema = createInsertSchema(
  workflowAnalyticsTable
).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowAnalytics = z.infer<typeof insertWorkflowAnalyticsSchema>;
export type WorkflowAnalytics = typeof workflowAnalyticsTable.$inferSelect;
