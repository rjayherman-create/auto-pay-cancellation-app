import { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  userId?: number;
  clerkUserId?: string;
}

const DEV_CLERK_USER_ID = "dev_bypass_user";
const BYPASS_ALLOWED = () =>
  process.env.NODE_ENV === "development" || process.env.ENABLE_DEV_BYPASS === "true";

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // ── Dev bypass (only when explicitly allowed) ─────────────────────────────
  if (BYPASS_ALLOWED() && req.cookies?.dev_session === "1") {
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

  let clerkUserId: string | null = null;
  try {
    clerkUserId = getAuth(req).userId ?? null;
  } catch {
    // Clerk middleware not configured — treat as unauthenticated
  }

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
