import { getUncachableStripeClient } from "./stripeClient.js";
import { getDb, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getOrCreateStripeCustomer(userId: number, email: string): Promise<string> {
  const [user] = await getDb().select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const stripe = await getUncachableStripeClient();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId: String(userId) },
  });

  await getDb()
    .update(usersTable)
    .set({ stripeCustomerId: customer.id })
    .where(eq(usersTable.id, userId));

  return customer.id;
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
) {
  const stripe = await getUncachableStripeClient();
  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
  });
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  const stripe = await getUncachableStripeClient();
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function getUserSubscription(customerId: string) {
  const stripe = await getUncachableStripeClient();
  const result = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 1,
  });
  return result.data[0] || null;
}
