import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  userId?: number;
  clerkUserId?: string;
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

  req.clerkUserId = clerkUserId;

  try {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    if (user) {
      req.userId = user.id;
    }
    next();
  } catch (err: any) {
    console.error("[Auth] DB lookup error:", err.message);
    res.status(500).json({ error: "server_error", message: "Authentication check failed" });
  }
}
