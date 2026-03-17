import { pgTable, serial, text, real, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const actionTypeEnum = pgEnum("action_type", [
  "cancelled",
  "detected",
  "disputed",
  "saved",
]);

export const userActionsTable = pgTable("user_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: actionTypeEnum("type").notNull(),
  merchantName: text("merchant_name").notNull(),
  amount: real("amount").notNull().default(0),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserActionSchema = createInsertSchema(userActionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertUserAction = z.infer<typeof insertUserActionSchema>;
export type UserAction = typeof userActionsTable.$inferSelect;
