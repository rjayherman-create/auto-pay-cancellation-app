import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes/index.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { WebhookHandlers } from "./webhookHandlers.js";

const app: Express = express();

// ─── Security: HTTP Headers ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "js.stripe.com", "cdn.plaid.com"],
        frameSrc: ["'self'", "js.stripe.com", "hooks.stripe.com", "cdn.plaid.com"],
        connectSrc: ["'self'", "api.stripe.com", "cdn.plaid.com", "*.plaid.com"],
        imgSrc: ["'self'", "data:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── Security: CORS ───────────────────────────────────────────────────────────
const allowedOrigins = [
  /\.replit\.dev$/,
  /\.repl\.co$/,
  /\.railway\.app$/,
  /localhost/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ─── Security: Global Rate Limiter ────────────────────────────────────────────
app.use(globalLimiter);

// ─── Security: Stripe Webhook (raw body BEFORE json parser) ──────────────────
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    const sig = Array.isArray(signature) ? signature[0] : signature;

    try {
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("[Stripe Webhook] Error:", error.message);
      res.status(400).json({ error: "Webhook processing failed" });
    }
  }
);

// ─── Body Parsing (after webhook route) ──────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Trust proxy (required for rate limiting behind Replit's proxy) ───────────
app.set("trust proxy", 1);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Server Error]", err.message);
    res.status(500).json({ error: "internal_error", message: "An unexpected error occurred." });
  }
);

export default app;
