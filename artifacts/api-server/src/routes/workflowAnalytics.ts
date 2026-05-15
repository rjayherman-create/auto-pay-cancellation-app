import { Router, type IRouter } from "express";
import { db, workflowAnalyticsTable } from "@workspace/db";
import { and, desc, eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

type WorkflowEventInput = {
  workflowId?: string;
  workflowType?: string;
  event?: string;
  step?: string;
  timestamp?: number;
  metadata?: unknown;
};

const allowedEvents = new Set([
  "workflow_started",
  "step_started",
  "step_completed",
  "workflow_completed",
  "workflow_abandoned",
  "rage_click",
]);

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = req.body as WorkflowEventInput;

    if (!body.workflowId || !body.workflowType || !body.event || !body.timestamp) {
      res.status(400).json({
        success: false,
        error: "workflowId, workflowType, event, and timestamp are required",
      });
      return;
    }

    if (!allowedEvents.has(body.event)) {
      res.status(400).json({ success: false, error: "Invalid workflow event" });
      return;
    }

    await db.insert(workflowAnalyticsTable).values({
      userId: req.userId,
      workflowId: body.workflowId,
      workflowType: body.workflowType,
      event: body.event,
      step: body.step || null,
      timestampMs: Math.trunc(body.timestamp),
      metadata: body.metadata ?? null,
      userAgent: req.get("user-agent") || null,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

router.get("/summary", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }

    const events = await db
      .select()
      .from(workflowAnalyticsTable)
      .where(eq(workflowAnalyticsTable.userId, req.userId))
      .orderBy(desc(workflowAnalyticsTable.createdAt))
      .limit(5000);

    const started = events.filter((item) => item.event === "workflow_started");
    const completed = events.filter((item) => item.event === "workflow_completed");
    const abandoned = events.filter((item) => item.event === "workflow_abandoned");
    const rageClicks = events.filter((item) => item.event === "rage_click");
    const completedWorkflowIds = new Set(completed.map((item) => item.workflowId));
    const startedWorkflowIds = new Set(started.map((item) => item.workflowId));

    const totalCompletionMs = completed.reduce(
      (sum, item) => sum + readNumber(item.metadata, "totalDurationMs"),
      0
    );
    const averageCompletionMs = totalCompletionMs / (completed.length || 1);

    const stepStats = events
      .filter((item) => item.event === "step_completed" && item.step)
      .reduce<Record<string, { completed: number; totalDurationMs: number }>>((acc, item) => {
        const step = item.step!;
        acc[step] ||= { completed: 0, totalDurationMs: 0 };
        acc[step].completed += 1;
        acc[step].totalDurationMs += readNumber(item.metadata, "durationMs");
        return acc;
      }, {});

    const dropOffByStep = abandoned.reduce<Record<string, number>>((acc, item) => {
      const step = item.step || "unknown";
      acc[step] = (acc[step] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      totalStarted: started.length,
      totalCompleted: completed.length,
      totalAbandoned: abandoned.length,
      totalRageClicks: rageClicks.length,
      uniqueWorkflowsStarted: startedWorkflowIds.size,
      uniqueWorkflowsCompleted: completedWorkflowIds.size,
      completionRate: completed.length / (started.length || 1),
      averageCompletionSeconds: Math.round(averageCompletionMs / 1000),
      stepStats: Object.fromEntries(
        Object.entries(stepStats).map(([step, value]) => [
          step,
          {
            completed: value.completed,
            averageSeconds: Math.round(value.totalDurationMs / value.completed / 1000),
          },
        ])
      ),
      dropOffByStep,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false });
  }
});

router.get("/recent", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const workflowId = String(req.query.workflowId || "");

  const rows = workflowId
    ? await db
        .select()
        .from(workflowAnalyticsTable)
        .where(
          and(
            eq(workflowAnalyticsTable.userId, req.userId),
            eq(workflowAnalyticsTable.workflowId, workflowId)
          )
        )
        .orderBy(desc(workflowAnalyticsTable.createdAt))
        .limit(100)
    : await db
        .select()
        .from(workflowAnalyticsTable)
        .where(eq(workflowAnalyticsTable.userId, req.userId))
        .orderBy(desc(workflowAnalyticsTable.createdAt))
        .limit(100);

  return res.json(rows);
});

function readNumber(metadata: unknown, key: string): number {
  if (!metadata || typeof metadata !== "object") return 0;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export default router;
