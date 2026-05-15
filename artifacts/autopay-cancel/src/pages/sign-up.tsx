import { SignUp } from "@clerk/react";
import { Redirect } from "wouter";
import { basePath, isClerkEnabled } from "@/lib/auth-mode";

export default function SignUpPage() {
  if (!isClerkEnabled) return <Redirect to="/sign-in" />;

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
