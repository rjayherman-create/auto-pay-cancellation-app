import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "autopay-cancel-secret-key-dev";

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body as {
    email: string;
    password: string;
    name: string;
  };

  if (!email || !password || !name) {
    res.status(400).json({ error: "validation_error", message: "Email, password, and name are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "validation_error", message: "Password must be at least 8 characters" });
    return;
  }

  const existing = await getDb().select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "conflict", message: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  const [user] = await getDb().insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    name,
    subscriptionStatus: "trial",
    trialEndsAt,
  }).returning();

  const token = generateToken(user.id);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: "validation_error", message: "Email and password are required" });
    return;
  }

  const [user] = await getDb().select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "unauthorized", message: "Invalid credentials" });
    return;
  }

  const token = generateToken(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus,
    },
  });
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  let decoded: { userId: number };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    res.status(401).json({ error: "unauthorized", message: "Invalid token" });
    return;
  }

  const [user] = await getDb().select().from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);
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

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

export default router;
