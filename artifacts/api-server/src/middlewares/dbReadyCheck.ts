import { Request, Response, NextFunction } from "express";
import { getDbState } from "../dbState.js";

export function requireDbReady(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!getDbState().dbReady) {
    res.setHeader("Retry-After", "10");
    res.status(503).json({
      error: "service_unavailable",
      message: "The database is not ready. Please retry shortly.",
    });
    return;
  }
  next();
}
