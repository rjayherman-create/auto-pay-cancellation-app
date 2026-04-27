import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, useAuth as useClerkAuth } from "@clerk/react";
import { useEffect } from "react";
import { registerClerkTokenGetter } from "@workspace/api-client-react";
import { AuthProvider } from "@/lib/auth";

import SignIn from "@/pages/sign-in";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Subscriptions from "@/pages/subscriptions";
import SubscriptionDetail from "@/pages/subscription-detail";
import Accounts from "@/pages/accounts";
import Documents from "@/pages/documents";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ClerkTokenInjector() {
  const { getToken } = useClerkAuth();

  useEffect(() => {
    registerClerkTokenGetter(() => getToken());
    return () => { registerClerkTokenGetter(null); };
  }, [getToken]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in" component={SignIn} />
      <Route path="/login"><Redirect to="/sign-in" /></Route>
      <Route path="/register"><Redirect to="/sign-in" /></Route>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/subscriptions/:id" component={SubscriptionDetail} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/documents" component={Documents} />
      <Route path="/settings" component={Settings} />
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey} {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}>
      <ClerkTokenInjector />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
            <SonnerToaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
