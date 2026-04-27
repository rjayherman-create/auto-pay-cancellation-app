import { useState } from "react";
import { SignIn } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const showBypass = true; // server enforces ENABLE_DEV_BYPASS on its end

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDevLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${basePath}/api/auth/dev-login`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server returned ${res.status} — set ENABLE_DEV_BYPASS=true in Railway Variables`);
      }
      window.location.href = `${basePath}/dashboard`;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
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

      {showBypass && (
        <div className="w-full max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 text-center shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Dev / Testing bypass
          </p>
          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "Signing in…" : "Continue as Test User (skip Clerk)"}
          </button>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <p className="mt-2 text-xs text-amber-600">
            Only visible in development — disabled in production
          </p>
        </div>
      )}
    </div>
  );
}
