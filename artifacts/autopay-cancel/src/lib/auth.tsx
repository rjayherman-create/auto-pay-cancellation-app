import { useUser, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

const bypassMode = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_BYPASS === "true";
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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

// Statically pick the right hook — bypassMode is a compile-time constant so
// the same function is always exported, satisfying React's rules of hooks.
export const useAuth = bypassMode ? useAuthBypass : useAuthClerk;
