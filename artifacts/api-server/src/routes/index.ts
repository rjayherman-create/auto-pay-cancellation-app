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
import disputesRouter from "./disputes.js";
import continuedChargesRouter from "./continuedCharges.js";
import merchantDirectoryRouter from "./merchantDirectory.js";
import workflowAnalyticsRouter from "./workflowAnalytics.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authLimiter, authRouter);
router.use("/accounts", accountsRouter);
router.use("/payments", paymentsRouter);
router.use("/documents", documentsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/stripe", stripeRouter);
router.use("/plaid", plaidRouter);
router.use("/admin", adminRouter);
router.use("/disputes", disputesRouter);
router.use("/continued-charges", continuedChargesRouter);
router.use("/merchant-directory", merchantDirectoryRouter);
router.use("/workflow-analytics", workflowAnalyticsRouter);

export default router;
