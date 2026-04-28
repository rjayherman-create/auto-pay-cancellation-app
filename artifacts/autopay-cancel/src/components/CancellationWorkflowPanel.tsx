import React, { useMemo, useState } from "react";
import {
  AutopayWorkflowItem,
  CancellationStatus,
  LetterType,
  LETTER_TYPES,
  STATUS_OPTIONS,
  findDirectoryEntry,
  generateWorkflowLetter,
  getAlertText,
  getAutopayScore,
  loadProof,
  loadStatus,
  money,
  saveProof,
  saveStatus,
} from "@/lib/cancellationWorkflow";

type Props = {
  items: AutopayWorkflowItem[];
  customerName?: string;
  customerEmail?: string;
};

export default function CancellationWorkflowPanel({ items, customerName, customerEmail }: Props) {
  const safeItems = Array.isArray(items) ? items : [];

  const [selectedMerchant, setSelectedMerchant] = useState(safeItems[0]?.merchantName || "");
  const [letterType, setLetterType] = useState<LetterType>("Cancel Subscription");
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedItem = useMemo(() => {
    return safeItems.find((item) => item.merchantName === selectedMerchant) || safeItems[0];
  }, [safeItems, selectedMerchant, refreshKey]);

  const generatedLetter = selectedItem
    ? generateWorkflowLetter({
        letterType,
        merchantName: selectedItem.merchantName,
        customerName: selectedItem.customerName || customerName,
        customerEmail: selectedItem.customerEmail || customerEmail,
        accountLastFour: selectedItem.accountLastFour,
        amount: selectedItem.amount,
        dateSent: loadProof(selectedItem.merchantName).dateSent,
      })
    : "";

  function forceRefresh() {
    setRefreshKey((v) => v + 1);
  }

  function handleStatusChange(merchantName: string, status: CancellationStatus) {
    saveStatus(merchantName, status);
    forceRefresh();
  }

  function handleProofChange(
    merchantName: string,
    field: "generatedLetter" | "dateSent" | "companyName" | "companyContact" | "confirmationNumber" | "notes",
    value: string
  ) {
    const proof = loadProof(merchantName);
    saveProof(merchantName, { ...proof, companyName: merchantName, [field]: value });
    forceRefresh();
  }

  function handleProofFiles(merchantName: string, files: FileList | null) {
    const proof = loadProof(merchantName);
    const fileNames = files ? Array.from(files).map((f) => f.name) : [];
    saveProof(merchantName, { ...proof, companyName: merchantName, proofFileNames: fileNames });
    forceRefresh();
  }

  async function copyLetter() {
    if (!selectedItem || !generatedLetter) return;
    await navigator.clipboard.writeText(generatedLetter);
    const proof = loadProof(selectedItem.merchantName);
    saveProof(selectedItem.merchantName, { ...proof, companyName: selectedItem.merchantName, generatedLetter });
    saveStatus(selectedItem.merchantName, "Letter Created");
    forceRefresh();
  }

  if (safeItems.length === 0) {
    return (
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Cancellation Workflow</h2>
        <p className="mt-2 text-gray-600">
          Once recurring payments are loaded, this section will help track cancellation status,
          follow-ups, proof, and refund/dispute letters.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Cancellation Workflow</h2>
        <p className="mt-2 text-gray-600">
          Track cancellation status, set follow-up reminders, organize proof, and generate
          refund or continued-charge dispute letters.
        </p>
        <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          This app helps you identify recurring payments, generate cancellation requests, track
          follow-up steps, and organize proof. It does not guarantee that a company will cancel
          a service, issue a refund, or stop billing immediately.
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: per-item status + proof ───────────────────────────── */}
        <div className="space-y-4">
          {safeItems.map((item) => {
            const status = loadStatus(item.merchantName);
            const proof = loadProof(item.merchantName);
            const alerts = getAlertText(item);
            const score = getAutopayScore(item.merchantName, status);
            const directory = findDirectoryEntry(item.merchantName);

            return (
              <div
                key={`${item.merchantName}-${refreshKey}`}
                className="rounded-2xl border bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{item.merchantName}</h3>
                    <p className="text-sm text-gray-600">
                      {money(item.amount)}
                      {item.frequency ? ` / ${item.frequency}` : ""}
                    </p>
                    {item.nextChargeDate ? (
                      <p className="mt-1 text-sm text-gray-500">Next charge: {item.nextChargeDate}</p>
                    ) : null}
                    <div className="mt-2 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {score}
                    </div>
                  </div>

                  <div className="w-full md:w-52">
                    <label className="block text-xs font-semibold text-gray-600">Status</label>
                    <select
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      value={status}
                      onChange={(e) =>
                        handleStatusChange(item.merchantName, e.target.value as CancellationStatus)
                      }
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {alerts.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {alerts.map((alert) => (
                      <div key={alert} className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-900">
                        {alert}
                      </div>
                    ))}
                  </div>
                ) : null}

                {directory ? (
                  <div className="mt-4 rounded-xl border bg-gray-50 p-4">
                    <h4 className="font-semibold">Company Cancellation Directory</h4>
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                      <p><strong>Best method:</strong> {directory.bestMethod}</p>
                      {directory.phone ? <p><strong>Phone:</strong> {directory.phone}</p> : null}
                      {directory.email ? <p><strong>Email:</strong> {directory.email}</p> : null}
                      {directory.mailingAddress ? (
                        <p><strong>Mailing address:</strong> {directory.mailingAddress}</p>
                      ) : null}
                      {directory.website ? (
                        <p>
                          <strong>Website:</strong>{" "}
                          <a className="underline" href={directory.website} target="_blank" rel="noreferrer">
                            Open cancellation link
                          </a>
                        </p>
                      ) : null}
                      {directory.notes ? <p><strong>Notes:</strong> {directory.notes}</p> : null}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                    <strong>Company Cancellation Directory:</strong> No saved directory entry yet.
                    Use the proof vault below to store the best phone, email, mailing address, or
                    cancellation link.
                  </div>
                )}

                <div className="mt-4 rounded-xl border p-4">
                  <h4 className="font-semibold">Cancellation Proof Vault</h4>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <input
                      className="rounded-lg border px-3 py-2 text-sm"
                      type="date"
                      defaultValue={proof.dateSent || ""}
                      onBlur={(e) => handleProofChange(item.merchantName, "dateSent", e.target.value)}
                    />
                    <input
                      className="rounded-lg border px-3 py-2 text-sm"
                      placeholder="Confirmation number"
                      defaultValue={proof.confirmationNumber || ""}
                      onBlur={(e) => handleProofChange(item.merchantName, "confirmationNumber", e.target.value)}
                    />
                    <input
                      className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
                      placeholder="Email, mailing address, phone, or cancellation link"
                      defaultValue={proof.companyContact || ""}
                      onBlur={(e) => handleProofChange(item.merchantName, "companyContact", e.target.value)}
                    />
                    <textarea
                      className="min-h-[80px] rounded-lg border px-3 py-2 text-sm md:col-span-2"
                      placeholder="Notes, proof, screenshots taken, who you spoke with, follow-up details..."
                      defaultValue={proof.notes || ""}
                      onBlur={(e) => handleProofChange(item.merchantName, "notes", e.target.value)}
                    />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Screenshot / proof filenames
                      </label>
                      <input
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        type="file"
                        multiple
                        onChange={(e) => handleProofFiles(item.merchantName, e.target.files)}
                      />
                      {proof.proofFileNames?.length ? (
                        <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                          {proof.proofFileNames.map((fn) => <li key={fn}>{fn}</li>)}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </div>

                <button
                  className="generate-letter mt-4 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setSelectedMerchant(item.merchantName)}
                >
                  Generate Letter
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Right: letter generator ──────────────────────────────────── */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-6 lg:self-start">
          <h3 className="text-xl font-bold">Letter Generator</h3>

          <div className="mt-4 grid gap-3">
            <label className="text-sm">
              <span className="mb-1 block font-semibold">Company</span>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={selectedMerchant}
                onChange={(e) => setSelectedMerchant(e.target.value)}
              >
                {safeItems.map((item) => (
                  <option key={item.merchantName} value={item.merchantName}>
                    {item.merchantName}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block font-semibold">Letter Type</span>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={letterType}
                onChange={(e) => setLetterType(e.target.value as LetterType)}
              >
                {LETTER_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <textarea
            className="mt-4 min-h-[420px] w-full rounded-xl border p-4 font-mono text-sm"
            value={generatedLetter}
            readOnly
          />

          <button
            id="generateLetter"
            className="generate-letter mt-4 w-full rounded-lg bg-black px-4 py-2 font-semibold text-white"
            onClick={copyLetter}
          >
            Copy Letter + Save to Proof Vault
          </button>

          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">
            <strong>Consumer Protection Notes:</strong>
            <p className="mt-2">
              Subscription cancellation and negative-option billing rules may vary by company,
              contract, payment method, and state. Keep copies of your cancellation request,
              confirmation numbers, and follow-up messages.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
