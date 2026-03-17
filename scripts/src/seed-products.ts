import { getUncachableStripeClient } from "./stripeClient.js";

/**
 * Seeds Auto-Pay Cancel Assistant products in Stripe.
 * Run with: pnpm --filter @workspace/scripts run seed-products
 * Idempotent — safe to run multiple times.
 */
async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  console.log("🔍 Checking for existing Auto-Pay Cancel products...\n");

  const existingProducts = await stripe.products.search({
    query: "name:'Auto-Pay Cancel Assistant' AND active:'true'",
  });

  if (existingProducts.data.length > 0) {
    const product = existingProducts.data[0];
    console.log(`✓ Product already exists: ${product.name} (${product.id})`);

    const prices = await stripe.prices.list({ product: product.id, active: true });
    console.log(`  Active prices:`);
    for (const price of prices.data) {
      const amount = ((price.unit_amount || 0) / 100).toFixed(2);
      const interval = (price.recurring as any)?.interval || "one-time";
      console.log(`  - $${amount}/${interval} → ${price.id}`);
    }
    console.log("\n✅ Products already seeded. No changes made.");
    return;
  }

  console.log("📦 Creating Auto-Pay Cancel Assistant product...");

  const product = await stripe.products.create({
    name: "Auto-Pay Cancel Assistant",
    description:
      "Detect, manage, and cancel unwanted recurring payments. Includes cancellation guides, email templates, and legal document generation.",
    metadata: { app: "autopay-cancel" },
  });
  console.log(`✓ Created product: ${product.name} (${product.id})`);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 799,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { plan: "monthly" },
  });
  console.log(`✓ Monthly plan: $7.99/month → ${monthlyPrice.id}`);

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 5999,
    currency: "usd",
    recurring: { interval: "year" },
    metadata: { plan: "annual" },
  });
  console.log(`✓ Annual plan: $59.99/year → ${yearlyPrice.id}`);

  console.log("\n✅ Products seeded successfully!");
  console.log("\nPrice IDs:");
  console.log(`  Monthly: ${monthlyPrice.id}`);
  console.log(`  Annual:  ${yearlyPrice.id}`);
}

seedProducts().catch((err) => {
  console.error("❌ Seed failed:", err.message || err);
  process.exit(1);
});
