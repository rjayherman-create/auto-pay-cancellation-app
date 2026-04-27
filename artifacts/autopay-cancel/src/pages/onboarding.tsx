import { useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useGetBankAccounts } from "@workspace/api-client-react";
import { PlaidLinkButton } from "@/components/plaid-link-button";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, ArrowRight, Loader2,
  CreditCard, TrendingDown, FileText,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetBankAccountsQueryKey } from "@workspace/api-client-react";

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: accounts, isLoading: accountsLoading } = useGetBankAccounts({
    query: { queryKey: getGetBankAccountsQueryKey(), enabled: !!user },
  });

  // Redirect to register if not logged in, skip onboarding if already has accounts
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/register");
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (!accountsLoading && accounts && accounts.length > 0) {
      navigate("/dashboard");
    }
  }, [accounts, accountsLoading]);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() });
    // Give the toast a moment to show, then redirect
    setTimeout(() => navigate("/dashboard"), 1500);
  }, [queryClient, navigate]);

  if (isLoading || accountsLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 font-bold text-xl text-primary mb-6">
            <ShieldCheck className="h-7 w-7" />
            <span>AutoPay Cancel</span>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">1</div>
              <span className="text-sm font-medium text-primary hidden sm:inline">Account created</span>
            </div>
            <div className="h-px w-8 bg-slate-300" />
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">2</div>
              <span className="text-sm font-medium text-primary hidden sm:inline">Connect bank</span>
            </div>
            <div className="h-px w-8 bg-slate-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 text-sm font-bold flex items-center justify-center">3</div>
              <span className="text-sm font-medium text-slate-400 hidden sm:inline">See your subscriptions</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Welcome, {firstName}! 🎉
          </h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            Connect your bank to automatically discover every recurring charge hiding in your transactions.
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden">

          {/* What we'll find */}
          <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100">
            {[
              { icon: CreditCard, label: "Streaming & apps", color: "text-blue-600 bg-blue-50" },
              { icon: TrendingDown, label: "Trial traps", color: "text-amber-600 bg-amber-50" },
              { icon: FileText, label: "Forgotten memberships", color: "text-emerald-600 bg-emerald-50" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 p-4 sm:p-5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="p-8 sm:p-10 text-center">
            <PlaidLinkButton
              onSuccess={handleSuccess}
              label="Connect Your Bank Account"
              size="lg"
              className="w-full sm:w-auto h-14 text-base px-10 shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            />

            {/* Security note */}
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-400">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span>Read-only access — we can never move money. Powered by Plaid.</span>
            </div>
          </div>

          {/* Supported banks */}
          <div className="border-t border-slate-100 px-8 py-4 bg-slate-50/50 flex flex-wrap items-center gap-2 justify-center">
            {["Chase", "Bank of America", "Wells Fargo", "Citi", "Capital One", "+12,000 more"].map((bank) => (
              <span key={bank} className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 bg-white">
                {bank}
              </span>
            ))}
          </div>
        </div>

        {/* Skip */}
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-slate-600 text-sm"
            onClick={() => navigate("/dashboard")}
          >
            I'll connect later
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
