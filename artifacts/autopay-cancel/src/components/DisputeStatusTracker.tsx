import { CheckCircle2, Circle } from "lucide-react";

const statuses = [
  "draft",
  "generated",
  "sent_to_merchant",
  "sent_to_bank",
  "waiting",
  "resolved",
  "still_charging",
] as const;

const labels: Record<(typeof statuses)[number], string> = {
  draft: "Draft",
  generated: "Generated",
  sent_to_merchant: "Sent To Merchant",
  sent_to_bank: "Sent To Bank",
  waiting: "Waiting",
  resolved: "Resolved",
  still_charging: "Still Charging",
};

export function DisputeStatusTracker({
  currentStatus,
}: {
  currentStatus: string;
}) {
  const normalized = (currentStatus || "draft").toLowerCase().replace(/\s+/g, "_");
  const currentIndex = Math.max(0, statuses.indexOf(normalized as (typeof statuses)[number]));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="mb-3 text-sm font-medium text-slate-200">Status Tracker</div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status, idx) => {
          const done = idx <= currentIndex;
          return (
            <div
              key={status}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                done
                  ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-300"
                  : "border-white/10 bg-slate-950/40 text-slate-400"
              }`}
            >
              {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
              <span>{labels[status]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
