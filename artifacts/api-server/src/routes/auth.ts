import { Router, type IRouter } from "express";
import { getDb, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

// GET /api/auth/me — returns the current user's profile + subscription status
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const [user] = await getDb()
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "unauthorized", message: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    trialEndsAt: user.trialEndsAt,
    subscriptionStatus: user.subscriptionStatus,
  });
});

export default router;
