import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { clerkMiddleware } from "@clerk/express";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware.js";
import router from "./routes/index.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { WebhookHandlers } from "./webhookHandlers.js";
import { getClerkPublishableKey, hasClerkRuntimeConfig, isDevBypassAllowed } from "./authConfig.js";

const app: Express = express();
const isProd = process.env.NODE_ENV === "production";
const MAX_DNS_HOSTNAME_LENGTH = 253;

function getClerkFrontendApiHost(): string | null {
  const validHostnamePattern =
    /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

  const key =
    getClerkPublishableKey();

  if (!key) return null;

  // Clerk key format: pk_<env>_<base64(frontend-api-host)>[...optional suffixes]
  const keyParts = key.split("_");
  if (keyParts.length < 3) return null;

  const encoded = keyParts[2];
  if (!encoded) return null;

  try {
    // Clerk publishable keys can decode to a hostname with trailing "$" markers.
    // Strip only trailing markers before hostname validation and CSP insertion.
    const decoded = Buffer.from(encoded, "base64")
      .toString("utf8")
      .replace(/\$+$/, "")
      .trim()
      .toLowerCase();

    if (decoded.length > MAX_DNS_HOSTNAME_LENGTH) return null;
    if (!/^[\x20-\x7E]+$/.test(decoded)) return null;
    if (!decoded || !validHostnamePattern.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}

const clerkFrontendApiHost = getClerkFrontendApiHost();
const clerkFrontendApiSources = clerkFrontendApiHost
  ? [clerkFrontendApiHost]
  : [];

// ─── Clerk Proxy (must come first, before body parsers) ───────────────────────
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// ─── Security: HTTP Headers ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "js.stripe.com",
          "cdn.plaid.com",
          ...clerkFrontendApiSources,
        ],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        styleSrcElem: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "fonts.gstatic.com"],
        frameSrc: [
          "'self'",
          "js.stripe.com",
          "hooks.stripe.com",
          "cdn.plaid.com",
          ...clerkFrontendApiSources,
        ],
        connectSrc: [
          "'self'",
          "api.stripe.com",
          "cdn.plaid.com",
          "*.plaid.com",
          "production.plaid.com",
          "sandbox.plaid.com",
          "*.clerk.com",
          "*.clerk.accounts.dev",
          "*.clerkstage.com",
          "clerk.*.replit.dev",
          "clerk.*.repl.co",
        ],
        imgSrc: ["'self'", "data:", "blob:", "https:", "*.clerk.com"],
        mediaSrc: ["'self'", "blob:"],
        workerSrc: ["'self'", "blob:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
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

function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.some((pattern) => pattern.test(origin));
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
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
app.use(cookieParser());

// ─── CSRF Guard: block cross-site state-changing cookie requests ──────────────
const stateChangingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
app.use((req, res, next) => {
  if (!stateChangingMethods.has(req.method)) return next();
  if (req.path === "/api/stripe/webhook") return next();

  const origin = req.headers.origin;
  if (origin) {
    if (isAllowedOrigin(origin)) return next();
    res.status(403).json({ error: "forbidden", message: "Blocked by CSRF protection" });
    return;
  }

  const referer = req.headers.referer;
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isAllowedOrigin(refererOrigin)) return next();
    } catch {
      // ignore parse errors and fall through to cookie check below
    }
    res.status(403).json({ error: "forbidden", message: "Blocked by CSRF protection" });
    return;
  }

  // If no Origin/Referer exists, only allow non-cookie requests
  if (req.headers.cookie) {
    res.status(403).json({ error: "forbidden", message: "Blocked by CSRF protection" });
    return;
  }

  next();
});

// ─── Trust proxy (required for rate limiting behind Replit's proxy) ───────────
app.set("trust proxy", 1);

// ─── Clerk Middleware ─────────────────────────────────────────────────────────
// Skip Clerk token validation when:
//   1. The dev bypass cookie is active (avoids network hangs with rate-limited keys), OR
//   2. No CLERK_PUBLISHABLE_KEY is configured (local dev without Clerk set up).
//      In this case unauthenticated routes work freely; protected routes still
//      require either the dev_session cookie or a real Clerk token.
const _clerkMw = clerkMiddleware();
app.use((req, res, next) => {
  if (isDevBypassAllowed() && (req.cookies as Record<string, string>)?.dev_session === "1") {
    return next();
  }
  if (!hasClerkRuntimeConfig()) {
    return next();
  }
  return _clerkMw(req, res, next);
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api", router);

// ─── Serve Frontend (production only) ────────────────────────────────────────
if (isProd) {
  const distDir = path.dirname(fileURLToPath(import.meta.url));
  const frontendDir = path.join(distDir, "public");

  console.log("[Static] Serving frontend from:", frontendDir);

  // Serve hashed assets (JS/CSS/images) with long cache — Vite content-hashes them
  app.use(express.static(frontendDir, { maxAge: "1y", index: false }));

  // SPA catch-all: serve index.html with no-cache so deploys take effect immediately
  app.get(/(.*)/, (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(frontendDir, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({ service: "AutoPay Cancel API", status: "ok", env: "development" });
  });
}

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
