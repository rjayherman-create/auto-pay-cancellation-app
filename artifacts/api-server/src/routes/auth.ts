import { Router, type IRouter } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/auth/me — returns our internal profile, creating it on first access
router.get("/me", async (req, res) => {
  try {
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
  res.json({ success: true });
});

export default router;
