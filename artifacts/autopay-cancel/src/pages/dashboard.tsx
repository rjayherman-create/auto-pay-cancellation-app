import { useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetBankAccountsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecurringPaymentsQueryKey,
  useGetDashboardSummary,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaidLinkButton } from "@/components/plaid-link-button";

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardSummary();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);

  const refreshScanResults = () => {
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecurringPaymentsQueryKey() });
  };

  if (isLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          Failed to load dashboard summary.
        </div>
      </Layout>
    );
  }

  const monthlyCharges = data.totalMonthlySpend;
  const annualSavings = data.potentialMonthlySavings * 12;
  const activeCaseCount = data.recentActivity.length;
  const pendingCancellations = data.activeSubscriptions;
  const openDisputes = data.recentActivity.filter(
    (activity) => activity.type === "disputed"
  ).length;

  return (
    <Layout>
      <div className="min-h-full bg-zinc-100">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            Protection Dashboard
          </h1>
          <p className="mt-2 text-lg text-zinc-600">
            Track cancellations, organize proof, and monitor recurring charges.
          </p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard title="Monthly Charges" value={`$${monthlyCharges.toFixed(2)}`} />
          <MetricCard title="Annual Savings" value={`$${annualSavings.toFixed(2)}`} />
          <MetricCard title="Open Disputes" value={openDisputes.toString()} />
          <MetricCard title="Pending Cancellations" value={pendingCancellations.toString()} />
        </div>

        <div className="mb-10 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="grid gap-4 text-sm font-medium text-zinc-700 md:grid-cols-4">
            <div>Formal cancellation letters</div>
            <div>Continued charge dispute tools</div>
            <div>Organized proof storage</div>
            <div>Consumer billing workflow support</div>
          </div>
        </div>

        <div className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Start with an account scan</h2>
              <p className="mt-1 max-w-3xl text-zinc-600">
                Connect a bank or card account to find recurring ACH and card charges before choosing a cancellation, dispute, or evidence workflow.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <PlaidLinkButton
                label={data.connectedAccounts === 0 ? "Start Account Scan" : "Scan Another Account"}
                className="h-12 px-6"
                onStart={() => setScanning(true)}
                onEnd={() => setScanning(false)}
                onSuccess={refreshScanResults}
              />
              {data.activeSubscriptions > 0 && (
                <Link
                  href="/subscriptions"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-200 px-6 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  Review Results
                </Link>
              )}
            </div>
          </div>
          {scanning && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Secure connection started. Recurring charges will appear after the account connects.
            </div>
          )}
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <ActionCard
            title="Stop Subscription"
            description="Review recurring charges and generate a formal cancellation request."
            button="Start Cancellation"
            href="/subscriptions"
          />
          <ActionCard
            title="Still Being Charged?"
            description="Create a dispute packet and evidence timeline."
            button="Open Dispute"
            href="/continued-charges"
            danger
          />
          <ActionCard
            title="Upload Evidence"
            description="Store screenshots, confirmations, and letters."
            button="Open Vault"
            href="/evidence-vault"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-zinc-900">Active Protection Cases</h2>
              <span className="text-sm text-zinc-500">{activeCaseCount} active records</span>
            </div>
          </div>

          {data.recentActivity.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">
              No active cases yet. Start an account scan or open a cancellation workflow to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-zinc-50">
                  <tr className="text-left text-sm text-zinc-500">
                    <th className="p-4 font-medium">Merchant</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Last Action</th>
                    <th className="p-4 font-medium">Next Step</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity.map((activity) => {
                    const status = getCaseStatus(activity.type);
                    return (
                      <tr key={activity.id} className="border-t border-zinc-100">
                        <td className="p-4 font-medium text-zinc-900">{activity.merchantName}</td>
                        <td className={`p-4 font-medium ${status.className}`}>
                          {status.label}
                        </td>
                        <td className="p-4 text-zinc-600">
                          {activity.description || `Updated ${format(new Date(activity.date), "MMM d, yyyy")}`}
                        </td>
                        <td className="p-4 text-zinc-600">
                          {status.nextStep}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-80 rounded-xl bg-zinc-200" />
        <Skeleton className="mt-3 h-6 w-[28rem] rounded-xl bg-zinc-200" />
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-2xl bg-zinc-200" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl bg-zinc-200" />
    </div>
  );
}

function getCaseStatus(type: string) {
  if (type === "cancelled" || type === "saved") {
    return {
      label: "Complete",
      className: "text-green-600",
      nextStep: "Monitor for new charges",
    };
  }

  if (type === "disputed") {
    return {
      label: "Still Charging",
      className: "text-red-600",
      nextStep: "Upload statement proof",
    };
  }

  return {
    label: "Waiting",
    className: "text-amber-600",
    nextStep: "Review documents or upload proof",
  };
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <p className="mb-2 text-sm text-zinc-500">{title}</p>
      <h3 className="text-3xl font-bold text-zinc-900">{value}</h3>
    </div>
  );
}

function ActionCard({
  title,
  description,
  button,
  href,
  danger,
}: {
  title: string;
  description: string;
  button: string;
  href: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        danger ? "border-red-200 bg-red-50" : "border-zinc-200 bg-white"
      }`}
    >
      <h3 className="mb-3 text-xl font-bold text-zinc-900">{title}</h3>
      <p className="mb-6 text-zinc-600">{description}</p>
      <Link
        href={href}
        className={`inline-flex rounded-xl px-5 py-3 font-semibold ${
          danger ? "bg-red-600 text-white hover:bg-red-700" : "bg-black text-white hover:bg-zinc-800"
        }`}
      >
        {button}
      </Link>
    </div>
  );
}
