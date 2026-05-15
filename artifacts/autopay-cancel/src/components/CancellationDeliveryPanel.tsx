import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, CheckCircle2, FileUp, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

type MerchantDelivery = {
  merchant_name: string;
  category?: string | null;
  cancellation_email?: string | null;
  cancellation_address?: string | null;
  cancellation_phone?: string | null;
  cancellation_url?: string | null;
  accepts_email: boolean;
  accepts_mail: boolean;
  accepts_portal: boolean;
  accepts_hand_delivery: boolean;
  recommended_method: string;
  secure_message_steps?: string | null;
  proof_tips?: string | null;
  source: "directory" | "fallback";
};

type ProofFile = {
  name: string;
  size: number;
};

const strengthRows = [
  { method: "Certified Mail", strength: "VERY STRONG", className: "text-emerald-700" },
  { method: "Secure Bank Portal", strength: "STRONG", className: "text-blue-700" },
  { method: "Email", strength: "MEDIUM", className: "text-amber-700" },
  { method: "Phone Call Only", strength: "WEAK", className: "text-red-700" },
];

const proofItems = [
  "Generated cancellation letter saved",
  "Certified mail receipt saved",
  "Email screenshots saved",
  "Tracking number saved",
  "Portal confirmation saved",
  "Branch receipt uploaded",
];

export default function CancellationDeliveryPanel({
  merchantName,
}: {
  merchantName: string;
}) {
  const [merchant, setMerchant] = useState<MerchantDelivery | null>(null);
  const [proofFiles, setProofFiles] = useState<ProofFile[]>([]);
  const encodedMerchant = useMemo(() => encodeURIComponent(merchantName.trim()), [merchantName]);

  useEffect(() => {
    if (!merchantName.trim()) return;
    setMerchant(null);
    fetch(`${API_BASE}/api/merchant-directory/${encodedMerchant}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setMerchant)
      .catch((error) => {
        console.error(error);
        setMerchant(null);
      });
  }, [encodedMerchant, merchantName]);

  if (!merchantName.trim()) return null;

  if (!merchant) {
    return (
      <Card className="mt-6 rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Delivery Instructions</CardTitle>
          <CardDescription>Loading delivery guidance...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-6 rounded-2xl border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl">Send Your Cancellation Request</CardTitle>
            <CardDescription className="mt-1">
              Your letter has been generated. Use these delivery steps to create stronger proof.
            </CardDescription>
          </div>
          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
            {merchant.recommended_method.replace(/_/g, " ")}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {merchant.accepts_mail && (
            <DeliveryMethod
              icon={<Mail className="h-5 w-5" />}
              title="Mailing Address"
              value={merchant.cancellation_address || "Verify mailing address directly with the merchant before sending."}
              note="Recommended: certified mail with tracking."
            />
          )}

          {merchant.accepts_email && (
            <DeliveryMethod
              icon={<Mail className="h-5 w-5" />}
              title="Email Delivery"
              value={merchant.cancellation_email || "Verify the correct cancellation email directly with the merchant."}
              note="Save sent-email confirmation screenshots."
            />
          )}

          {merchant.accepts_portal && (
            <DeliveryMethod
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Secure Message Portal"
              value={merchant.secure_message_steps || "Use the merchant account portal or support message center."}
              note={merchant.cancellation_url ? `Portal: ${merchant.cancellation_url}` : "Screenshot every confirmation page."}
            />
          )}

          {merchant.accepts_hand_delivery && (
            <DeliveryMethod
              icon={<Building2 className="h-5 w-5" />}
              title="Hand Delivery"
              value="Bring a printed signed copy, request a timestamped receipt, ask for employee name, and request manager acknowledgment when possible."
              note="Upload the branch receipt below."
            />
          )}

          {merchant.cancellation_phone && (
            <DeliveryMethod
              icon={<Phone className="h-5 w-5" />}
              title="Phone Support"
              value={merchant.cancellation_phone}
              note="Phone alone is weaker. Ask for a confirmation number and written follow-up."
            />
          )}

          {merchant.cancellation_url && (
            <DeliveryMethod
              icon={<MapPin className="h-5 w-5" />}
              title="Cancellation URL"
              value={merchant.cancellation_url}
              note="Save screenshots before and after submission."
            />
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Delivery Strength</h3>
          <div className="space-y-2 text-sm">
            {strengthRows.map((row) => (
              <div key={row.method} className="flex justify-between gap-4">
                <span className="text-slate-600">{row.method}</span>
                <span className={`font-bold ${row.className}`}>{row.strength}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Proof Checklist</h3>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {proofItems.map((item) => (
              <label key={item} className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <FileUp className="h-4 w-4" /> Proof Upload Vault
          </label>
          <Input
            type="file"
            multiple
            onChange={(event) => {
              setProofFiles(
                Array.from(event.target.files || []).map((file) => ({
                  name: file.name,
                  size: file.size,
                }))
              );
            }}
          />
          <p className="mt-2 text-xs text-slate-500">
            Upload receipts, screenshots, tracking pages, branch receipts, or merchant confirmations.
          </p>
          {proofFiles.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {proofFiles.map((file) => (
                <li key={`${file.name}-${file.size}`}>{file.name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-700" />
            <h3 className="text-lg font-bold text-red-950">Still Being Charged?</h3>
          </div>
          <p className="mb-3 text-sm text-red-900">
            If charges continue after cancellation, move to an escalation workflow.
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Link href="/disputes" className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-800 hover:bg-red-50">
              Generate bank stop-payment request
            </Link>
            <Link href="/continued-charges" className="rounded-lg border border-red-200 bg-white px-3 py-2 font-medium text-red-800 hover:bg-red-50">
              Build continued-charge evidence packet
            </Link>
          </div>
        </div>

        <div className="border-t pt-4 text-xs text-slate-500">
          {merchant.proof_tips || "Delivery information is provided as a convenience and may change. Verify addresses, procedures, and cancellation requirements directly with the merchant or bank before sending notices."}
        </div>
      </CardContent>
    </Card>
  );
}

function DeliveryMethod({
  icon,
  title,
  value,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-2 flex items-center gap-2 font-bold text-slate-900">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="whitespace-pre-wrap break-words text-sm text-slate-700">{value}</p>
      <div className="mt-3 text-sm font-medium text-blue-700">{note}</div>
    </div>
  );
}
