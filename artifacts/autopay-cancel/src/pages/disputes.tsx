import { useEffect, useState } from "react";
import { Layout } from "@/components/layout";
import { DisputeStatusTracker } from "@/components/DisputeStatusTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Copy, FileText, ShieldAlert, Upload } from "lucide-react";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const statusOptions = [
  "draft",
  "generated",
  "sent_to_merchant",
  "sent_to_bank",
  "waiting",
  "resolved",
  "still_charging",
] as const;

type DisputeItem = {
  id: number;
  merchantName: string;
  bankName: string;
  paymentType: "ACH" | "CARD";
  accountLast4?: string | null;
  lastChargeAmount?: string | null;
  lastChargeDate?: string | null;
  cancellationDate?: string | null;
  disputeReason?: string | null;
  status: (typeof statusOptions)[number];
  evidenceFiles?: unknown;
  generatedLetter?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function DisputesPage() {
  const [form, setForm] = useState({
    merchantName: "",
    bankName: "",
    paymentType: "ACH",
    accountLast4: "",
    lastChargeAmount: "",
    lastChargeDate: "",
    cancellationDate: "",
    disputeReason: "",
  });
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [generatedLetter, setGeneratedLetter] = useState("");
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [nextStatus, setNextStatus] = useState<(typeof statusOptions)[number]>("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const loadDisputes = async () => {
    const res = await fetch(`${API_BASE}/api/disputes`, { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as DisputeItem[];
    setDisputes(data);
    if (!selectedDispute && data.length) {
      setSelectedDispute(data[0]);
      setNextStatus(data[0].status);
      setGeneratedLetter(data[0].generatedLetter || "");
    }
  };

  useEffect(() => {
    void loadDisputes();
  }, []);

  const generateLetter = async () => {
    setIsGenerating(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/api/disputes/generate-letter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          disputeId: selectedDispute?.id,
        }),
      });

      const data = await res.json();
      setGeneratedLetter(data.letter || "");
      setMessage(data.letter ? "Letter generated." : "Could not generate letter.");
    } finally {
      setIsGenerating(false);
    }
  };

  const createDispute = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const evidenceMeta = evidenceFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified,
      }));

      const res = await fetch(`${API_BASE}/api/disputes/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          evidenceFiles: evidenceMeta,
          generatedLetter,
          status: generatedLetter ? "generated" : "draft",
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.data) {
        setMessage(payload?.error || "Failed to create dispute");
        return;
      }

      setSelectedDispute(payload.data as DisputeItem);
      setNextStatus(payload.data.status);
      await loadDisputes();
      setMessage("Dispute created.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!selectedDispute) return;
    const res = await fetch(`${API_BASE}/api/disputes/${selectedDispute.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!res.ok) {
      setMessage("Failed to update status");
      return;
    }

    const data = (await res.json()) as DisputeItem;
    setSelectedDispute(data);
    await loadDisputes();
    setMessage("Status updated.");
  };

  const copyLetter = async () => {
    if (!generatedLetter) return;
    await navigator.clipboard.writeText(generatedLetter);
    setMessage("Letter copied.");
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bank Stop Payments</h1>
        <p className="mt-2 text-muted-foreground">Create ACH stop requests, recurring card disputes, and revocation letters.</p>
      </div>

      {message && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Dispute Request</CardTitle>
              <CardDescription>Capture bank and merchant details for your stop payment file.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Merchant Name" value={form.merchantName} onChange={(e) => updateField("merchantName", e.target.value)} />
              <Input placeholder="Bank Name" value={form.bankName} onChange={(e) => updateField("bankName", e.target.value)} />

              <Select value={form.paymentType} onValueChange={(v) => updateField("paymentType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACH">ACH</SelectItem>
                  <SelectItem value="CARD">CARD</SelectItem>
                </SelectContent>
              </Select>

              <Input placeholder="Account Last 4" maxLength={4} value={form.accountLast4} onChange={(e) => updateField("accountLast4", e.target.value.replace(/\D/g, ""))} />
              <Input placeholder="Last Charge Amount" value={form.lastChargeAmount} onChange={(e) => updateField("lastChargeAmount", e.target.value)} />
              <Input type="date" value={form.lastChargeDate} onChange={(e) => updateField("lastChargeDate", e.target.value)} />
              <Input type="date" value={form.cancellationDate} onChange={(e) => updateField("cancellationDate", e.target.value)} />
              <Textarea placeholder="Reason for dispute" value={form.disputeReason} onChange={(e) => updateField("disputeReason", e.target.value)} />

              <div className="rounded-xl border border-dashed border-slate-300 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Upload className="h-4 w-4" /> Evidence Upload Vault
                </label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
                />
                {evidenceFiles.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {evidenceFiles.map((f) => (
                      <li key={`${f.name}-${f.lastModified}`}>{f.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button onClick={generateLetter} disabled={isGenerating || !form.merchantName || !form.bankName}>
                  <FileText className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate Letter"}
                </Button>
                <Button onClick={createDispute} disabled={isSaving || !form.merchantName || !form.bankName} variant="secondary">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Create Dispute"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedDispute && (
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle>Continued Charge Workflow</CardTitle>
                <CardDescription>Escalate disputes when the merchant continues charging.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DisputeStatusTracker currentStatus={selectedDispute.status} />
                <div className="flex gap-2">
                  <Select value={nextStatus} onValueChange={(v) => setNextStatus(v as (typeof statusOptions)[number])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={updateStatus}>Save</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-7">
          <Card className="min-h-[320px] rounded-2xl border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Generated Letter</CardTitle>
                <CardDescription>PDF generation and Stripe-compatible hooks can consume this output.</CardDescription>
              </div>
              <Button variant="outline" onClick={copyLetter} disabled={!generatedLetter}>
                <Copy className="mr-2 h-4 w-4" />Copy
              </Button>
            </CardHeader>
            <CardContent>
              {generatedLetter ? (
                <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{generatedLetter}</pre>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  Generate a letter to preview it here.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Bank Escalation Dashboard</CardTitle>
              <CardDescription>Recent disputes and current status</CardDescription>
            </CardHeader>
            <CardContent>
              {!disputes.length ? (
                <p className="text-sm text-slate-500">No disputes yet.</p>
              ) : (
                <div className="space-y-2">
                  {disputes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedDispute(item);
                        setGeneratedLetter(item.generatedLetter || "");
                        setNextStatus(item.status);
                      }}
                      className="w-full rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{item.merchantName}</div>
                          <div className="text-xs text-slate-500">{item.bankName} • {item.paymentType}</div>
                        </div>
                        <div className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">
                          {item.status.replace(/_/g, " ")}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-slate-500">
            Legal Disclaimer: This tool provides templates and workflow support only and is not legal advice.
          </p>
        </div>
      </div>
    </Layout>
  );
}
