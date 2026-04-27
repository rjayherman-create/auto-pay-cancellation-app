import { useUser, useClerk } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";

export function useAuth() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  const { data: profile, isLoading: profileLoading } = useGetMe({
    query: {
      enabled: isSignedIn === true,
      retry: false,
    },
  });

  const user = isSignedIn && profile
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
    isLoading: !isLoaded || (isSignedIn === true && profileLoading),
    logout: async () => { await signOut(); },
  };
}
