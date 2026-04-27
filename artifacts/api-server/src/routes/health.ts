import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getBillingState } from "../billingState.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const billing = getBillingState();
  const data = HealthCheckResponse.parse({
    status: "ok",
    billingActive: billing.billingActive,
    ...(billing.keyPrefix !== undefined ? { keyPrefix: billing.keyPrefix } : {}),
  });
  res.json(data);
});

export default router;
