import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient.js";
import app from "./app.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for Stripe integration.");
  }

  try {
    console.log("Initializing Stripe schema...");
    await runMigrations({ databaseUrl, schema: "stripe" });
    console.log("Stripe schema ready");

    const stripeSync = await getStripeSync();

    const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost"}`;
    console.log("Setting up managed webhook at:", webhookBaseUrl);
    const { webhook } = await stripeSync.findOrCreateManagedWebhook(
      `${webhookBaseUrl}/api/stripe/webhook`
    );
    console.log("Webhook configured:", webhook?.url || "setup complete");

    // Sync existing Stripe data in the background
    stripeSync
      .syncBackfill()
      .then(() => console.log("Stripe data sync complete"))
      .catch((err) => console.error("Stripe sync error:", err));
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    // Don't crash the server if Stripe init fails — app still works without billing
  }
}

// Initialize Stripe, then start listening
await initStripe();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
