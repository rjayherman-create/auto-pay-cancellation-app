import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, Calendar, ShieldCheck, CreditCard, Check,
  Zap, ExternalLink, Loader2, Lock, Star
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  description: string;
  prices: {
    id: string;
    unitAmount: number;
    currency: string;
    recurring: { interval: string };
  }[];
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

const API_BASE = "/api";

function authFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

const FEATURES = [
  "Detect all recurring subscriptions",
  "Step-by-step cancellation guides",
  "Cancellation email templates",
  "ACH revocation letters",
  "Stop payment request forms",
  "Unlimited connected accounts",
];

export default function Settings() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subStatus, setSubStatus] = useState<string>("none");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    // Check for success/cancelled query params
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      toast.success("Subscription activated! Welcome to Auto-Pay Cancel Pro.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("subscription") === "cancelled") {
      toast.info("Checkout cancelled. Your subscription was not changed.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location]);

  useEffect(() => {
    async function load() {
      setLoadingPlans(true);
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch(`${API_BASE}/stripe/plans`),
          authFetch("/stripe/subscription"),
        ]);

        if (plansRes.ok) {
          const data = await plansRes.json();
          setPlans(data.plans || []);
        }

        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
          setSubStatus(data.status || "none");
        }
      } catch (err) {
        console.error("Error loading billing data:", err);
      } finally {
        setLoadingPlans(false);
      }
    }
    if (user) load();
  }, [user]);

  async function handleSubscribe(priceId: string) {
    setCheckoutLoading(priceId);
    try {
      const res = await authFetch("/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to create checkout session.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await authFetch("/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not open billing portal.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setPortalLoading(false);
    }
  }

  if (!user) return null;

  const isActive = subStatus === "active" || subStatus === "trialing";
  const isTrial = user.subscriptionStatus === "trial";

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and subscription.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card className="shadow-sm border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-primary" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{user.name}</div>
                <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="h-3 w-3" /> {user.email}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 pl-1">
              <Calendar className="h-4 w-4" />
              Member since {format(new Date(user.createdAt), "MMMM yyyy")}
            </div>
          </CardContent>
        </Card>

        {/* Security Trust Badge */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <Lock className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="text-sm text-blue-800">
            <span className="font-semibold">Bank-grade security:</span> Your data is encrypted with AES-256 at rest and TLS 1.3 in transit. We never store your bank credentials.
          </div>
        </div>

        {/* Subscription */}
        <Card className="shadow-sm border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="h-5 w-5 text-primary" /> Subscription
            </CardTitle>
            <CardDescription>
              {isActive
                ? "You have an active Pro subscription."
                : isTrial
                ? `Free trial${user.trialEndsAt ? " — expires " + format(new Date(user.trialEndsAt), "MMM d, yyyy") : ""}`
                : "Subscribe to unlock all features."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${isActive ? "bg-emerald-500" : isTrial ? "bg-amber-400" : "bg-slate-300"}`} />
                <div>
                  <div className="font-semibold text-slate-900">
                    {isActive ? "Auto-Pay Cancel Pro" : isTrial ? "Free Trial" : "No Active Plan"}
                  </div>
                  {subscription?.currentPeriodEnd && (
                    <div className="text-xs text-slate-500">
                      {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
                      {format(new Date(subscription.currentPeriodEnd * 1000), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </div>
              <Badge
                className={
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isTrial
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-600"
                }
                variant="outline"
              >
                {isActive ? "Active" : isTrial ? "Trial" : "Inactive"}
              </Badge>
            </div>

            {/* Manage Billing if active */}
            {isActive && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePortal}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Billing & Invoices
              </Button>
            )}

            {/* Plans — show when not active */}
            {!isActive && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" /> Upgrade to Pro
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Everything you need to take control of your subscriptions.
                  </p>

                  {/* Features list */}
                  <div className="grid grid-cols-1 gap-2 mb-6">
                    {FEATURES.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>

                  {/* Price options */}
                  {loadingPlans ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : plans.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No plans available yet. Please check back soon.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {plans.flatMap((plan) =>
                        plan.prices
                          .sort((a, b) => a.unitAmount - b.unitAmount)
                          .map((price) => {
                            const isMonthly = price.recurring?.interval === "month";
                            const isYear = price.recurring?.interval === "year";
                            const amount = (price.unitAmount / 100).toFixed(2);
                            const label = isMonthly ? "/month" : isYear ? "/year" : "";
                            const savings = isYear ? "Save 37%" : null;

                            return (
                              <div
                                key={price.id}
                                className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                                  isYear
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-200 bg-white"
                                }`}
                              >
                                {isYear && (
                                  <span className="absolute -top-2.5 left-4 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    Best Value
                                  </span>
                                )}
                                <div>
                                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                                    ${amount}
                                    <span className="text-slate-400 font-normal text-sm">{label}</span>
                                    {savings && (
                                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        {savings}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {isYear ? "Billed annually — $5.00/month" : "Billed monthly"}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  className={isYear ? "" : ""}
                                  variant={isYear ? "default" : "outline"}
                                  disabled={checkoutLoading === price.id}
                                  onClick={() => handleSubscribe(price.id)}
                                >
                                  {checkoutLoading === price.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Zap className="h-4 w-4 mr-1.5" />
                                      Subscribe
                                    </>
                                  )}
                                </Button>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}

                  {/* Payment security note */}
                  <div className="flex items-center gap-2 mt-4 text-xs text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secured by Stripe. Cancel anytime. No hidden fees.
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="shadow-sm rounded-2xl border-red-100">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-medium text-slate-900">Sign Out</div>
                <div className="text-sm text-slate-500">Sign out on this device.</div>
              </div>
              <Button variant="outline" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
