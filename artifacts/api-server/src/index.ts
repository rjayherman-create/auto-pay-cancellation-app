import { runMigrations } from "stripe-replit-sync";
import { getStripeSync } from "./stripeClient.js";
import app from "./app.js";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required for Stripe integration.");

  try {
    console.log("[Stripe] Running schema migrations...");
    await runMigrations({ databaseUrl });
    console.log("[Stripe] Schema ready.");

    const stripeSync = await getStripeSync();

    const domain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
    if (domain) {
      const webhookUrl = `https://${domain}/api/stripe/webhook`;
      console.log("[Stripe] Setting up managed webhook:", webhookUrl);
      const webhook = await stripeSync.findOrCreateManagedWebhook(webhookUrl);
      console.log("[Stripe] Webhook configured:", webhook?.url || "complete");
    }

    // Sync existing Stripe data in the background
    stripeSync
      .syncBackfill()
      .then(() => console.log("[Stripe] Data sync complete"))
      .catch((err) => console.error("[Stripe] Sync error:", err.message));
  } catch (error: any) {
    // Don't crash server — app still works without billing
    console.error("[Stripe] Initialization error:", error.message);
  }
}

void (async () => {
  await initStripe();

  app.listen(port, () => {
    console.log(`[AutoPay Cancel API] Server listening on port ${port}`);
  });
})();
