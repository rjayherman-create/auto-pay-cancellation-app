import {
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  Check,
  FileText,
  FolderLock,
  Play,
  Shield,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

const trustItems = [
  "Cancellation Proof Vault",
  "Dispute Letter Generator",
  "Continued Charge Detection",
];

const platformCards = [
  { icon: CalendarDays, label: "Subscription\nTracking", tone: "text-blue-400" },
  { icon: Building2, label: "Bank Dispute\nSupport", tone: "text-blue-300" },
  { icon: FolderLock, label: "Proof\nVault", tone: "text-emerald-300" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020716] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[-12rem] top-10 h-[34rem] w-[34rem] rounded-full bg-cyan-500/20 blur-[140px]" />
        <div className="absolute right-[-8rem] top-40 h-[32rem] w-[32rem] rounded-full bg-blue-700/30 blur-[130px]" />
        <div className="absolute bottom-[-18rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0b1b36_0%,transparent_32%),linear-gradient(180deg,rgba(2,7,22,0)_0%,#020716_78%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-6 py-5 sm:px-10">
        <header className="flex items-center justify-between gap-6">
          <Link href="/landing" className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.5)]">
              <ShieldCheck className="h-9 w-9 text-[#031127]" />
            </div>
            <div>
              <div className="text-2xl font-bold leading-tight tracking-tight">AutoPay Defender</div>
              <div className="text-base text-slate-300">Cancel • Track • Dispute</div>
            </div>
          </Link>

          <nav className="flex items-center gap-4">
            <Link href="/sign-in" className="hidden px-4 py-3 text-lg font-medium text-white/90 transition hover:text-cyan-200 sm:inline-flex">
              Login
            </Link>
            <Link href="/settings" className="hidden rounded-xl border border-cyan-300/30 bg-white/[0.03] px-5 py-3 text-base font-semibold text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-300/10 md:inline-flex">
              Upgrade Protection
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-cyan-400 px-7 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(34,211,238,0.35)] transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-[0_0_44px_rgba(34,211,238,0.55)]"
            >
              Get Started Free
            </Link>
          </nav>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1fr_0.95fr] lg:py-10">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-300/60 bg-cyan-500/5 px-5 py-3 text-base text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.16)]">
              <Shield className="h-5 w-5" />
              Stop unwanted charges before they drain your account
            </div>

            <h1 className="text-[clamp(3.5rem,8vw,6.7rem)] font-black leading-[0.95] tracking-[-0.06em] text-white">
              Cancel
              <span className="block bg-gradient-to-b from-cyan-300 via-cyan-400 to-sky-600 bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(34,211,238,0.28)]">
                subscriptions
              </span>
              <span className="block">the smart way.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-xl leading-8 text-slate-300">
              Generate cancellation letters, track disputes, monitor continued charges,
              and create evidence packets automatically — all in one place.
            </p>

            <div className="mt-8 flex flex-col gap-5 sm:flex-row">
              <Link
                href="/sign-up"
                className="group inline-flex h-16 items-center justify-center gap-6 rounded-xl bg-cyan-400 px-9 text-xl font-bold text-white shadow-[0_0_34px_rgba(34,211,238,0.36)] transition hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-[0_0_52px_rgba(34,211,238,0.58)]"
              >
                Create Free Account
                <ArrowRight className="h-6 w-6 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="/public-benefit"
                className="inline-flex h-16 items-center justify-center gap-5 rounded-xl border border-white/50 bg-white/[0.03] px-8 text-xl font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/70 hover:bg-cyan-300/10"
              >
                See How It Works
                <Play className="h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-16 items-center justify-center rounded-xl px-2 text-lg font-semibold text-cyan-200 transition hover:text-white"
              >
                Open Dashboard
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-8 text-base text-slate-300">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-cyan-400 text-cyan-300">
                    <Check className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[760px] lg:mx-0">
            <DashboardMockup />
          </div>
        </section>

        <section className="mb-5 rounded-2xl border border-cyan-200/20 bg-white/[0.045] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.45fr]">
            <div className="flex items-center gap-7">
              <div className="grid h-20 w-20 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10">
                <ShieldCheck className="h-10 w-10 text-slate-200" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Built for consumers fighting recurring charges</h2>
                <p className="mt-2 max-w-xl text-lg leading-7 text-slate-300">
                  Track cancellations, create dispute packets, and organize evidence that gets results.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {platformCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-cyan-200/20 bg-white/[0.045] p-5 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-cyan-300/10">
                  <card.icon className={`mb-3 h-9 w-9 ${card.tone}`} />
                  <div className="whitespace-pre-line text-lg font-medium leading-7">{card.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.035] px-8 py-6 backdrop-blur-xl">
          <div className="grid items-center gap-8 text-slate-400 lg:grid-cols-[1fr_5fr_1.8fr]">
            <div className="text-lg leading-6">Trusted by thousands<br />of users nationwide</div>
            <div className="grid grid-cols-2 gap-6 text-center text-2xl font-black tracking-tight text-slate-500 md:grid-cols-5">
              <span>nerdwallet</span>
              <span>Forbes</span>
              <span className="text-xl tracking-[0.28em]">BUSINESS<br />INSIDER</span>
              <span>yahoo!<br /><span className="text-sm">finance</span></span>
              <span className="text-base">Fintech<br />Breakthrough</span>
            </div>
            <div className="border-white/10 lg:border-l lg:pl-10">
              <div className="text-2xl text-yellow-400">★★★★★</div>
              <div className="mt-2 text-white">4.8/5 <span className="text-slate-400">from 1,200+ reviews</span></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardMockup() {
  return (
    <div className="relative ml-auto rounded-3xl border border-white/60 bg-[#071326]/80 p-8 shadow-[0_0_80px_rgba(34,211,238,0.18),0_35px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
      <div className="absolute inset-x-20 -top-px h-px bg-cyan-300 shadow-[0_0_35px_rgba(34,211,238,0.9)]" />
      <div className="mb-5 flex items-start justify-between gap-5">
        <div>
          <p className="text-sm text-slate-200">Subscription Monitoring</p>
          <h2 className="mt-2 text-2xl font-bold">Continued Charge Alert</h2>
        </div>
        <div className="rounded-full border border-red-500 px-5 py-2 text-red-300">
          <span className="mr-2 inline-block h-3 w-3 rounded-full bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.9)]" />
          Active Issue
        </div>
      </div>

      <div className="rounded-xl border border-cyan-100/15 bg-[#091429]/85 p-5 shadow-inner">
        <div className="mb-5 flex items-start justify-between gap-6">
          <div>
            <p className="text-slate-200">Recent Charge Detected</p>
            <h3 className="mt-2 text-xl font-semibold">Planet Fitness</h3>
            <p className="mt-1 text-slate-300">$24.99 • May 24, 2024</p>
          </div>
          <div className="relative rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
            <Zap className="mr-2 inline h-5 w-5 fill-red-400 text-red-400" />
            Charge after<br />cancellation
          </div>
        </div>

        <div className="relative h-36">
          <div className="absolute inset-x-10 bottom-8 border-t border-dashed border-red-400/60" />
          <svg viewBox="0 0 520 150" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="lineGlow" x1="0" x2="1">
                <stop offset="0%" stopColor="#ff6b4a" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M35 80 L105 58 L176 91 L246 84 L318 102 L388 95 L462 122" fill="none" stroke="url(#lineGlow)" strokeWidth="3" />
            <path d="M35 80 L105 58 L176 91 L246 84 L318 102 L388 95 L462 122 L462 145 L35 145 Z" fill="url(#chartFill)" />
            <circle cx="388" cy="95" r="5" fill="#ef4444" />
          </svg>
          <div className="absolute bottom-0 left-9 right-8 flex justify-between text-xs text-slate-300">
            <span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span>
          </div>
          <div className="absolute left-0 top-2 flex h-28 flex-col justify-between text-sm text-slate-300">
            <span>$30</span><span>$20</span><span>$10</span><span>$0</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <AlertRow icon={Bell} title="Gym Membership Still Charging" description="Detected a recurring charge after cancellation." action="View Details" tone="blue" />
        <AlertRow icon={FileText} title="Dispute Packet Generated" description="Letter, timeline, and evidence summary ready." action="View Packet" tone="green" />
      </div>
    </div>
  );
}

function AlertRow({
  icon: Icon,
  title,
  description,
  action,
  tone,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  action: string;
  tone: "blue" | "green";
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-cyan-100/15 bg-cyan-100/[0.035] p-4">
      <div className="flex items-center gap-4">
        <div className={`grid h-14 w-14 place-items-center rounded-lg ${tone === "blue" ? "bg-blue-500/20 text-blue-300" : "bg-emerald-500/20 text-emerald-300"}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </div>
      </div>
      <button className="rounded-lg border border-cyan-100/15 bg-white/[0.035] px-4 py-3 text-sm text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10">
        {action}
      </button>
    </div>
  );
}
