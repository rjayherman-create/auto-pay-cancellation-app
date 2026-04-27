import { useUser, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export function useAuth() {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // Always call /api/auth/me once Clerk finishes loading.
  // The backend accepts EITHER a Clerk Bearer token OR the dev_session cookie,
  // so this works for both real Clerk users and the bypass login.
  const { data: profile, isLoading: profileLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: isLoaded,
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
    // Clear Clerk session if there is one
    if (isSignedIn) {
      await signOut();
    }
    // Always clear the backend cookie session
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // ignore
    }
    window.location.href = "/sign-in";
  };

  return {
    user,
    isLoading: !isLoaded || profileLoading,
    logout,
  };
}
