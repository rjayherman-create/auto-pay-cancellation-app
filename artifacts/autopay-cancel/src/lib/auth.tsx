import React, { createContext, useContext } from "react";
import { useUser, useClerk } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { getGetMeQueryKey } from "@workspace/api-client-react";

interface AppUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  trialEndsAt?: string;
  subscriptionStatus: "trial" | "active" | "cancelled" | "expired";
}

interface AuthContextType {
  user: AppUser | null | undefined;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // Fetch app-specific data (subscription, trial dates) from our DB
  const { data: dbUser, isLoading: dbLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!isSignedIn,
      retry: false,
    },
  });

  const isLoading = !clerkLoaded || (!!isSignedIn && dbLoading);

  let user: AppUser | null | undefined = undefined;
  if (clerkLoaded) {
    if (!isSignedIn) {
      user = null;
    } else if (dbUser) {
      // Prefer Clerk's live profile data for name/email
      user = {
        ...dbUser,
        name: clerkUser?.fullName || dbUser.name,
        email: clerkUser?.primaryEmailAddress?.emailAddress || dbUser.email,
      };
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        logout: () => signOut(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
