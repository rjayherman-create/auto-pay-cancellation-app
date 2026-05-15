import type { Express, Request, Response } from "express";

type PublicResource = {
  id: string;
  title: string;
  agency: string;
  description: string;
  url: string;
  category:
    | "bank-stop-payment"
    | "consumer-complaint"
    | "state-help"
    | "documentation"
    | "education";
};

const PUBLIC_RESOURCES: PublicResource[] = [
  {
    id: "cfpb-stop-automatic-payments",
    title: "How to stop automatic payments from a bank account",
    agency: "Consumer Financial Protection Bureau",
    description:
      "CFPB guidance explaining that consumers can contact the company, revoke permission, and contact their bank or credit union about stop-payment options.",
    url: "https://www.consumerfinance.gov/ask-cfpb/how-do-i-stop-automatic-payments-from-my-bank-account-en-2023/",
    category: "bank-stop-payment",
  },
  {
    id: "cfpb-reg-e-preauthorized-transfers",
    title: "Preauthorized electronic transfers - Regulation E",
    agency: "Consumer Financial Protection Bureau",
    description:
      "Federal regulation page about preauthorized electronic fund transfers, including stop-payment rights for certain automatic transfers.",
    url: "https://www.consumerfinance.gov/rules-policy/regulations/1005/10/",
    category: "education",
  },
  {
    id: "usa-state-consumer-offices",
    title: "Find your state consumer protection office",
    agency: "USA.gov",
    description:
      "Directory for state consumer protection offices that may help with complaints against businesses, scams, fraud, and consumer issues.",
    url: "https://www.usa.gov/state-consumer",
    category: "state-help",
  },
  {
    id: "usa-state-attorney-general",
    title: "Find your state attorney general",
    agency: "USA.gov",
    description:
      "Directory for state attorneys general, many of whom handle consumer protection complaints or direct consumers to the right complaint office.",
    url: "https://www.usa.gov/state-attorney-general",
    category: "state-help",
  },
  {
    id: "usa-company-complaints",
    title: "How to file a complaint about a company",
    agency: "USA.gov",
    description:
      "General public guidance on resolving complaints with a company and finding additional consumer-help options.",
    url: "https://www.usa.gov/company-product-service-complaints",
    category: "consumer-complaint",
  },
];

const PACKET_TEMPLATE = {
  appName: "AutoPay Cancel",
  title: "Consumer Cancellation & Continued Charge Packet",
  disclaimer:
    "AutoPay Cancel is an independent consumer documentation tool. It is not a law firm, does not provide legal advice, and is not affiliated with or endorsed by any government agency.",
  packetSections: [
    {
      id: "summary",
      title: "Consumer Summary",
      fields: [
        "Consumer name",
        "Merchant/company name",
        "Subscription or payment description",
        "Approximate signup date",
        "Payment method used",
        "Reason for cancellation or dispute",
      ],
    },
    {
      id: "cancellation-proof",
      title: "Cancellation Proof",
      fields: [
        "Cancellation date",
        "Cancellation method",
        "Email address or phone number contacted",
        "Confirmation number",
        "Screenshots or documents uploaded",
        "Names of representatives spoken to",
      ],
    },
    {
      id: "continued-charges",
      title: "Continued Charges After Cancellation",
      fields: [
        "Charge date",
        "Charge amount",
        "Bank/card used",
        "Statement screenshot",
        "Whether merchant was contacted again",
        "Refund requested amount",
      ],
    },
    {
      id: "letters",
      title: "Generated Letters",
      fields: [
        "Cancellation letter",
        "ACH authorization revocation letter",
        "Bank stop-payment request",
        "Refund request letter",
        "Continued charge dispute letter",
      ],
    },
    {
      id: "submission",
      title: "Where User May Send Packet",
      fields: [
        "Merchant customer service",
        "Bank or credit union",
        "Credit card issuer",
        "State consumer protection office",
        "State attorney general office",
        "Other consumer complaint office",
      ],
    },
  ],
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pageShell(title: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    :root {
      --bg: #f6f7fb;
      --card: #ffffff;
      --text: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --primary: #0f766e;
      --primary-dark: #115e59;
      --warning-bg: #fff7ed;
      --warning-border: #fed7aa;
      --warning-text: #9a3412;
      --blue-bg: #eff6ff;
      --blue-border: #bfdbfe;
      --blue-text: #1d4ed8;
      --shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 30%), var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      line-height: 1.5;
    }
    a { color: inherit; }
    .wrap { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
    .topbar { background: rgba(255, 255, 255, 0.82); backdrop-filter: blur(14px); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 20; }
    .topbar-inner { min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 900; text-decoration: none; font-size: 20px; }
    .logo { width: 38px; height: 38px; border-radius: 14px; background: linear-gradient(135deg, #0f766e, #14b8a6); color: white; display: grid; place-items: center; box-shadow: 0 10px 25px rgba(15, 118, 110, 0.22); font-weight: 900; }
    .nav { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .nav a { color: var(--muted); text-decoration: none; font-weight: 700; font-size: 14px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--border); background: white; color: var(--text); text-decoration: none; font-weight: 800; cursor: pointer; }
    .btn-primary { background: var(--primary); border-color: var(--primary); color: white; box-shadow: 0 14px 30px rgba(15, 118, 110, 0.22); }
    .btn-primary:hover { background: var(--primary-dark); }
    .hero { padding: 70px 0 34px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 28px; align-items: center; }
    .eyebrow { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; border-radius: 999px; background: var(--blue-bg); color: var(--blue-text); border: 1px solid var(--blue-border); font-weight: 900; font-size: 13px; margin-bottom: 18px; }
    h1 { font-size: clamp(38px, 6vw, 68px); line-height: 0.94; margin: 0 0 20px; }
    h2 { font-size: clamp(26px, 3vw, 38px); line-height: 1.05; margin: 0 0 12px; }
    h3 { margin: 0 0 8px; font-size: 18px; }
    .lead { color: var(--muted); font-size: 18px; max-width: 720px; margin: 0 0 24px; }
    .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 22px; }
    .notice { border-radius: 22px; padding: 18px; border: 1px solid var(--warning-border); background: var(--warning-bg); color: var(--warning-text); font-weight: 700; margin-top: 20px; }
    .preview-card { background: rgba(255,255,255,0.88); border: 1px solid var(--border); border-radius: 32px; padding: 22px; box-shadow: var(--shadow); }
    .preview-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 14px; }
    .pill { display: inline-flex; align-items: center; border-radius: 999px; padding: 6px 10px; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 12px; font-weight: 900; }
    .steps { display: grid; gap: 10px; }
    .step { display: grid; grid-template-columns: 34px 1fr; gap: 12px; padding: 14px; border-radius: 18px; border: 1px solid var(--border); background: white; }
    .num { width: 34px; height: 34px; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; font-weight: 900; }
    .muted { color: var(--muted); font-size: 14px; }
    .section { padding: 36px 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 20px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04); }
    .card p { color: var(--muted); margin: 0 0 14px; }
    .resource-card { display: flex; flex-direction: column; justify-content: space-between; min-height: 230px; }
    .resource-agency { color: var(--primary); font-weight: 900; font-size: 13px; margin-bottom: 6px; }
    .tag { display: inline-flex; width: fit-content; padding: 5px 9px; border-radius: 999px; background: #f3f4f6; color: #374151; font-size: 12px; font-weight: 800; margin-top: 10px; }
    .letter-list { display: grid; gap: 10px; margin-top: 16px; }
    .letter-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; background: #fafafa; border: 1px solid var(--border); border-radius: 16px; }
    .footer { margin-top: 50px; padding: 32px 0; border-top: 1px solid var(--border); color: var(--muted); font-size: 14px; }
    @media (max-width: 860px) {
      .hero, .grid, .grid-2 { grid-template-columns: 1fr; }
      .topbar-inner { align-items: flex-start; flex-direction: column; padding: 14px 0; }
      .nav { justify-content: flex-start; }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="wrap topbar-inner">
      <a class="brand" href="/"><span class="logo">A</span><span>AutoPay Cancel</span></a>
      <nav class="nav">
        <a href="/consumer-rights">Consumer Rights Center</a>
        <a href="/public-benefit">Public Benefit</a>
        <a class="btn btn-primary" href="/dashboard">Open Dashboard</a>
      </nav>
    </div>
  </header>
  ${body}
  <footer class="footer">
    <div class="wrap">
      <strong>Important:</strong> AutoPay Cancel is an independent consumer documentation tool.
      It is not a law firm, does not provide legal advice, and is not affiliated with or endorsed by
      any government agency, bank, payment network, or regulator.
    </div>
  </footer>
</body>
</html>`;
}

function publicBenefitPage() {
  const body = `
  <main class="wrap">
    <section class="hero">
      <div>
        <div class="eyebrow">Public Benefit Mode</div>
        <h1>Help residents fight unwanted recurring charges.</h1>
        <p class="lead">AutoPay Cancel helps consumers prepare organized cancellation letters, payment authorization revocation letters, stop-payment request packets, refund requests, and continued-charge dispute records.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="/dashboard?mode=public-benefit">Start Free Consumer Packet</a>
          <a class="btn" href="/consumer-rights">View Consumer Rights Center</a>
        </div>
        <div class="notice">This page is designed for libraries, senior centers, consumer groups, elected offices, and community organizations. It does not claim government approval or endorsement.</div>
      </div>
      <aside class="preview-card">
        <div class="preview-head"><h3>What the app prepares</h3><span class="pill">Documentation Tool</span></div>
        <div class="steps">
          ${renderStep(1, "Cancel or revoke authorization", "Creates a clear written record for the merchant or payment source.")}
          ${renderStep(2, "Stop-payment packet", "Helps the user organize what to send or say to the bank or card issuer.")}
          ${renderStep(3, "Continued charge dispute", "Builds a timeline and evidence summary if charges continue after cancellation.")}
          ${renderStep(4, "Complaint-ready export", "Creates a clean packet the consumer can use with a company, bank, or consumer office.")}
        </div>
      </aside>
    </section>

    <section class="section">
      <h2>Why public offices and community groups may care</h2>
      <p class="lead">People often do not know how to document cancellation attempts, revoke automatic payment permission, organize screenshots, or explain continued charges. This app gives them a simple, structured workflow.</p>
      <div class="grid">
        ${renderCard("Free public resource layer", "Consumers can access education, official links, and basic letter preparation without needing to understand legal language.", "Community friendly")}
        ${renderCard("Clear independent disclaimer", "The app avoids false endorsement claims and clearly states that it is not a government agency or law firm.", "Trust safer")}
        ${renderCard("Complaint-ready records", "The app helps consumers create cleaner timelines, proof summaries, and packet exports before escalating the issue.", "Better documentation")}
      </div>
    </section>

    <section class="section">
      <h2>Free public-benefit documents</h2>
      <p class="lead">These are the core documents that make the app useful for consumer protection outreach.</p>
      <div class="card"><div class="letter-list">
        ${renderLetterRow("Subscription cancellation letter", "/dashboard?letter=cancellation")}
        ${renderLetterRow("ACH authorization revocation letter", "/dashboard?letter=ach-revocation")}
        ${renderLetterRow("Bank stop-payment request", "/dashboard?letter=stop-payment")}
        ${renderLetterRow("Continued charge dispute letter", "/dashboard?letter=continued-charge-dispute")}
        ${renderLetterRow("Refund request letter", "/dashboard?letter=refund-request")}
      </div></div>
    </section>

    <section class="section">
      <h2>Safe language for partners</h2>
      <div class="grid-2">
        <div class="card"><h3>Use this wording</h3><p>"AutoPay Cancel is an independent consumer documentation tool that helps residents organize cancellation, stop-payment, refund, and continued-charge dispute records."</p></div>
        <div class="card"><h3>Avoid this wording</h3><p>Do not say "government approved," "FTC backed," "CFPB certified," "state endorsed," or anything similar unless you have written approval from that agency.</p></div>
      </div>
    </section>
  </main>`;

  return pageShell("Public Benefit | AutoPay Cancel", body);
}

function consumerRightsPage() {
  const resourceCards = PUBLIC_RESOURCES.map((resource) => `
    <article class="card resource-card">
      <div>
        <div class="resource-agency">${escapeHtml(resource.agency)}</div>
        <h3>${escapeHtml(resource.title)}</h3>
        <p>${escapeHtml(resource.description)}</p>
      </div>
      <div>
        <span class="tag">${escapeHtml(resource.category)}</span>
        <div style="margin-top:14px;">
          <a class="btn" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">Open official resource</a>
        </div>
      </div>
    </article>
  `).join("");

  const body = `
  <main class="wrap">
    <section class="hero">
      <div>
        <div class="eyebrow">Consumer Rights Center</div>
        <h1>Official resources + simple next steps.</h1>
        <p class="lead">Use this page to help customers understand where to find public consumer-protection resources, how to organize their documentation, and what packet to prepare.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="/dashboard?mode=consumer-rights">Build My Packet</a>
          <a class="btn" href="/public-benefit">For Community Partners</a>
        </div>
        <div class="notice">This page links to public resources. It does not replace advice from a lawyer, bank, government agency, or consumer protection office.</div>
      </div>
      <aside class="preview-card">
        <div class="preview-head"><h3>Best consumer workflow</h3><span class="pill">Simple process</span></div>
        <div class="steps">
          ${renderStep(1, "Cancel with the company", "Save confirmation numbers, screenshots, emails, and chat logs.")}
          ${renderStep(2, "Revoke payment authorization", "Create a written record that permission to debit has been withdrawn.")}
          ${renderStep(3, "Contact bank or card issuer", "Ask about stop-payment, charge dispute, or card replacement options.")}
          ${renderStep(4, "Escalate if needed", "Use state consumer offices or complaint resources when the issue is not resolved.")}
        </div>
      </aside>
    </section>

    <section class="section">
      <h2>Official consumer-help links</h2>
      <p class="lead">These links help users find government or public consumer-protection resources without your app claiming endorsement.</p>
      <div class="grid">${resourceCards}</div>
    </section>

    <section class="section">
      <h2>What AutoPay Cancel prepares</h2>
      <div class="grid">
        ${renderCard("Merchant letter", "Cancel subscription, request confirmation, and create a written record.")}
        ${renderCard("Payment revocation letter", "Tell the company that authorization for future automatic payments is withdrawn.")}
        ${renderCard("Bank packet", "Organize merchant name, charge dates, amounts, screenshots, and user explanation.")}
        ${renderCard("Refund request", "Ask for money back when a charge occurred after cancellation or was not intended.")}
        ${renderCard("Continued charge dispute", "Build a timeline showing cancellation date, follow-up attempts, and later charges.")}
        ${renderCard("Complaint-ready export", "Prepare a clean summary packet for consumer offices, banks, card issuers, or the merchant.")}
      </div>
    </section>
  </main>`;

  return pageShell("Consumer Rights Center | AutoPay Cancel", body);
}

function renderStep(num: number, title: string, description: string) {
  return `<div class="step"><div class="num">${num}</div><div><strong>${escapeHtml(title)}</strong><div class="muted">${escapeHtml(description)}</div></div></div>`;
}

function renderCard(title: string, description: string, tag?: string) {
  return `<div class="card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>${tag ? `<span class="tag">${escapeHtml(tag)}</span>` : ""}</div>`;
}

function renderLetterRow(title: string, href: string) {
  return `<div class="letter-row"><strong>${escapeHtml(title)}</strong><a class="btn" href="${escapeHtml(href)}">Create</a></div>`;
}

export function registerPublicBenefitCenter(app: Express) {
  app.get("/public-benefit", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(publicBenefitPage());
  });

  app.get("/consumer-rights", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(consumerRightsPage());
  });

  app.get("/api/public-benefit/resources", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      disclaimer:
        "AutoPay Cancel is independent and is not affiliated with or endorsed by any government agency.",
      resources: PUBLIC_RESOURCES,
    });
  });

  app.get("/api/public-benefit/packet-template", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      template: PACKET_TEMPLATE,
    });
  });

  app.post("/api/public-benefit/packet-preview", (req: Request, res: Response) => {
    const body = req.body || {};

    const packet = {
      createdAt: new Date().toISOString(),
      appName: "AutoPay Cancel",
      disclaimer:
        "This packet is user-prepared documentation. AutoPay Cancel is not a law firm and is not government affiliated.",
      consumer: {
        name: String(body.consumerName || "").trim(),
        email: String(body.consumerEmail || "").trim(),
        phone: String(body.consumerPhone || "").trim(),
      },
      merchant: {
        name: String(body.merchantName || "").trim(),
        website: String(body.merchantWebsite || "").trim(),
        customerServiceEmail: String(body.customerServiceEmail || "").trim(),
        customerServicePhone: String(body.customerServicePhone || "").trim(),
      },
      payment: {
        method: String(body.paymentMethod || "").trim(),
        lastFour: String(body.lastFour || "").trim(),
        recurringAmount: String(body.recurringAmount || "").trim(),
        chargeDates: Array.isArray(body.chargeDates) ? body.chargeDates : [],
      },
      cancellation: {
        cancellationDate: String(body.cancellationDate || "").trim(),
        cancellationMethod: String(body.cancellationMethod || "").trim(),
        confirmationNumber: String(body.confirmationNumber || "").trim(),
        notes: String(body.notes || "").trim(),
      },
      requestedOutcome: {
        stopFutureCharges: Boolean(body.stopFutureCharges ?? true),
        refundRequested: Boolean(body.refundRequested ?? false),
        refundAmount: String(body.refundAmount || "").trim(),
        disputeContinuedCharges: Boolean(body.disputeContinuedCharges ?? false),
      },
      nextRecommendedDocuments: [
        "Cancellation confirmation letter",
        "Payment authorization revocation letter",
        "Bank/card stop-payment or dispute request",
        "Refund request letter",
        "Continued charge dispute timeline",
      ],
    };

    res.json({ ok: true, packet });
  });
}
