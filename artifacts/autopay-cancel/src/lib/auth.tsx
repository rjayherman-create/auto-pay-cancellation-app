import React, { createContext, useContext, useEffect, useState } from "react";
import { useGetMe, useLogin, useRegister, useLogout } from "@workspace/api-client-react";
import type { LoginRequest, RegisterRequest, User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: user, isLoading, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      localStorage.removeItem("auth_token");
    }
  }, [error]);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("auth_token", data.token);
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({ title: "Welcome back!" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Login failed", description: err.message || "Invalid credentials" });
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("auth_token", data.token);
        queryClient.setQueryData(getGetMeQueryKey(), data.user);
        toast({ title: "Account created successfully!" });
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Registration failed", description: err.message || "Something went wrong" });
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("auth_token");
        queryClient.setQueryData(getGetMeQueryKey(), null);
        toast({ title: "Logged out successfully" });
      }
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login: async (data) => { await loginMutation.mutateAsync({ data }); },
        register: async (data) => { await registerMutation.mutateAsync({ data }); },
        logout: async () => { await logoutMutation.mutateAsync(); }
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
