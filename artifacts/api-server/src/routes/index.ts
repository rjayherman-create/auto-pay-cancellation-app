import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import accountsRouter from "./accounts.js";
import paymentsRouter from "./payments.js";
import documentsRouter from "./documents.js";
import dashboardRouter from "./dashboard.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/accounts", accountsRouter);
router.use("/payments", paymentsRouter);
router.use("/documents", documentsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
