import { Router, type IRouter } from "express";
import { stripeService } from "../stripeService.js";
import { stripeStorage } from "../stripeStorage.js";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// Get available subscription plans (products + prices from Stripe)
router.get("/plans", async (_req, res) => {
  try {
    const rows = await stripeStorage.listProductsWithPrices(true);

    // Group prices by product
    const productsMap = new Map<string, {
      id: string; name: string; description: string | null; prices: object[];
    }>();

    for (const row of rows as any[]) {
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

    res.json({ plans: Array.from(productsMap.values()) });
  } catch (err) {
    console.error("Error fetching plans:", err);
    res.json({ plans: [] });
  }
});

// Get current user's subscription status
router.get("/subscription", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;

  const user = await stripeStorage.getUserById(userId);
  if (!user?.stripeCustomerId) {
    res.json({ subscription: null, status: "none" });
    return;
  }

  const subscription = await stripeStorage.getSubscriptionByCustomerId(
    user.stripeCustomerId
  );

  if (!subscription) {
    res.json({ subscription: null, status: "none" });
    return;
  }

  res.json({
    subscription: {
      id: (subscription as any).id,
      status: (subscription as any).status,
      currentPeriodEnd: (subscription as any).current_period_end,
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
    },
    status: (subscription as any).status,
  });
});

// Create checkout session to subscribe
router.post("/checkout", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const { priceId } = req.body as { priceId: string };

  if (!priceId) {
    res.status(400).json({ error: "validation_error", message: "priceId is required" });
    return;
  }

  const user = await stripeStorage.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }

  const customerId = await stripeService.getOrCreateCustomer(userId, user.email);

  const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost"}`;
  const session = await stripeService.createCheckoutSession(
    customerId,
    priceId,
    `${baseUrl}/settings?subscription=success`,
    `${baseUrl}/settings?subscription=cancelled`
  );

  res.json({ url: session.url });
});

// Create customer portal session to manage billing
router.post("/portal", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.userId!;
  const user = await stripeStorage.getUserById(userId);

  if (!user?.stripeCustomerId) {
    res.status(400).json({
      error: "no_subscription",
      message: "No active subscription found",
    });
    return;
  }

  const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost"}`;
  const session = await stripeService.createCustomerPortalSession(
    user.stripeCustomerId,
    `${baseUrl}/settings`
  );

  res.json({ url: session.url });
});

export default router;
