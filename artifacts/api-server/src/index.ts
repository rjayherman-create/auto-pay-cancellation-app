import app from "./app.js";

// ─── Startup diagnostics (Railway debugging) ─────────────────────────────────
console.log("[Startup] NODE_ENV:", process.env.NODE_ENV ?? "(not set)");
console.log("[Startup] PORT:", process.env.PORT ?? "(not set)");
console.log("[Startup] DATABASE_URL:", process.env.DATABASE_URL ? "✓ set" : "✗ NOT SET");
console.log("[Startup] JWT_SECRET:", process.env.JWT_SECRET ? "✓ set" : "✗ not set (using dev default)");
console.log("[Startup] PLAID_CLIENT_ID:", process.env.PLAID_CLIENT_ID ? "✓ set" : "✗ not set");
console.log("[Startup] STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✓ set" : "✗ not set");

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
