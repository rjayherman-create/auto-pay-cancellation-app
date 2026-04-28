import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { getBillingState } from "../billingState.js";
import { getDbState } from "../dbState.js";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const billing = getBillingState();
  const db = getDbState();
  const data = HealthCheckResponse.parse({
    status: "ok",
    billingActive: billing.billingActive,
    ...(billing.keyPrefix !== undefined ? { keyPrefix: billing.keyPrefix } : {}),
    lastDbPingAt: db.lastDbPingAt ?? null,
    ...(db.dbDownSince !== null ? { dbDownSince: db.dbDownSince } : {}),
  });
  res.json(data);
});

export default router;
