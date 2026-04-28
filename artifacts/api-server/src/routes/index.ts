import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import accountsRouter from "./accounts.js";
import paymentsRouter from "./payments.js";
import documentsRouter from "./documents.js";
import dashboardRouter from "./dashboard.js";
import stripeRouter from "./stripe.js";
import plaidRouter from "./plaid.js";
import adminRouter from "./admin.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { requireDbReady } from "../middlewares/dbReadyCheck.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authLimiter, authRouter);
router.use("/accounts", requireDbReady, accountsRouter);
router.use("/payments", requireDbReady, paymentsRouter);
router.use("/documents", requireDbReady, documentsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/stripe", stripeRouter);
router.use("/plaid", plaidRouter);
router.use("/admin", adminRouter);

export default router;
