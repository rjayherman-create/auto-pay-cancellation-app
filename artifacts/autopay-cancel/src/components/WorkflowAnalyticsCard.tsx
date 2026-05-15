import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WorkflowAnalyticsSummary = {
  totalStarted: number;
  totalCompleted: number;
  totalAbandoned: number;
  totalRageClicks: number;
  completionRate: number;
  averageCompletionSeconds: number;
  stepStats: Record<string, { completed: number; averageSeconds: number }>;
  dropOffByStep: Record<string, number>;
};

export function WorkflowAnalyticsCard() {
  const [stats, setStats] = useState<WorkflowAnalyticsSummary | null>(null);

  useEffect(() => {
    fetch("/api/workflow-analytics/summary", {
      credentials: "include",
    })
      .then((response) => response.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return null;

  return (
    <Card className="rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Workflow Speed Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Started" value={stats.totalStarted.toString()} />
          <Metric label="Completed" value={stats.totalCompleted.toString()} />
          <Metric label="Completion Rate" value={`${(stats.completionRate * 100).toFixed(1)}%`} />
          <Metric label="Avg Completion" value={`${stats.averageCompletionSeconds}s`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">Step Timing</div>
            <div className="space-y-2 text-sm">
              {Object.entries(stats.stepStats).map(([step, value]) => (
                <div key={step} className="flex justify-between gap-4">
                  <span className="capitalize text-slate-600">{step.replace(/_/g, " ")}</span>
                  <span className="font-medium text-slate-900">{value.averageSeconds}s</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">Drop-Offs</div>
            <div className="space-y-2 text-sm">
              {Object.entries(stats.dropOffByStep).map(([step, value]) => (
                <div key={step} className="flex justify-between gap-4">
                  <span className="capitalize text-slate-600">{step.replace(/_/g, " ")}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
              {!Object.keys(stats.dropOffByStep).length && (
                <div className="text-slate-500">No drop-offs recorded yet.</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Rage clicks recorded: <span className="font-bold">{stats.totalRageClicks}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
