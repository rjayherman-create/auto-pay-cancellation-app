import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetRecurringPayments, GetRecurringPaymentsStatus } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

export default function Subscriptions() {
  const [filter, setFilter] = useState<GetRecurringPaymentsStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  
  const { data: payments, isLoading, error } = useGetRecurringPayments(
    filter === 'all' ? undefined : { status: filter }
  );

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'hard': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'disputed': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filteredPayments = payments?.filter(p => p.merchantName.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Subscriptions</h1>
          <p className="text-muted-foreground mt-2">Manage and cancel your recurring payments.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search merchants..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-full sm:w-64 bg-white" 
            />
          </div>
          <div className="flex bg-white rounded-md border border-input p-1">
            {(['all', 'active', 'cancelled', 'disputed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm capitalize transition-colors ${filter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl">Error loading subscriptions.</div>
      ) : !filteredPayments?.length ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <SlidersHorizontal className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No subscriptions found</h3>
          <p className="text-slate-500">We didn't find any subscriptions matching your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl group overflow-hidden flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-display font-bold text-xl text-slate-400">
                      {payment.merchantName.substring(0, 1)}
                    </div>
                    <Badge variant="outline" className={`capitalize ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 truncate">{payment.merchantName}</h3>
                  <div className="text-2xl font-bold font-display mt-1">${payment.amount.toFixed(2)} <span className="text-sm font-normal text-slate-500 capitalize">/ {payment.frequency}</span></div>
                </div>
                <div className="mt-auto px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 mb-1">Cancel Difficulty</span>
                    <Badge variant="outline" className={`w-fit capitalize text-[10px] px-2 py-0 h-5 ${getDifficultyColor(payment.cancellationDifficulty)}`}>
                      {payment.cancellationDifficulty}
                    </Badge>
                  </div>
                  <Link href={`/subscriptions/${payment.id}`} className="inline-flex h-9 items-center justify-center rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-100 hover:text-slate-900 group-hover:border-primary/30 group-hover:text-primary">
                    Manage <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
