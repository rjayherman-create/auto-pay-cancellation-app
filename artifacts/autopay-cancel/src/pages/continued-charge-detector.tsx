import { useState } from "react";
import { AlertTriangle, Copy, Download, FileSearch, Upload } from "lucide-react";
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Continued Charge Detector</h1>
        <p className="mt-2 text-muted-foreground">
          Upload statement evidence, detect charges after cancellation, and generate a dispute packet.
        </p>
      </div>

      {message && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Upload Evidence</CardTitle>
              <CardDescription>Use bank statements, card screenshots, cancellation emails, or confirmations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="rounded-xl border border-dashed border-slate-300 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Upload className="h-4 w-4" /> Evidence Upload Vault
                </label>
                <Input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={(event) => setFiles(Array.from(event.target.files || []))}
                />
                <p className="mt-2 text-xs text-slate-500">
                  OCR extraction is prepared as a backend hook; this version stores file metadata and runs statement-pattern detection.
                </p>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {files.map((file) => (
                      <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                onClick={analyzeCharges}
                disabled={isAnalyzing || !merchantName.trim()}
                className="w-full"
              >
                <FileSearch className="mr-2 h-4 w-4" />
                {isAnalyzing ? "Analyzing..." : "Analyze Charges"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Generated Dispute Packet</CardTitle>
              <CardDescription>Bank dispute packet and merchant dispute letter source text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={disputePacket}
                readOnly
                placeholder="Analyze evidence to generate a dispute packet."
                className="min-h-[280px] font-mono text-xs"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={copyPacket} disabled={!disputePacket}>
                  <Copy className="mr-2 h-4 w-4" />Copy Packet
                </Button>
                <Button onClick={exportPacketPdf} disabled={!disputePacket}>
                  <Download className="mr-2 h-4 w-4" />Export PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>AI Detection Results</CardTitle>
              <CardDescription>Charges detected after the reported cancellation date.</CardDescription>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                  No analysis yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.continuedCharges.map((charge, index) => (
                    <div key={`${charge.date}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{charge.merchant}</div>
                          <div className="text-xs text-slate-500">{charge.date}</div>
                          {charge.source && <div className="text-xs text-slate-500">Source: {charge.source}</div>}
                        </div>
                        <div className="text-lg font-bold text-slate-900">{charge.amount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Cancellation request and post-cancellation charges.</CardDescription>
            </CardHeader>
            <CardContent>
              {!analysis ? (
                <p className="text-sm text-slate-500">Timeline will appear after analysis.</p>
              ) : (
                <div className="space-y-4">
                  {analysis.timeline.map((item, index) => (
                    <div key={`${item.date}-${index}`} className="flex gap-4">
                      <div className="mt-2 h-3 w-3 rounded-full bg-slate-900" />
                      <div>
                        <div className="font-medium text-slate-900">{item.type}</div>
                        <div className="text-sm text-slate-500">{item.date}</div>
                        {item.amount && <div className="text-sm font-medium text-slate-700">{item.amount}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Evidence Summary</CardTitle>
              <CardDescription>Summary for bank escalation and merchant follow-up.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="min-h-[180px] whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {analysis?.evidenceSummary || "Evidence summary will appear here."}
              </pre>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-500">
            Legal Disclaimer: This tool assists users in organizing financial records and generating self-help dispute documents. We are not a law firm, bank, or financial advisor.
          </p>
        </div>
      </div>
    </Layout>
  );
}
