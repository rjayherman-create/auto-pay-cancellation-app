import { useUser, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { basePath, isClerkEnabled } from "@/lib/auth-mode";

async function callLogout() {
  try {
    await fetch(`${basePath}/api/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    // ignore
  }
  window.location.href = `${basePath}/sign-in`;
}

// ── Clerk path ────────────────────────────────────────────────────────────────
function useAuthClerk() {
  const { isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();

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
    if (isSignedIn) await signOut();
    await callLogout();
  };

  return {
    user,
    isLoading: !isLoaded || profileLoading,
    logout,
  };
}

// ── Bypass path (no Clerk, uses dev_session cookie) ───────────────────────────
function useAuthBypass() {
  const { data: profile, isLoading: profileLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: true,
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

  return {
    user,
    isLoading: profileLoading,
    logout: callLogout,
  };
}

// Statically pick the right hook so the same function is always exported,
// satisfying React's rules of hooks.
export const useAuth = isClerkEnabled ? useAuthClerk : useAuthBypass;
