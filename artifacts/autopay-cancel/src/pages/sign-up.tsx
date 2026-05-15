import { SignUp } from "@clerk/react";
import { basePath, isClerkEnabled } from "@/lib/auth-mode";

export default function SignUpPage() {
  if (!isClerkEnabled) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="text-xl font-bold text-slate-900">Auto-Pay Cancel</div>
          <p className="text-sm text-slate-500">
            Sign up is unavailable right now. Please contact your administrator to configure authentication.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}
