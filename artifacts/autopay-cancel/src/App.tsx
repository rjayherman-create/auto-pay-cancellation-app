import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, useClerk, useAuth as useClerkAuth, useUser } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setApiTokenProvider } from "@workspace/api-client-react";
import { StartingUpController } from "@/lib/use-starting-up";
import { basePath, clerkProxyUrl, clerkPubKey, isClerkEnabled, isDevBypassEnabled } from "@/lib/auth-mode";

import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Subscriptions from "@/pages/subscriptions";
import SubscriptionDetail from "@/pages/subscription-detail";
import Accounts from "@/pages/accounts";
import Documents from "@/pages/documents";
import Settings from "@/pages/settings";
import DisputesPage from "@/pages/disputes";
import ContinuedChargeDetector from "@/pages/continued-charge-detector";
import NotFound from "@/pages/not-found";

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function ClerkTokenSync() {
  const { getToken, isSignedIn } = useClerkAuth();
  useEffect(() => {
    if (!isSignedIn) { setApiTokenProvider(null); return; }
    setApiTokenProvider(() => getToken());
  }, [isSignedIn, getToken]);
  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

// Clerk-aware redirect — only rendered when ClerkProvider is active
function RootRedirectClerk() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;
  return <Redirect to={isSignedIn ? "/dashboard" : "/sign-in"} />;
}

// Bypass-mode redirect — no Clerk hooks, just go to sign-in (which auto-logs in)
function RootRedirect() {
  if (!isClerkEnabled) return <Redirect to="/sign-in" />;
  return <RootRedirectClerk />;
}

function Router() {
  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/login"><Redirect to="/sign-in" /></Route>
      <Route path="/register"><Redirect to="/sign-up" /></Route>
      <Route path="/" component={RootRedirect} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/subscriptions/:id" component={SubscriptionDetail} />
      <Route path="/accounts" component={Accounts} />
      <Route path="/documents" component={Documents} />
      <Route path="/settings" component={Settings} />
      <Route path="/dashboard/disputes" component={DisputesPage} />
      <Route path="/dashboard/continued-charge-detector" component={ContinuedChargeDetector} />
      <Route component={NotFound} />
    </Switch>
  );
}

// ── Error boundary so Clerk failures don't white-screen the app ───────────────
interface EBState { error: Error | null }
class ClerkErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState { return { error }; }
  render() {
    if (this.state.error) return this.props.fallback;
    return this.props.children;
  }
}

// Shown when Clerk fails to load (e.g. domain not whitelisted, network error)
function ClerkUnavailableFallback() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleBypass() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${basePath}/api/auth/dev-login`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Login failed — make sure bypass is enabled on the server");
      window.location.href = `${basePath}/dashboard`;
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
        <div className="text-2xl font-bold text-slate-900">Auto-Pay Cancel</div>
        {isDevBypassEnabled ? (
          <>
            <p className="text-sm text-slate-500">Sign in to continue</p>
            <button
              onClick={handleBypass}
              disabled={busy}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Continue as Test User"}
            </button>
            {err && <p className="text-xs text-red-500">{err}</p>}
            <p className="text-xs text-amber-600">Clerk is not enabled on this domain — using bypass login</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            Authentication is unavailable. Add this domain to your Clerk dashboard to enable sign-in.
          </p>
        )}
      </div>
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  const bare = (
    <TooltipProvider>
      <Router />
      <Toaster />
      <SonnerToaster />
    </TooltipProvider>
  );

  // Bypass mode: skip Clerk entirely — no network calls to Clerk servers
  if (!isClerkEnabled) return bare;

  return (
    <ClerkErrorBoundary fallback={<ClerkUnavailableFallback />}>
      <ClerkProvider
        publishableKey={clerkPubKey!}
        proxyUrl={clerkProxyUrl || undefined}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        signInFallbackRedirectUrl={`${basePath}/dashboard`}
        signUpFallbackRedirectUrl={`${basePath}/dashboard`}
        routerPush={(to) => setLocation(stripBase(to))}
        routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      >
        <ClerkTokenSync />
        <ClerkQueryClientCacheInvalidator />
        {bare}
      </ClerkProvider>
    </ClerkErrorBoundary>
  );
}


function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <StartingUpController />
        <ClerkProviderWithRoutes />
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
