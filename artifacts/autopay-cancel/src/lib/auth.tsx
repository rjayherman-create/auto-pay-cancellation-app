import { useUser, useClerk } from "@clerk/react";
import { useGetMe, getGetMeQueryKey, setApiTokenProvider } from "@workspace/api-client-react";
import { useState, useEffect } from "react";

// ── Bypass login helpers ──────────────────────────────────────────────────────
const BYPASS_TOKEN_KEY = "bypass_jwt";

export function getBypassToken(): string | null {
  return localStorage.getItem(BYPASS_TOKEN_KEY);
}

export function setBypassToken(token: string): void {
  localStorage.setItem(BYPASS_TOKEN_KEY, token);
}

export function clearBypassToken(): void {
  localStorage.removeItem(BYPASS_TOKEN_KEY);
}

export async function bypassLogin(
  email: string,
  name: string,
): Promise<{ token: string; user: { id: number; email: string; name: string; subscriptionStatus: string; trialEndsAt?: string | null } }> {
  const res = await fetch("/api/auth/bypass-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Bypass login failed");
  }
  const data = await res.json();
  setBypassToken(data.token);
  setApiTokenProvider(async () => data.token);
  return data;
}
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  // Track whether a bypass token is present
  const [bypassToken, setBypassTokenState] = useState<string | null>(() => getBypassToken());

  // Keep the API token provider in sync with the bypass token
  useEffect(() => {
    if (bypassToken) {
      setApiTokenProvider(async () => bypassToken);
    }
  }, [bypassToken]);

  const { data: profile, isLoading: profileLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: isSignedIn === true || bypassToken !== null,
      retry: false,
    },
  });

  const user = (isSignedIn || bypassToken) && profile
    ? {
        id: profile.id ?? 0,
        email: profile.email ?? "",
        name: profile.name ?? "User",
        subscriptionStatus: profile.subscriptionStatus ?? "trial",
        trialEndsAt: profile.trialEndsAt,
        createdAt: profile.createdAt,
      }
    : null;

  const isLoading =
    bypassToken !== null
      ? profileLoading
      : !isLoaded || (isSignedIn === true && profileLoading);

  return {
    user,
    isLoading,
    logout: async () => {
      if (bypassToken) {
        clearBypassToken();
        setApiTokenProvider(null);
        setBypassTokenState(null);
        window.location.href = "/sign-in";
      } else {
        await signOut();
      }
    },
  };
}
