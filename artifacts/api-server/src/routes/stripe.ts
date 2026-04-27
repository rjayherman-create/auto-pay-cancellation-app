import { Router, type IRouter } from "express";
import { getDb, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  createPortalSession,
  getUserSubscription,
} from "../stripeService.js";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// GET /api/stripe/plans — list active products+prices from the synced stripe schema
router.get("/plans", async (_req, res) => {
  try {
    const rows = await getDb().execute(sql`
      WITH paginated_products AS (
        SELECT id, name, description, metadata, active
        FROM stripe.products
        WHERE active = true
        ORDER BY id
        LIMIT 20
      )
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        pr.id AS price_id,
        pr.unit_amount,
        pr.currency,
        pr.recurring,
        pr.active AS price_active
      FROM paginated_products p
      LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
      ORDER BY p.id, pr.unit_amount
    `);

    // Group prices by product
    const productsMap = new Map<string, {
      id: string;
      name: string;
      description: string | null;
      prices: object[];
    }>();

    for (const row of rows.rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id)!.prices.push({
          id: row.price_id,
          unitAmount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
        });
      }
    }

    const plans = Array.from(productsMap.values()).filter((p) => p.prices.length > 0);
    res.json({ plans });
  } catch (err: any) {
    console.error("[Stripe] Error fetching plans:", err.message);
    res.json({ plans: [] });
  }
});

// GET /api/stripe/subscription — user's current subscription status
router.get("/subscription", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const [user] = await getDb().select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user?.stripeCustomerId) {
    res.json({ subscription: null, status: "none" });
    return;
  }

  try {
    const sub = await getUserSubscription(user.stripeCustomerId);
    if (!sub) {
      res.json({ subscription: null, status: "none" });
      return;
    }
    res.json({
      subscription: {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: (sub as any).current_period_end,
        cancelAtPeriodEnd: (sub as any).cancel_at_period_end,
      },
      status: sub.status,
    });
  } catch (err: any) {
    console.error("[Stripe] Subscription fetch error:", err.message);
    res.json({ subscription: null, status: "none" });
  }
});

// POST /api/stripe/checkout — start subscription checkout
router.post("/checkout", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { priceId } = req.body as { priceId: string };

  if (!priceId) {
    res.status(400).json({ error: "validation_error", message: "priceId is required" });
    return;
  }

  const [user] = await getDb().select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const customerId = await getOrCreateStripeCustomer(userId, user.email);

  const domain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = domain ? `https://${domain}` : "http://localhost:3000";

  const session = await createCheckoutSession(
    customerId,
    priceId,
    `${baseUrl}/settings?subscription=success`,
    `${baseUrl}/settings?subscription=cancelled`
  );

  res.json({ url: session.url });
});

// POST /api/stripe/portal — manage billing via Stripe Customer Portal
router.post("/portal", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const [user] = await getDb().select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user?.stripeCustomerId) {
    res.status(400).json({
      error: "no_subscription",
      message: "No active subscription found",
    });
    return;
  }

  const domain = process.env.APP_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
  const baseUrl = domain ? `https://${domain}` : "http://localhost:3000";

  const session = await createPortalSession(user.stripeCustomerId, `${baseUrl}/settings`);
  res.json({ url: session.url });
});

export default router;
