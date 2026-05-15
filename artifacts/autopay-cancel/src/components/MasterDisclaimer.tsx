import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const disclaimerItems = [
  "This app is a self-help document generation tool only. It does not cancel subscriptions, memberships, ACH payments, card payments, or bank payments for you.",
  "AutoPay Cancel is not a law firm, bank, financial institution, debt relief company, credit repair organization, payment processor, or government agency.",
  "The app does not provide legal, financial, banking, credit, tax, or professional advice, and no attorney-client relationship is created.",
  "We do not guarantee cancellation, refunds, chargebacks, payment reversals, stop-payment approval, dispute approval, account closure, merchant response, or any specific outcome.",
  "You are responsible for reviewing all generated documents, confirming all facts, meeting deadlines, and sending or submitting documents to the correct merchant, bank, card issuer, or consumer office.",
  "If financial account connection features are offered through Plaid or another provider, we do not store your bank login credentials, initiate payments, move money, control your bank account, or contact your bank on your behalf unless a separate service clearly says otherwise.",
  "Continued charge detection, OCR, timelines, evidence summaries, merchant directories, and suggested delivery instructions are organizational tools only. You should verify all results, addresses, procedures, and requirements directly with the merchant or financial institution.",
  "Some subscriptions, memberships, services, or payment plans may involve contracts, minimum commitments, cancellation windows, notice requirements, early termination fees, or other obligations. The app does not review contracts for enforceability.",
  "Fees paid to use the app are for access to software tools, templates, document generation, workflow features, and related digital services. Payment does not guarantee cancellation, refund, dispute success, bank approval, or merchant response.",
  "Do not rely on this app for urgent, emergency, or deadline-sensitive matters. You are responsible for acting before any applicable deadline and contacting the proper party directly.",
];

export function MasterDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50 text-amber-950",
        compact ? "p-4 text-xs" : "p-5 text-sm"
      )}
      aria-label="Important legal disclaimer"
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0 space-y-2">
          <div className="font-bold">Important Legal Disclaimer</div>
          <p className="leading-relaxed">
            AutoPay Cancel is an independent self-help document generation tool.
            We are not a law firm, bank, financial institution, payment processor,
            or government agency, and we do not provide legal, financial, banking,
            credit, tax, or professional advice.
          </p>
          <details className="group">
            <summary className="cursor-pointer font-semibold text-amber-900 underline underline-offset-2">
              View full disclaimer and user responsibilities
            </summary>
            <div className="mt-3 space-y-2 leading-relaxed">
              <p className="font-medium">Last Updated: May 15, 2026</p>
              <ul className="list-disc space-y-2 pl-5">
                {disclaimerItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                By using this app, creating a document, connecting a financial
                account, purchasing access, or continuing to use the service, you
                acknowledge that you are responsible for the accuracy of your
                information, your communications with third parties, your
                generated documents, and your follow-up.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
