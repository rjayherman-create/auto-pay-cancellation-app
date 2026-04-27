import { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId?: number;
  clerkUserId?: string;
}

const DEV_CLERK_USER_ID = "dev_bypass_user";

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ── Bypass JWT — only active when ENABLE_BYPASS_LOGIN=true ──────────────
  if (process.env.ENABLE_BYPASS_LOGIN === "true") {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (bearerToken) {
      try {
        const secret = process.env.BYPASS_JWT_SECRET || "bypass-dev-secret";
        const payload = jwt.verify(bearerToken, secret) as jwt.JwtPayload;

        if (payload.bypass === true && payload.sub) {
          const userId = parseInt(payload.sub, 10);
          const [user] = await db
            .select({ id: usersTable.id })
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

          if (user) {
            req.userId = user.id;
            req.clerkUserId = `bypass_${user.id}`;
            return next();
          }
        }
      } catch (err: any) {
        // Invalid or expired bypass token — fall through to Clerk
        console.warn("[Auth] Bypass JWT invalid:", err.message);
      }
    }
  }

  // ── Dev bypass — only active when ENABLE_DEV_BYPASS=true ─────────────────
  if (process.env.ENABLE_DEV_BYPASS === "true" && req.cookies?.dev_session === "1") {
    try {
      let [user] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.clerkUserId, DEV_CLERK_USER_ID))
        .limit(1);

      if (!user) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        const [created] = await db
          .insert(usersTable)
          .values({
            clerkUserId: DEV_CLERK_USER_ID,
            email: "dev@test.local",
            name: "Dev User",
            subscriptionStatus: "trial",
            trialEndsAt,
          })
          .onConflictDoUpdate({
            target: usersTable.email,
            set: { updatedAt: new Date() },
          })
          .returning({ id: usersTable.id });
        user = created;
      }

      req.clerkUserId = DEV_CLERK_USER_ID;
      req.userId = user.id;
      return next();
    } catch (err: any) {
      console.error("[Auth] Dev bypass error:", err.message);
    }
  }

  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  req.clerkUserId = clerkUserId;

  try {
    let [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      // First-time access — lazily create the user from Clerk data
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

      const [created] = await db
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
        .returning({ id: usersTable.id });

      user = created;
    }

    req.userId = user.id;
    next();
  } catch (err: any) {
    console.error("[Auth] requireAuth error:", err.message);
    res.status(500).json({ error: "server_error", message: "Authentication check failed" });
  }
}
