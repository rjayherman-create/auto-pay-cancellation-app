import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryCache, MutationCache, QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, useClerk, useAuth as useClerkAuth } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setApiTokenProvider, ApiError } from "@workspace/api-client-react";

import { useAuth } from "@/lib/auth";
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
const bypassEnabled = true; // button always renders; server enforces ENABLE_DEV_BYPASS on its end

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

// ── Server-startup 503 state ──────────────────────────────────────────────────
// Module-level pub/sub so the QueryCache (created outside React) can notify UI.
let _isStartingUp = false;
let _retryAfterSecs = 10;
const _startupListeners = new Set<() => void>();

function setStartingUp(isStartingUp: boolean, retryAfterSecs = 10) {
  _isStartingUp = isStartingUp;
  _retryAfterSecs = retryAfterSecs;
  _startupListeners.forEach((fn) => fn());
}

function useStartingUp() {
  const [state, setState] = useState({ isStartingUp: _isStartingUp, retryAfterSecs: _retryAfterSecs });
  useEffect(() => {
    const notify = () => setState({ isStartingUp: _isStartingUp, retryAfterSecs: _retryAfterSecs });
    _startupListeners.add(notify);
    return () => { _startupListeners.delete(notify); };
  }, []);
  return state;
}

function parseRetryAfter(headers: Headers): number {
  const value = headers.get("retry-after");
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 503) {
        const secs = parseRetryAfter(error.headers);
        setStartingUp(true, secs);
      }
    },
    onSuccess: () => {
      if (_isStartingUp) setStartingUp(false);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 503) {
        const secs = parseRetryAfter(error.headers);
        setStartingUp(true, secs);
      }
    },
    onSuccess: () => {
      if (_isStartingUp) setStartingUp(false);
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 503) return failureCount < 10;
        return false;
      },
      retryDelay: (_, error) => {
        if (error instanceof ApiError && error.status === 503) {
          return parseRetryAfter(error.headers) * 1000;
        }
        return 1000;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status === 503) return failureCount < 10;
        return false;
      },
      retryDelay: (_, error) => {
        if (error instanceof ApiError && error.status === 503) {
          return parseRetryAfter(error.headers) * 1000;
        }
        return 1000;
      },
    },
  },
});

function ServiceStartingBanner() {
  const { isStartingUp, retryAfterSecs } = useStartingUp();
  if (!isStartingUp) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-3 bg-amber-50 px-4 py-3 shadow-sm border-b border-amber-200">
      <svg
        className="h-4 w-4 shrink-0 animate-spin text-amber-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm font-medium text-amber-800">
        Service is starting up — retrying in {retryAfterSecs}s…
      </p>
    </div>
  );
}

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
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return <Redirect to={user ? "/dashboard" : "/sign-in"} />;
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

function App() {
  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <ServiceStartingBanner />
        <ClerkProviderWithRoutes />
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
