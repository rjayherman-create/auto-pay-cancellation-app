import { ReplitConnectors } from "@replit/connectors-sdk";
import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

// Never cache the client — tokens expire
export async function getUncachableStripeClient(): Promise<Stripe> {
  const connectors = new ReplitConnectors();

  // Try connector first, fallback to env var
  try {
    const sync = await StripeSync.create({
      connectors,
      databaseUrl: process.env.DATABASE_URL!,
    });
    const stripe = (sync as any).stripe as Stripe;
    if (stripe) return stripe;
  } catch {}

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("No Stripe secret key available");
  }
  return new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
}

export async function getStripeSync(): Promise<StripeSync> {
  const connectors = new ReplitConnectors();
  return await StripeSync.create({
    connectors,
    databaseUrl: process.env.DATABASE_URL!,
  });
}
