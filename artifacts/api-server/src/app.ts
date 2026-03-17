import express, { type Express } from "express";
import cors from "cors";
import router from "./routes/index.js";
import { WebhookHandlers } from "./webhookHandlers.js";

const app: Express = express();

// CRITICAL: Stripe webhook route MUST be registered BEFORE express.json()
// because it needs the raw Buffer body, not parsed JSON.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error(
          "STRIPE WEBHOOK ERROR: req.body is not a Buffer. " +
            "Ensure this webhook route is registered BEFORE app.use(express.json())."
        );
        res.status(500).json({ error: "Webhook processing error" });
        return;
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("Webhook error:", error.message);
      res.status(400).json({ error: "Webhook processing error" });
    }
  }
);

// Apply JSON parsing middleware AFTER the webhook route
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount all other routes under /api
app.use("/api", router);

export default app;
