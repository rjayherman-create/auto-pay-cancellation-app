import { Layout } from "@/components/layout";
import { useGetRecurringPayment, useGetCancellationWorkflow, useUpdatePaymentStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Clock, Phone, Globe, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { getGetRecurringPaymentQueryKey, getGetRecurringPaymentsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionDetail() {
  const [, params] = useRoute("/subscriptions/:id");
  const id = Number(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payment, isLoading: loadingPayment } = useGetRecurringPayment(id);
  const { data: workflow, isLoading: loadingWorkflow } = useGetCancellationWorkflow(id);
  const updateMutation = useUpdatePaymentStatus({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetRecurringPaymentQueryKey(id), data);
        queryClient.invalidateQueries({ queryKey: getGetRecurringPaymentsQueryKey() });
        toast({ title: "Status updated successfully" });
      }
    }
  });

  const handleStatusChange = (newStatus: string) => {
    updateMutation.mutate({ paymentId: id, data: { status: newStatus as any } });
  };

  if (loadingPayment || loadingWorkflow) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (!payment) return <Layout><div className="p-8">Not found.</div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/subscriptions" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Subscriptions
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{payment.merchantName}</h1>
            <p className="text-muted-foreground mt-1 capitalize">{payment.category} • Connected Account #{payment.accountId}</p>
          </div>
          <div className="flex items-center gap-3">
             <Select value={payment.status} onValueChange={handleStatusChange} disabled={updateMutation.isPending}>
              <SelectTrigger className="w-[140px] h-10 bg-white">
                {updateMutation.isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        
        {/* Left Column: Stats & Actions */}
        <div className="space-y-6">
          <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
            <div className="bg-primary p-6 text-white text-center">
              <div className="text-5xl font-display font-bold mb-2">${payment.amount.toFixed(2)}</div>
              <div className="text-primary-foreground/80 font-medium capitalize">per {payment.frequency}</div>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                <div className="p-4 flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Next Charge</span>
                  <span className="font-medium">{format(new Date(payment.nextChargeDate), 'MMM d, yyyy')}</span>
                </div>
                {payment.lastChargeDate && (
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Last Charge</span>
                    <span className="font-medium">{format(new Date(payment.lastChargeDate), 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="p-4 flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Difficulty</span>
                  <Badge variant="outline" className="capitalize">{payment.cancellationDifficulty}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm bg-blue-50/50 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900"><FileText className="h-5 w-5 text-blue-600" /> Generate Letters</CardTitle>
              <CardDescription className="text-blue-800/70">Create legal requests to force cancellation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/letter-generator?paymentId=${id}&type=email`} className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 h-10 rounded-xl hover:bg-blue-50 font-medium text-sm transition-colors">
                Email Template
              </Link>
              <Link href={`/letter-generator?paymentId=${id}&type=ach`} className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 h-10 rounded-xl hover:bg-blue-50 font-medium text-sm transition-colors">
                ACH Revocation
              </Link>
              <Link href={`/letter-generator?paymentId=${id}&type=stop`} className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 h-10 rounded-xl hover:bg-blue-50 font-medium text-sm transition-colors">
                Stop Payment Form
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Workflow */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-border/50 shadow-sm h-full">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle>Cancellation Guide</CardTitle>
              <CardDescription>Follow these steps carefully to cancel your subscription.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {!workflow ? (
                <div className="text-center py-12 text-slate-500">No guide available.</div>
              ) : (
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-4 mb-6">
                    {workflow.estimatedTime && (
                      <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                        <Clock className="mr-2 h-4 w-4 text-slate-500" /> {workflow.estimatedTime}
                      </div>
                    )}
                    {workflow.cancellationUrl && (
                      <a href={workflow.cancellationUrl} target="_blank" rel="noreferrer" className="flex items-center text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
                        <Globe className="mr-2 h-4 w-4" /> Go to portal
                      </a>
                    )}
                    {workflow.phoneNumber && (
                      <a href={`tel:${workflow.phoneNumber}`} className="flex items-center text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
                        <Phone className="mr-2 h-4 w-4 text-slate-500" /> {workflow.phoneNumber}
                      </a>
                    )}
                  </div>

                  {workflow.tips && workflow.tips.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-900 mb-1">Expert Tips</h4>
                        <ul className="list-disc pl-4 space-y-1 text-sm text-amber-800">
                          {workflow.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="relative border-l-2 border-slate-200 ml-3 pl-8 space-y-8 py-2">
                    {workflow.steps.map((step, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[43px] bg-white border-2 border-primary text-primary font-bold h-8 w-8 rounded-full flex items-center justify-center text-sm shadow-sm">
                          {step.stepNumber}
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h4>
                        <p className="text-slate-600 mb-3">{step.description}</p>
                        {step.actionUrl && (
                          <Button variant="outline" size="sm" className="font-semibold" onClick={() => window.open(step.actionUrl, '_blank')}>
                            Complete Action
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100 flex justify-end">
                    <Button onClick={() => handleStatusChange('cancelled')} className="shadow-md hover:shadow-lg shadow-primary/20">
                      I have successfully cancelled
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}
