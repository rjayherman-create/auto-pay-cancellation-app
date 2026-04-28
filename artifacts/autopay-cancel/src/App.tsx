import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, useClerk, useAuth as useClerkAuth, useUser } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setApiTokenProvider, setStartingUpCallback } from "@workspace/api-client-react";

import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Subscriptions from "@/pages/subscriptions";
import SubscriptionDetail from "@/pages/subscription-detail";
import Accounts from "@/pages/accounts";
import Documents from "@/pages/documents";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const bypassEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_BYPASS === "true";

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

function RootRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;
  return <Redirect to={isSignedIn ? "/dashboard" : "/sign-in"} />;
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
      if (!res.ok) throw new Error("Login failed — make sure ENABLE_DEV_BYPASS=true is set");
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
        {bypassEnabled ? (
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

  const inner = (
    <>
      <ClerkTokenSync />
      <ClerkQueryClientCacheInvalidator />
      <TooltipProvider>
        <Router />
        <Toaster />
        <SonnerToaster />
      </TooltipProvider>
    </>
  );

  if (!clerkPubKey) {
    return (
      <TooltipProvider>
        <Router />
        <Toaster />
        <SonnerToaster />
      </TooltipProvider>
    );
  }

  return (
    <ClerkErrorBoundary fallback={<ClerkUnavailableFallback />}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl || undefined}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        signInFallbackRedirectUrl={`${basePath}/dashboard`}
        signUpFallbackRedirectUrl={`${basePath}/dashboard`}
        routerPush={(to) => setLocation(stripBase(to))}
        routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
      >
        {inner}
      </ClerkProvider>
    </ClerkErrorBoundary>
  );
}

// ── Starting-up banner ────────────────────────────────────────────────────────
function useStartingUp() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const qc = useQueryClient();

  const handleStartingUp = useCallback((retryAfter: number) => {
    setSecondsLeft(retryAfter);
  }, []);

  useEffect(() => {
    setStartingUpCallback(handleStartingUp);
    return () => { setStartingUpCallback(null); };
  }, [handleStartingUp]);

  useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      setSecondsLeft(null);
      qc.invalidateQueries();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, qc]);

  return secondsLeft;
}

function ServiceStartingBanner({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
      <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
      <span>
        Service is starting up &mdash; retrying in <strong>{secondsLeft}s</strong>&hellip;
      </span>
    </div>
  );
}

function StartingUpController() {
  const secondsLeft = useStartingUp();
  if (secondsLeft === null || secondsLeft <= 0) return null;
  return <ServiceStartingBanner secondsLeft={secondsLeft} />;
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
