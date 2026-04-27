import { useUser, useClerk } from "@clerk/react";
import { useGetMe, useLogin, useRegister } from "@workspace/api-client-react";

export function useAuth() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();

  const { data: profile, isLoading: profileLoading } = useGetMe({
    query: {
      queryKey: ["me"],
      enabled: isSignedIn === true,
      retry: false,
    },
  });

  const { mutateAsync: loginMutate } = useLogin();
  const { mutateAsync: registerMutate } = useRegister();

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
    login: async ({ email, password }: { email: string; password: string }) => {
      await loginMutate({ data: { email, password } });
    },
    register: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      await registerMutate({ data: { name, email, password } });
    },
  };
}
