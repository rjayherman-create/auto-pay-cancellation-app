import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  GetRecurringPaymentsStatus,
  useGetRecurringPayments,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, FlaskConical } from "lucide-react";
import { useAuth } from "@/lib/auth";
import AutopaySavingsDashboard from "@/components/AutopaySavingsDashboard";
import type { AutopayItem } from "@/lib/autopayTools";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

export default function Subscriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<GetRecurringPaymentsStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");

  const { data: payments, isLoading, error } = useGetRecurringPayments(
    filter === "all" ? undefined : { status: filter }
  );

  async function loadDemoData() {
    setSeeding(true);
    setSeedMsg("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/seed-demo`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to seed demo data");
      setSeedMsg(`Loaded: ${data.message}`);
      queryClient.invalidateQueries();
    } catch (err: any) {
      setSeedMsg(`Error: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  }

  const filteredPayments = payments?.filter((payment) =>
    payment.merchantName.toLowerCase().includes(search.toLowerCase())
  );

  const autopayItems: AutopayItem[] = (payments || []).map((payment) => ({
    id: String(payment.id),
    merchantName: payment.merchantName,
    amount: Number(payment.amount || 0),
    frequency: payment.frequency || "monthly",
    nextChargeDate: (payment as any).nextChargeDate || "",
  }));

  return (
    <Layout>
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            Subscription Protection
          </h1>
          <p className="mt-2 text-zinc-600">
            Manage cancellations, disputes, and proof.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={loadDemoData}
              disabled={seeding}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-amber-400 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              {seeding ? "Loading demo data..." : "Load Demo Data"}
            </button>
            {seedMsg && (
              <span
                className={`text-xs font-medium ${
                  seedMsg.startsWith("Loaded") ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {seedMsg}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              placeholder="Search merchants..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-white pl-9 sm:w-64"
            />
          </div>
          <div className="flex rounded-xl border border-zinc-200 bg-white p-1">
            {(["all", "active", "cancelled", "disputed"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item as GetRecurringPaymentsStatus | "all")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === item ? "bg-black text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!isLoading && (
        <div className="mb-8">
          <AutopaySavingsDashboard
            items={autopayItems}
            customerName={user?.name}
            customerEmail={user?.email}
          />
        </div>
      )}

      <div className="mb-4">
        <h2 className="text-xl font-bold text-zinc-900">Protection Cases</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Use each case to manage the timeline, proof, and documents.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-5">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-48 rounded-2xl bg-zinc-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-8 text-center text-red-500">
          Error loading subscriptions.
        </div>
      ) : !filteredPayments?.length ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-16 text-center">
          <SlidersHorizontal className="mx-auto mb-4 h-12 w-12 text-zinc-300" />
          <h3 className="mb-2 text-lg font-bold text-zinc-900">No subscriptions found</h3>
          <p className="text-zinc-500">
            Connect a bank account or adjust your filters to see subscriptions.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredPayments.map((payment) => (
            <SubscriptionCard
              key={payment.id}
              id={payment.id}
              merchant={payment.merchantName}
              amount={`$${payment.amount.toFixed(2)} / ${payment.frequency}`}
              status={getCaseStatus(payment.status)}
              nextStep={getNextStep(payment.status, payment.cancellationDifficulty)}
              danger={payment.status === "disputed"}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}

function getCaseStatus(status: string) {
  if (status === "cancelled") return "Canceled";
  if (status === "disputed") return "Still Charging";
  return "Waiting";
}

function getNextStep(status: string, difficulty: string) {
  if (status === "cancelled") return "Completed. Monitor future statements.";
  if (status === "disputed") return "Generate refund dispute and upload statement proof.";
  if (difficulty === "hard") return "Prepare written cancellation and keep proof.";
  return "Generate cancellation letter and follow up.";
}

function SubscriptionCard({
  id,
  merchant,
  amount,
  status,
  nextStep,
  danger,
}: {
  id: number;
  merchant: string;
  amount: string;
  status: string;
  nextStep: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 ${
        danger ? "border-red-300" : "border-zinc-200"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">{merchant}</h2>
          <p className="mt-1 text-zinc-500">{amount}</p>
        </div>

        <div
          className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
            status === "Canceled"
              ? "bg-green-100 text-green-700"
              : status === "Still Charging"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {status}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm uppercase tracking-wide text-zinc-500">Next Step</p>
        <p className="mt-1 font-medium text-zinc-900">{nextStep}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/subscriptions/${id}`}
          className="rounded-xl bg-black px-4 py-2 font-semibold text-white hover:bg-zinc-800"
        >
          View Timeline
        </Link>
        <Link
          href="/evidence-vault"
          className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Upload Proof
        </Link>
        <Link
          href={`/documents?paymentId=${id}`}
          className="rounded-xl border border-zinc-300 px-4 py-2 font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Generate Letter
        </Link>
      </div>
    </div>
  );
}
