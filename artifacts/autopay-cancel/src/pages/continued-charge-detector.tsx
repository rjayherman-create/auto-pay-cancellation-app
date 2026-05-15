import { useState } from "react";
import { AlertTriangle, Copy, Download, FileSearch } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateDisputePacket } from "@/lib/generateDisputePacket";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type ContinuedCharge = {
  merchant: string;
  amount: string;
  date: string;
  source?: string;
};

type TimelineItem = {
  type: string;
  date: string;
  amount?: string;
  merchant?: string;
};

type AnalysisResult = {
  success: boolean;
  continuedCharges: ContinuedCharge[];
  timeline: TimelineItem[];
  evidenceSummary: string;
  disputePacket: string;
};

export default function ContinuedChargeDetector() {
  const [files, setFiles] = useState<File[]>([]);
  const [merchantName, setMerchantName] = useState("");
  const [cancellationDate, setCancellationDate] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  const disputePacket =
    analysis?.disputePacket ||
    (analysis
      ? generateDisputePacket({
          merchantName,
          timeline: analysis.timeline,
          evidenceSummary: analysis.evidenceSummary,
        })
      : "");

  const analyzeCharges = async () => {
    setIsAnalyzing(true);
    setMessage("");
    try {
      const fileMeta = files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      }));

      const res = await fetch(`${API_BASE}/api/continued-charges/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          merchantName,
          cancellationDate,
          files: fileMeta,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage(data?.error || "Failed to analyze uploaded evidence.");
        return;
      }

      setAnalysis(data as AnalysisResult);
      setMessage("Analysis complete.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyPacket = async () => {
    if (!disputePacket) return;
    await navigator.clipboard.writeText(disputePacket);
    setMessage("Dispute packet copied.");
  };

  const exportPacketPdf = () => {
    if (!disputePacket) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=840,height=960");
    if (!printWindow) {
      setMessage("Popup blocked. Allow popups to export the packet.");
      return;
    }

    const escapedPacket = disputePacket
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <title>Continued Charge Dispute Packet</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 48px; line-height: 1.5; }
    h1 { font-size: 20px; margin: 0 0 24px; }
    pre { white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px; }
    .disclaimer { border-top: 1px solid #cbd5e1; color: #64748b; font-size: 11px; margin-top: 40px; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>Continued Charge Dispute Packet</h1>
  <pre>${escapedPacket}</pre>
  <div class="disclaimer">This tool assists users in organizing financial records and generating self-help dispute documents. We are not a law firm, bank, or financial advisor.</div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`);
    printWindow.document.close();
  };

  return (
    <Layout>
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Next step: upload statement
        </p>
        <h1 className="page-title gradient-text">Continued Charge Detection</h1>
        <p className="mt-3 text-slate-300">
          Identify recurring charges that continued after cancellation.
        </p>
      </div>

      {message && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      <Card className="app-card">
        <CardContent className="space-y-8 p-8">
          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Step 1 - Upload Statement</h2>
            <p className="mb-5 text-sm text-slate-400">
              Add the merchant, cancellation date, and statement evidence so the detector can compare charge dates.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="merchantName">Merchant Name</Label>
                <Input
                  id="merchantName"
                  placeholder="Planet Fitness"
                  value={merchantName}
                  onChange={(event) => setMerchantName(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellationDate">Cancellation Date</Label>
                <Input
                  id="cancellationDate"
                  type="date"
                  value={cancellationDate}
                  onChange={(event) => setCancellationDate(event.target.value)}
                />
              </div>
            </div>

              <div className="mt-5 rounded-xl border border-dashed border-cyan-300/25 bg-white/5 p-5">
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(event) => setFiles(Array.from(event.target.files || []))}
                />
                <p className="mt-2 text-xs text-slate-400">
                  OCR extraction is prepared as a backend hook; this version stores file metadata and runs statement-pattern detection.
                </p>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-300">
                    {files.map((file) => (
                      <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                onClick={analyzeCharges}
                disabled={isAnalyzing || !merchantName.trim()}
                className="btn-primary mt-5"
              >
                <FileSearch className="mr-2 h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Analyze Charges"}
              </Button>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Step 2 - Review Charges</h2>
            <p className="mb-5 text-sm text-slate-400">
              AI-assisted recurring charge analysis will appear here.
            </p>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="mb-3 font-semibold text-white">Detected Continued Charges</h3>
              {!analysis ? (
                <div className="rounded-xl border border-dashed border-white/10 p-10 text-center text-slate-400">
                  No analysis yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.continuedCharges.map((charge, index) => (
                    <div key={`${charge.date}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{charge.merchant}</div>
                          <div className="text-xs text-slate-400">{charge.date}</div>
                          {charge.source && <div className="text-xs text-slate-400">Source: {charge.source}</div>}
                        </div>
                        <div className="text-lg font-bold text-white">{charge.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                <h3 className="mb-3 font-semibold text-white">Timeline</h3>
              {!analysis ? (
                <p className="text-sm text-slate-400">Timeline will appear after analysis.</p>
              ) : (
                <div className="space-y-4">
                  {analysis.timeline.map((item, index) => (
                    <div key={`${item.date}-${index}`} className="flex gap-4">
                      <div className="mt-2 h-3 w-3 rounded-full bg-cyan-300" />
                      <div>
                        <div className="font-medium text-white">{item.type}</div>
                        <div className="text-sm text-slate-400">{item.date}</div>
                        {item.amount && <div className="text-sm font-medium text-slate-300">{item.amount}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
              <h3 className="mb-3 font-semibold text-white">Evidence Summary</h3>
              <pre className="min-h-[180px] whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                {analysis?.evidenceSummary || "Evidence summary will appear here."}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-bold text-white">Step 3 - Generate Dispute Packet</h2>
            <p className="mb-5 text-sm text-slate-400">
              Create a packet source document you can copy or export for bank and merchant follow-up.
            </p>
            <Textarea
              value={disputePacket}
              readOnly
              placeholder="Analyze evidence to generate a dispute packet."
              className="min-h-[240px] font-mono text-xs"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button className="bg-red-500 text-white hover:bg-red-400" onClick={exportPacketPdf} disabled={!disputePacket}>
                <Download className="mr-2 h-4 w-4" />Generate Dispute Documents
              </Button>
              <Button variant="outline" onClick={copyPacket} disabled={!disputePacket}>
                <Copy className="mr-2 h-4 w-4" />Copy Packet
              </Button>
            </div>
          </section>

          <p className="text-xs text-slate-400">
            Legal Disclaimer: This tool assists users in organizing financial records and generating self-help dispute documents. We are not a law firm, bank, or financial advisor.
          </p>
        </CardContent>
      </Card>
    </Layout>
  );
}
