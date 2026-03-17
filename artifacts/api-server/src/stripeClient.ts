import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY environment variable is not set. " +
        "The Stripe integration must be connected in the Replit integrations panel."
    );
  }
  return key;
}

/**
 * Get an authenticated Stripe client.
 * Never cache this — intended to be called fresh each time.
 */
export async function getUncachableStripeClient(): Promise<Stripe> {
  return new Stripe(getStripeSecretKey(), { apiVersion: "2025-02-24.acacia" });
}

/**
 * Get a StripeSync instance for webhook processing and data sync.
 */
export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");

  return new StripeSync({
    stripeSecretKey: getStripeSecretKey(),
    stripeApiVersion: "2025-02-24.acacia",
    databaseUrl,
  });
}
