import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getPublicAuthConfig, isDevBypassAllowed } from "../authConfig.js";

const router: IRouter = Router();

const DEV_CLERK_USER_ID = "dev_bypass_user";

function getEffectiveClerkUserId(req: any): string | null {
  if (isDevBypassAllowed() && req.cookies?.dev_session === "1") {
    return DEV_CLERK_USER_ID;
  }
  try {
    const { userId } = getAuth(req);
    return userId ?? null;
  } catch {
    // Clerk middleware not configured — treat as unauthenticated
    return null;
  }
}

router.get("/config", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
  res.json(getPublicAuthConfig());
});

// GET /api/auth/me — returns our internal profile, creating it on first access
router.get("/me", async (req, res) => {
  try {
    const clerkUserId = getEffectiveClerkUserId(req);

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
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      let email = "dev@test.local";
      let name = "Dev User";

      // Only call Clerk API for real users — dev bypass has no Clerk account
      if (clerkUserId !== DEV_CLERK_USER_ID) {
        const clerkUser = await clerkClient.users.getUser(clerkUserId);
        email =
          clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
            ?.emailAddress ||
          clerkUser.emailAddresses[0]?.emailAddress ||
          "";
        name =
          [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
          email.split("@")[0] ||
          "User";
      }

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

// POST /api/auth/dev-login — Sets a cookie that bypasses Clerk auth.
router.post("/dev-login", (req, res) => {
  if (!isDevBypassAllowed()) {
    res.status(403).json({ error: "forbidden", message: "Dev bypass is disabled" });
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
