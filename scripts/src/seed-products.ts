import { getStripeSync } from "./stripeClient.js";
import { runMigrations } from "stripe-replit-sync";

/**
 * Creates Auto-Pay Cancel Assistant subscription products in Stripe.
 * Idempotent — safe to run multiple times.
 *
 * Run with: pnpm --filter @workspace/scripts exec tsx src/seed-products.ts
 */
async function seedProducts() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  console.log("Running Stripe schema migrations...");
  await runMigrations({ databaseUrl, schema: "stripe" });

  const stripeSync = await getStripeSync();
  const stripe = (stripeSync as any).stripe;

  if (!stripe) {
    throw new Error("Could not get Stripe client from StripeSync");
  }

  console.log("Checking for existing products...");

  // Check if our product already exists
  const existing = await stripe.products.search({
    query: "name:'Auto-Pay Cancel Assistant' AND active:'true'",
  });

  if (existing.data.length > 0) {
    const product = existing.data[0];
    console.log(`✓ Product already exists: ${product.name} (${product.id})`);

    const prices = await stripe.prices.list({ product: product.id, active: true });
    console.log(`  Found ${prices.data.length} active prices:`);
    for (const price of prices.data) {
      const amount = (price.unit_amount ?? 0) / 100;
      const interval = (price.recurring as any)?.interval ?? "one-time";
      console.log(`  - $${amount}/${interval} → ${price.id}`);
    }
    return;
  }

  console.log("Creating Auto-Pay Cancel Assistant product...");

  const product = await stripe.products.create({
    name: "Auto-Pay Cancel Assistant",
    description:
      "Detect, manage, and cancel unwanted recurring subscriptions. Includes cancellation guidance, email templates, and legal document generation.",
    metadata: {
      app: "autopay-cancel",
    },
  });

  console.log(`✓ Created product: ${product.name} (${product.id})`);

  // $7.99/month
  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 799,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan: "monthly" },
  });
  console.log(`✓ Created monthly price: $7.99/month → ${monthlyPrice.id}`);

  // $59.99/year (37% savings vs monthly)
  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 5999,
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { plan: "annual" },
  });
  console.log(`✓ Created annual price: $59.99/year → ${yearlyPrice.id}`);

  console.log("\n✅ Products seeded successfully!");
  console.log("Syncing to local database...");
  await stripeSync.syncBackfill();
  console.log("✅ Sync complete!");
}

seedProducts().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
