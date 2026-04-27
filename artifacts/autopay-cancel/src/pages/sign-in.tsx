import { useState } from "react";
import { SignIn } from "@clerk/react";
import { useLocation } from "wouter";
import { bypassLogin } from "@/lib/auth";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const showDevBypass = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_BYPASS === "true";
const showBypassLogin = import.meta.env.VITE_ENABLE_BYPASS_LOGIN === "true";

export default function SignInPage() {
  const [, setLocation] = useLocation();

  // Legacy cookie-based dev bypass
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);

  // JWT-based bypass login
  const [bypassEmail, setBypassEmail] = useState("test@example.com");
  const [bypassName, setBypassName] = useState("Test User");
  const [bypassLoading, setBypassLoading] = useState(false);
  const [bypassError, setBypassError] = useState<string | null>(null);

  async function handleDevLogin() {
    setDevLoading(true);
    setDevError(null);
    try {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Dev login failed");
      setLocation("/dashboard");
    } catch (e: any) {
      setDevError(e.message);
    } finally {
      setDevLoading(false);
    }
  }

  async function handleBypassLogin(e: React.FormEvent) {
    e.preventDefault();
    setBypassLoading(true);
    setBypassError(null);
    try {
      await bypassLogin(bypassEmail.trim(), bypassName.trim());
      setLocation("/dashboard");
    } catch (e: any) {
      setBypassError(e.message);
    } finally {
      setBypassLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 gap-6">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />

      {showDevBypass && (
        <div className="w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 text-center shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Dev / Testing bypass
          </p>
          <button
            onClick={handleDevLogin}
            disabled={devLoading}
            className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {devLoading ? "Signing in…" : "Continue as Test User (skip Clerk)"}
          </button>
          {devError && <p className="mt-2 text-xs text-red-600">{devError}</p>}
          <p className="mt-2 text-xs text-amber-600">
            Only visible in development — disabled in production
          </p>
        </div>
      )}

      {showBypassLogin && (
        <div className="w-full max-w-sm rounded-xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-violet-700 text-center">
            Developer Bypass Login
          </p>
          <form onSubmit={handleBypassLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="bypass-email" className="text-xs font-medium text-violet-800">
                Email
              </label>
              <input
                id="bypass-email"
                type="email"
                required
                value={bypassEmail}
                onChange={(e) => setBypassEmail(e.target.value)}
                className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="test@example.com"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="bypass-name" className="text-xs font-medium text-violet-800">
                Name
              </label>
              <input
                id="bypass-name"
                type="text"
                value={bypassName}
                onChange={(e) => setBypassName(e.target.value)}
                className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
                placeholder="Test User"
              />
            </div>
            <button
              type="submit"
              disabled={bypassLoading}
              className="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-violet-700 disabled:opacity-50 transition-colors"
            >
              {bypassLoading ? "Signing in…" : "Sign in without Clerk"}
            </button>
            {bypassError && <p className="text-xs text-red-600 text-center">{bypassError}</p>}
          </form>
          <p className="mt-3 text-xs text-violet-500 text-center">
            Requires <code className="font-mono">ENABLE_BYPASS_LOGIN=true</code> on the server
          </p>
        </div>
      )}
    </div>
  );
}
