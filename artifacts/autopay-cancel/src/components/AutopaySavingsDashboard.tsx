import { useMemo, useState } from "react";
import {
  type AutopayItem,
  type CancellationStatus,
  type LetterType,
  calculateAutopaySummary,
  generateAutopayLetter,
  loadProof,
  loadStatus,
  money,
  saveProof,
  saveStatus,
} from "@/lib/autopayTools";

type Props = {
  items: AutopayItem[];
  customerName?: string;
  customerEmail?: string;
};

const statuses: CancellationStatus[] = [
  "Not Started",
  "Letter Created",
  "Sent",
  "Waiting",
  "Canceled",
  "Still Charging",
];

const letterTypes: LetterType[] = [
  "Cancel Subscription",
  "Request Refund",
  "Dispute Continued Charges",
];

const statusColors: Record<CancellationStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-600",
  "Letter Created": "bg-blue-100 text-blue-700",
  "Sent": "bg-indigo-100 text-indigo-700",
  "Waiting": "bg-amber-100 text-amber-700",
  "Canceled": "bg-emerald-100 text-emerald-700",
  "Still Charging": "bg-red-100 text-red-700",
};

export default function AutopaySavingsDashboard({ items, customerName, customerEmail }: Props) {
  const [selectedMerchant, setSelectedMerchant] = useState<string>(
    items?.[0]?.merchantName || ""
  );
  const [letterType, setLetterType] = useState<LetterType>("Cancel Subscription");
  const [refreshKey, setRefreshKey] = useState(0);
  const [copiedLetter, setCopiedLetter] = useState(false);

  const summary = useMemo(() => calculateAutopaySummary(items || []), [items]);

  const selectedItem = items.find((item) => item.merchantName === selectedMerchant) || items?.[0];

  const itemsInProgress = items.filter((item) => {
    const status = loadStatus(item.merchantName);
    return status !== "Canceled" && status !== "Not Started";
  }).length;

  const generatedLetter = selectedItem
    ? generateAutopayLetter({
        letterType,
        merchantName: selectedItem.merchantName,
        customerName,
        customerEmail,
        amount: selectedItem.amount,
        dateSent: loadProof(selectedItem.merchantName).dateSent,
      })
    : "";

  function updateStatus(merchantName: string, status: CancellationStatus) {
    saveStatus(merchantName, status);
    setRefreshKey((v) => v + 1);
  }

  function updateProof(
    merchantName: string,
    field: "notes" | "dateSent" | "confirmationNumber" | "companyContact",
    value: string
  ) {
    const existing = loadProof(merchantName);
    saveProof(merchantName, { ...existing, [field]: value });
    setRefreshKey((v) => v + 1);
  }

  function copyLetter() {
    if (!generatedLetter) return;
    navigator.clipboard.writeText(generatedLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
    if (selectedItem) {
      saveStatus(selectedItem.merchantName, "Letter Created");
      setRefreshKey((v) => v + 1);
    }
  }

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <h2 className="text-2xl font-bold text-slate-900">Autopay Savings Dashboard</h2>
        <p className="mt-2 text-slate-500 max-w-md mx-auto">
          Connect a bank account to automatically detect recurring payments, then use
          this dashboard to generate cancellation letters and track your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <h2 className="text-2xl font-bold text-slate-900">Autopay Savings Dashboard</h2>
        </div>
        <p className="text-slate-500 text-sm">
          Find recurring payments, generate cancellation letters, track follow-ups, and
          organize proof if a company keeps charging you.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Recurring Payments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-blue-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Monthly Autopays</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">{money(summary.monthlyTotal)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-indigo-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Yearly Cost</p>
            <p className="mt-2 text-3xl font-bold text-indigo-900">{money(summary.yearlyTotal)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Items in Progress</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">{itemsInProgress}</p>
          </div>
        </div>

        <p className="mt-4 rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">
          <span className="font-semibold">Note:</span> This tool helps organize cancellation requests
          and follow-up letters. It does not guarantee that a company will cancel a service or issue a refund.
        </p>
      </div>

      {/* ── Tracker + Letter Generator ────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">

        {/* Left: Cancellation Status Tracker + Proof Vault */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Cancellation Tracker</h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {items.map((item) => {
              const status = loadStatus(item.merchantName);
              const proof = loadProof(item.merchantName);

              return (
                <div
                  key={`${item.merchantName}-${refreshKey}`}
                  className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{item.merchantName}</p>
                      <p className="text-sm text-slate-500">
                        {money(Number(item.amount || 0))}
                        {item.frequency ? ` / ${item.frequency}` : ""}
                      </p>
                      {item.nextChargeDate && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Next charge: {item.nextChargeDate}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>
                        {status}
                      </span>
                      <select
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={status}
                        onChange={(e) => updateStatus(item.merchantName, e.target.value as CancellationStatus)}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Proof Vault fields */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Date letter sent"
                      defaultValue={proof.dateSent || ""}
                      onBlur={(e) => updateProof(item.merchantName, "dateSent", e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Confirmation number"
                      defaultValue={proof.confirmationNumber || ""}
                      onBlur={(e) => updateProof(item.merchantName, "confirmationNumber", e.target.value)}
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs placeholder-slate-400 sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Company contact, email, phone, or cancellation link"
                      defaultValue={proof.companyContact || ""}
                      onBlur={(e) => updateProof(item.merchantName, "companyContact", e.target.value)}
                    />
                    <textarea
                      className="min-h-[64px] rounded-lg border border-slate-200 px-3 py-2 text-xs placeholder-slate-400 sm:col-span-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Notes / proof / follow-up details"
                      defaultValue={proof.notes || ""}
                      onBlur={(e) => updateProof(item.merchantName, "notes", e.target.value)}
                    />
                  </div>

                  <button
                    className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
                    onClick={() => setSelectedMerchant(item.merchantName)}
                  >
                    Generate Letter →
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Letter Generator */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Letter Generator</h3>

          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Company</span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
              >
                {items.map((item) => (
                  <option key={item.merchantName} value={item.merchantName}>
                    {item.merchantName} — {money(item.amount)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Letter Type</span>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as LetterType)}
              >
                {letterTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <textarea
              className="flex-1 min-h-[380px] w-full rounded-xl border border-slate-200 p-4 font-mono text-xs leading-relaxed text-slate-700 bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={generatedLetter}
              readOnly
            />

            <button
              className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
              onClick={copyLetter}
              disabled={!generatedLetter}
            >
              {copiedLetter ? "✓ Copied to Clipboard" : "Copy Letter"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
