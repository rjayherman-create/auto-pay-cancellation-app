import app from "./app.js";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required.");

const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[Stripe] DATABASE_URL not set — skipping Stripe initialization.");
    return;
  }

  try {
    const { runMigrations } = await import("stripe-replit-sync");
    console.log("[Stripe] Running schema migrations...");
    await runMigrations({ databaseUrl });
    console.log("[Stripe] Schema ready.");

    const { getStripeSync } = await import("./stripeClient.js");
    const stripeSync = await getStripeSync();

    const domain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
    if (domain) {
      const webhookUrl = `https://${domain}/api/stripe/webhook`;
      console.log("[Stripe] Setting up managed webhook:", webhookUrl);
      const result = await stripeSync.findOrCreateManagedWebhook(webhookUrl);
      console.log("[Stripe] Webhook configured:", (result as any)?.webhook?.url || "complete");
    }

    stripeSync
      .syncBackfill()
      .then(() => console.log("[Stripe] Data sync complete"))
      .catch((err) => console.error("[Stripe] Sync error:", err.message));
  } catch (error: any) {
    console.error("[Stripe] Initialization error:", error.message);
  }
}

await initStripe();

app.listen(port, () => {
  console.log(`[AutoPay Cancel API] Server listening on port ${port}`);
});
