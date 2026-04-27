import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "cancelled",
  "expired",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .notNull()
    .default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
