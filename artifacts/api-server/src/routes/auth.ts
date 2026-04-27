import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router: IRouter = Router();

// GET /api/auth/me — returns our internal profile, creating it on first access
router.get("/me", async (req, res) => {
  try {
    // ── Bypass JWT path ───────────────────────────────────────────────────
    if (process.env.ENABLE_BYPASS_LOGIN === "true") {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (bearerToken) {
        try {
          const secret = process.env.BYPASS_JWT_SECRET || "bypass-dev-secret";
          const payload = jwt.verify(bearerToken, secret) as jwt.JwtPayload;
          if (payload.bypass === true && payload.sub) {
            const userId = parseInt(payload.sub, 10);
            const [user] = await db
              .select()
              .from(usersTable)
              .where(eq(usersTable.id, userId))
              .limit(1);
            if (user) {
              res.json({
                id: user.id,
                email: user.email,
                name: user.name,
                subscriptionStatus: user.subscriptionStatus,
                trialEndsAt: user.trialEndsAt,
                createdAt: user.createdAt,
              });
              return;
            }
          }
        } catch {
          // fall through to Clerk
        }
      }
    }

    const { userId: clerkUserId } = getAuth(req);

    if (!clerkUserId) {
      res.status(401).json({ error: "unauthorized", message: "Not signed in" });
      return;
    }

    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      // First access — pull info from Clerk and create our record
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        "";
      const name =
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        email.split("@")[0] ||
        "User";

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      [user] = await db
        .insert(usersTable)
        .values({
          clerkUserId,
          email: email.toLowerCase(),
          name,
          subscriptionStatus: "trial",
          trialEndsAt,
        })
        .onConflictDoUpdate({
          target: usersTable.email,
          set: { clerkUserId, name, updatedAt: new Date() },
        })
        .returning();
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
      trialEndsAt: user.trialEndsAt,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    console.error("[Auth] /me error:", err.message);
    res.status(500).json({ error: "server_error", message: "Could not fetch profile." });
  }
});

// POST /api/auth/logout — no-op with Clerk (client handles sign-out)
router.post("/logout", (_req, res) => {
  res.clearCookie("dev_session");
  res.json({ success: true });
});

// POST /api/auth/bypass-login — issues a signed JWT for testing without Clerk.
// Only active when ENABLE_BYPASS_LOGIN=true is set in environment variables.
router.post("/bypass-login", async (req, res) => {
  if (process.env.ENABLE_BYPASS_LOGIN !== "true") {
    res.status(404).json({ error: "not_found" });
    return;
  }

  const { email, name } = req.body as { email?: string; name?: string };

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "bad_request", message: "email is required" });
    return;
  }

  const resolvedName =
    (typeof name === "string" && name.trim()) || email.split("@")[0] || "Test User";
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const [user] = await db
      .insert(usersTable)
      .values({
        email: normalizedEmail,
        name: resolvedName,
        subscriptionStatus: "trial",
        trialEndsAt,
      })
      .onConflictDoUpdate({
        target: usersTable.email,
        set: { name: resolvedName, updatedAt: new Date() },
      })
      .returning();

    const secret = process.env.BYPASS_JWT_SECRET || "bypass-dev-secret";
    const token = jwt.sign(
      { sub: String(user.id), email: user.email, name: user.name, bypass: true },
      secret,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
      },
    });
  } catch (err: any) {
    console.error("[Auth] bypass-login error:", err.message);
    res.status(500).json({ error: "server_error", message: "Could not create bypass session." });
  }
});

// POST /api/auth/dev-login — Sets a cookie that bypasses Clerk auth.
// Only active when ENABLE_DEV_BYPASS=true is set in environment variables.
router.post("/dev-login", (req, res) => {
  if (process.env.ENABLE_DEV_BYPASS !== "true") {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.cookie("dev_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  res.json({ ok: true });
});

export default router;
