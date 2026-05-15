import { useEffect, useState } from "react";
import { SignIn } from "@clerk/react";
import { basePath, isClerkEnabled, isDevBypassEnabled } from "@/lib/auth-mode";

export default function SignInPage() {
  const [loading, setLoading] = useState(isDevBypassEnabled);
  const [error, setError] = useState<string | null>(null);

  async function handleDevLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${basePath}/api/auth/dev-login`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Dev login failed — ensure ENABLE_DEV_BYPASS=true is set on the server");
      // Full reload: clears React Query cache so /api/auth/me refetches with the new cookie
      window.location.href = `${basePath}/dashboard`;
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  // Auto-login immediately when bypass mode is active
  useEffect(() => {
    if (isDevBypassEnabled) handleDevLogin();
  }, []);

  // Bypass mode: show a minimal loading screen (auto-login is in progress)
  if (isDevBypassEnabled) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 gap-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="text-xl font-bold text-slate-900">Auto-Pay Cancel</div>
          {loading && !error && (
            <p className="text-sm text-slate-500">Signing you in…</p>
          )}
          {error && (
            <>
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={handleDevLogin}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!isClerkEnabled) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="text-xl font-bold text-slate-900">Auto-Pay Cancel</div>
          <p className="text-sm text-slate-500">
            Sign in is unavailable right now. Please contact your administrator to configure authentication.
          </p>
        </div>
      </div>
    );
  }

  // Normal mode: show Clerk sign-in widget
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}
