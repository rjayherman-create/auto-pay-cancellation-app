export type WorkflowEvent = {
  workflowId: string;
  workflowType: string;
  event: string;
  step?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

const API_URL = "/api/workflow-analytics";

export default class WorkflowTracker {
  workflowId: string;
  workflowType: string;
  startedAt: number;
  currentStep: string | null;
  rageClicks: number;
  private stepStartedAt: Map<string, number>;
  private completed: boolean;

  constructor(workflowType: string) {
    this.workflowId = `wf_${Math.random().toString(36).substring(2, 12)}`;
    this.workflowType = workflowType;
    this.startedAt = Date.now();
    this.currentStep = null;
    this.rageClicks = 0;
    this.stepStartedAt = new Map();
    this.completed = false;

    void this.track("workflow_started");
  }

  async track(event: string, step?: string, metadata?: Record<string, unknown>) {
    const payload: WorkflowEvent = {
      workflowId: this.workflowId,
      workflowType: this.workflowType,
      event,
      step,
      timestamp: Date.now(),
      metadata,
    };

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        keepalive: true,
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Tracking failed", err);
    }
  }

  startStep(step: string, metadata?: Record<string, unknown>) {
    this.currentStep = step;
    this.stepStartedAt.set(step, Date.now());
    void this.track("step_started", step, metadata);
  }

  completeStep(step: string, metadata?: Record<string, unknown>) {
    const startedAt = this.stepStartedAt.get(step) || this.startedAt;
    void this.track("step_completed", step, {
      ...metadata,
      durationMs: Date.now() - startedAt,
      totalElapsedMs: Date.now() - this.startedAt,
    });
  }

  workflowCompleted(metadata?: Record<string, unknown>) {
    this.completed = true;
    void this.track("workflow_completed", undefined, {
      ...metadata,
      totalDurationMs: Date.now() - this.startedAt,
      rageClicks: this.rageClicks,
    });
  }

  workflowAbandoned(metadata?: Record<string, unknown>) {
    if (this.completed) return;
    const payload: WorkflowEvent = {
      workflowId: this.workflowId,
      workflowType: this.workflowType,
      event: "workflow_abandoned",
      step: this.currentStep || undefined,
      timestamp: Date.now(),
      metadata: {
        ...metadata,
        totalDurationMs: Date.now() - this.startedAt,
        rageClicks: this.rageClicks,
      },
    };

    void fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify(payload),
    }).catch((err) => console.error("Tracking failed", err));
  }

  registerRageClick(metadata?: Record<string, unknown>) {
    this.rageClicks += 1;
    void this.track("rage_click", this.currentStep || undefined, {
      ...metadata,
      rageClicks: this.rageClicks,
    });
  }
}
