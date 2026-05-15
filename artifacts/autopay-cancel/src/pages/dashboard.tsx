import { Layout } from "@/components/layout";
import {
  getGetBankAccountsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetRecurringPaymentsQueryKey,
  useGetDashboardSummary,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, List, Ban, PiggyBank, ArrowRight, CheckCircle2, ShieldCheck, Activity, Search, FileText, AlertTriangle, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlaidLinkButton } from "@/components/plaid-link-button";

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardSummary();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);

  const refreshScanResults = () => {
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetRecurringPaymentsQueryKey() });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl bg-slate-200" />
          ))}
          <div className="lg:col-span-4 mt-6">
            <Skeleton className="h-[400px] w-full rounded-2xl bg-slate-200" />
          </div>
        </div>
      );
    }

    if (error || !data) {
      return <div className="text-red-500">Failed to load dashboard summary.</div>;
    }

    const cards = [
      { title: "Total Monthly Spend", value: `$${data.totalMonthlySpend.toFixed(2)}`, icon: DollarSign, color: "text-blue-600", bg: "bg-blue-100" },
      { title: "Active Subscriptions", value: data.activeSubscriptions, icon: List, color: "text-emerald-600", bg: "bg-emerald-100" },
      { title: "Potential Savings", value: `$${data.potentialMonthlySavings.toFixed(2)}`, icon: PiggyBank, color: "text-amber-600", bg: "bg-amber-100" },
      { title: "Total Saved", value: `$${data.totalSaved.toFixed(2)}`, icon: Ban, color: "text-primary", bg: "bg-primary/10" },
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

        <div className="rounded-2xl border border-primary/20 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-full bg-primary p-3 text-white shadow-md shadow-primary/20">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h2 className="mb-1 text-2xl font-bold text-slate-900">Start by scanning your accounts</h2>
                <p className="max-w-2xl text-slate-600">
                  Connect a bank or card account, scan for recurring ACH and card charges, then choose whether to cancel, stop payment, or dispute continued charges.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <PlaidLinkButton
                label={data.connectedAccounts === 0 ? "Start Account Scan" : "Scan Another Account"}
                className="h-12 px-6"
                onStart={() => setScanning(true)}
                onEnd={() => setScanning(false)}
                onSuccess={refreshScanResults}
              />
              {data.activeSubscriptions > 0 && (
                <Link href="/subscriptions" className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 px-6 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                  Review Results
                </Link>
              )}
            </div>
          </div>

          {scanning && (
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              Secure connection started. After the account connects, recurring charges will appear in your subscriptions list.
            </div>
          )}

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              { title: "Connect", detail: "Link bank or card", done: data.connectedAccounts > 0 },
              { title: "Scan", detail: "Find ACH and cards", done: data.activeSubscriptions > 0 },
              { title: "Decide", detail: "Cancel or dispute", done: data.recentActivity.length > 0 },
              { title: "Document", detail: "Generate proof", done: false },
            ].map((step, index) => (
              <div key={step.title} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step.done ? "bg-emerald-600 text-white" : "bg-white text-slate-500"}`}>
                  {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                  <div className="text-xs text-slate-500">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 mb-4">
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-display font-bold text-slate-900">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentActivity.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                  <List className="h-12 w-12 text-slate-200 mb-4" />
                  <p>No recent activity found.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'cancelled' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {activity.type === 'cancelled' ? <Ban className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{activity.merchantName}</p>
                          <p className="text-xs text-slate-500">{activity.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">${activity.amount.toFixed(2)}</p>
                        <p className="text-xs text-slate-400">{format(new Date(activity.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Next Step</CardTitle>
              <CardDescription>Use one clear workflow based on what you need</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <button
                type="button"
                onClick={() => document.querySelector<HTMLButtonElement>("[data-plaid-connect]")?.click()}
                className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5"
              >
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-slate-700 group-hover:text-primary">Start Account Scan</div>
                    <div className="text-xs text-slate-500">Find recurring ACH and card charges</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
              </button>
              <Link href="/subscriptions" className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-3">
                  <List className="h-5 w-5 text-emerald-600" />
                  <div>
                    <div className="font-medium text-slate-700 group-hover:text-primary">Review Scan Results</div>
                    <div className="text-xs text-slate-500">Cancel subscriptions you found</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
              </Link>
              <Link href="/dashboard/disputes" className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-3">
                  <Landmark className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-slate-700 group-hover:text-primary">Stop ACH or Card Charge</div>
                    <div className="text-xs text-slate-500">Generate bank stop-payment letters</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
              </Link>
              <Link href="/dashboard/continued-charge-detector" className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium text-slate-700 group-hover:text-primary">Still Charged After Canceling</div>
                    <div className="text-xs text-slate-500">Build evidence and dispute packet</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
              </Link>
              <Link href="/documents" className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <div>
                    <div className="font-medium text-slate-700 group-hover:text-primary">Generate Documents</div>
                    <div className="text-xs text-slate-500">Create cancellation proof</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Scan accounts, find recurring charges, and choose the right cancellation or dispute workflow.</p>
      </div>
      {renderContent()}
    </Layout>
  );
}
