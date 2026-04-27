import { Request, Response, NextFunction } from "express";
import { getAuth, createClerkClient } from "@clerk/express";
import { getDb, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId: clerkUserId } = getAuth(req);

  if (!clerkUserId) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  try {
    // Look up the user in our DB by their Clerk ID
    const [existing] = await getDb()
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUserId))
      .limit(1);

    if (existing) {
      req.userId = existing.id;
      next();
      return;
    }

    // Auto-create user on first visit — fetch their profile from Clerk
    let email = "";
    let name = "";
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || email.split("@")[0];
    } catch {
      // If Clerk profile fetch fails, proceed with empty defaults
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const [created] = await getDb()
      .insert(usersTable)
      .values({
        clerkId: clerkUserId,
        email: email || `${clerkUserId}@clerk.local`,
        name: name || "User",
        subscriptionStatus: "trial",
        trialEndsAt,
      })
      .onConflictDoNothing()
      .returning();

    if (created) {
      req.userId = created.id;
      next();
      return;
    }

    // Race condition: another request created the user concurrently — re-fetch
    const [refetched] = await getDb()
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, clerkUserId))
      .limit(1);

    if (refetched) {
      req.userId = refetched.id;
      next();
      return;
    }

    res.status(500).json({ error: "internal_error", message: "Failed to provision user" });
  } catch (err: any) {
    console.error("[Auth] requireAuth error:", err.message);
    res.status(500).json({ error: "internal_error", message: "Authentication check failed" });
  }
}
