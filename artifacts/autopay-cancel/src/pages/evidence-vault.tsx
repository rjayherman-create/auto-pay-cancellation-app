import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileArchive, FileText, Image, Mail, Receipt, UploadCloud } from "lucide-react";

type EvidenceFile = {
  name: string;
  size: number;
  type: string;
  addedAt: Date;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getEvidenceIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf")) return FileText;
  if (type.includes("message") || type.includes("email")) return Mail;
  return Receipt;
}

export default function EvidenceVaultPage() {
  const [files, setFiles] = useState<EvidenceFile[]>([]);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const nextFiles = Array.from(fileList).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      addedAt: new Date(),
    }));
    setFiles((current) => [...nextFiles, ...current]);
  };

  return (
    <Layout>
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Next step: upload proof
        </p>
        <h1 className="page-title gradient-text">Evidence Vault</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Store proof of cancellations, disputes, and communications.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="app-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload Proof
            </CardTitle>
            <CardDescription>
              Add files that support cancellation, ACH revocation, stop-payment, refund, or continued-charge disputes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-300/25 bg-white/5 px-6 py-10 text-center transition-colors hover:border-cyan-300/60 hover:bg-cyan-400/10">
              <UploadCloud className="mb-4 h-10 w-10 text-cyan-300" />
              <span className="text-2xl font-bold text-white">Upload Proof & Documentation</span>
              <span className="mt-2 max-w-md text-sm text-slate-400">
                Save screenshots, cancellation confirmations, bank statements, and generated letters.
              </span>
              <span className="btn-primary mt-6 px-6 py-3">
                Upload Files
              </span>
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={(event) => handleFiles(event.target.files)}
              />
            </label>

            <div className="mt-6 space-y-3">
              {files.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-400">
                  No evidence uploaded in this session yet.
                </div>
              ) : (
                files.map((file, index) => {
                  const Icon = getEvidenceIcon(file.type);
                  return (
                    <div
                      key={`${file.name}-${file.addedAt.toISOString()}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-white">{file.name}</div>
                          <div className="text-xs text-slate-400">
                            {formatBytes(file.size)} · Added {file.addedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Ready</Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="app-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileArchive className="h-5 w-5 text-primary" />
                Vault Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-slate-400">Files</div>
                  <div className="mt-1 text-2xl font-bold text-white">{files.length}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-slate-400">Total Size</div>
                  <div className="mt-1 text-2xl font-bold text-white">{formatBytes(totalSize)}</div>
                </div>
              </div>
              <Button className="w-full" disabled={files.length === 0}>
                Attach to Dispute Packet
              </Button>
            </CardContent>
          </Card>

          <Card className="app-card">
            <CardHeader>
              <CardTitle className="text-lg">Generate Letters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300">
                Create cancellation, ACH revocation, and stop-payment letters, then save the generated output as proof.
              </p>
              <Link
                href="/letter-generator"
                className="btn-primary inline-flex w-full items-center justify-center px-4 py-3 text-sm font-semibold"
              >
                Open Letter Generator
              </Link>
            </CardContent>
          </Card>

          <Card className="app-card">
            <CardHeader>
              <CardTitle className="text-lg">Recommended Evidence</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Cancellation confirmation emails or screenshots</li>
                <li>Bank or card statement screenshots showing charges</li>
                <li>Merchant chat logs, ticket numbers, or emails</li>
                <li>Certified mail receipts and tracking confirmations</li>
                <li>Names of representatives and call dates</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
