import { Layout } from "@/components/layout";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, List, Ban, PiggyBank, ArrowRight, CheckCircle2, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { data, isLoading, error } = useGetDashboardSummary();

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
        
        <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-primary p-3 rounded-full text-white mt-1 shadow-md shadow-primary/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome to your dashboard</h2>
              <p className="text-slate-600 max-w-2xl">We provide tools and guidance to help you cancel subscriptions. Connect a bank account to automatically detect recurring payments.</p>
            </div>
          </div>
          {data.connectedAccounts === 0 && (
             <Link href="/accounts" className="px-6 py-3 shrink-0 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all">
               Connect Account
             </Link>
          )}
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
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Tools to help you manage spending</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link href="/subscriptions" className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="font-medium text-slate-700 group-hover:text-primary">Review Subscriptions</div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
              </Link>
              <Link href="/documents" className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="font-medium text-slate-700 group-hover:text-primary">Generate Document</div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-primary" />
              </Link>
              <Link href="/accounts" className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="font-medium text-slate-700 group-hover:text-primary">Connect Bank</div>
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
        <p className="text-muted-foreground mt-2">Overview of your recurring payments and savings.</p>
      </div>
      {renderContent()}
    </Layout>
  );
}
