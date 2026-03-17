import { ReplitConnectors } from "@replit/connectors-sdk";
import Stripe from "stripe";
import { StripeSync } from "stripe-replit-sync";

// Never cache the client — tokens expire
export async function getUncachableStripeClient(): Promise<Stripe> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("stripe", "/v1/balance", {
    method: "GET",
  });

  // Extract the secret key from the Replit connector
  const secretKey = (connectors as any).getSecretKey?.() || process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Unable to get Stripe secret key from connector");
  }

  return new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
}

let _stripeSync: StripeSync | null = null;

export async function getStripeSync(): Promise<StripeSync> {
  if (_stripeSync) return _stripeSync;

  const connectors = new ReplitConnectors();
  _stripeSync = await StripeSync.create({
    connectors,
    databaseUrl: process.env.DATABASE_URL!,
  });

  return _stripeSync;
}
