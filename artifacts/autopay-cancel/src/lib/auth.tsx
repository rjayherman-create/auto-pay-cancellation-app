import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export function useAuth() {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // If Clerk hasn't finished loading within 5 seconds, proceed anyway.
  // This prevents a blank page on domains where Clerk is slow or unavailable.
  const [clerkTimedOut, setClerkTimedOut] = useState(false);
  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setClerkTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [isLoaded]);

  const canQuery = isLoaded || clerkTimedOut;

  // Call /api/auth/me once Clerk finishes loading (or times out).
  // The backend accepts either a Clerk Bearer token or the dev_session cookie.
  const { data: profile, isLoading: profileLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: canQuery,
      retry: false,
    },
  });

  const user = profile
    ? {
        id: profile.id ?? 0,
        email: profile.email ?? "",
        name: profile.name ?? "User",
        subscriptionStatus: profile.subscriptionStatus ?? "trial",
        trialEndsAt: profile.trialEndsAt,
        createdAt: profile.createdAt,
      }
    : null;

  const logout = async () => {
    if (isSignedIn) {
      await signOut();
    }
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    window.location.href = "/sign-in";
  };

  return {
    user,
    isLoading: !canQuery || profileLoading,
    logout,
  };
}
