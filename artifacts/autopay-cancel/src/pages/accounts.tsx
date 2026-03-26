import { useState, useCallback } from "react";
import { Layout } from "@/components/layout";
import { useGetBankAccounts, useDisconnectBankAccount } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Building, Plus, CreditCard, Trash2, Loader2,
  ShieldCheck, Lock, Zap,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetBankAccountsQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { PlaidLinkButton } from "@/components/plaid-link-button";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Accounts() {
  const { data: accounts, isLoading } = useGetBankAccounts();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const disconnectMutation = useDisconnectBankAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() });
        toast.success("Bank account disconnected.");
      },
    },
  });

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() });
  }, [queryClient]);

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bank Accounts</h1>
          <p className="text-muted-foreground mt-2">
            Connect accounts to automatically detect recurring charges.
          </p>
        </div>
        <PlaidLinkButton
          onSuccess={handleSuccess}
          onStart={() => setConnecting(true)}
          onEnd={() => setConnecting(false)}
        />
      </div>

      {/* Security Trust Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 text-sm">
        <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-blue-800">
          <span className="font-semibold">Read-only access.</span> We use Plaid to securely connect your
          accounts. We can see transactions but <span className="font-semibold">cannot move money</span>.
          Your credentials are never stored on our servers.
        </div>
      </div>

      {/* Connecting overlay */}
      {connecting && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
          <span className="text-amber-800 font-medium">Connecting your bank and scanning for recurring charges…</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : !accounts?.length ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <Building className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No accounts connected yet</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Connect your checking, savings, or credit card accounts to automatically find
            hidden subscriptions and recurring charges.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-6">
            {["Bank of America", "Chase", "Wells Fargo", "Citi", "+12,000 more"].map((bank) => (
              <Badge key={bank} variant="outline" className="text-xs text-slate-500">
                {bank}
              </Badge>
            ))}
          </div>
          <PlaidLinkButton
            onSuccess={handleSuccess}
            onStart={() => setConnecting(true)}
            onEnd={() => setConnecting(false)}
          />
          <div className="flex items-center justify-center gap-1 mt-4 text-xs text-slate-400">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Secured by Plaid — bank-grade encryption
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="rounded-2xl border-border/50 shadow-sm relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => {
                      if (confirm("Disconnect this account? This will remove all detected subscriptions from this account.")) {
                        disconnectMutation.mutate({ accountId: account.id });
                      }
                    }}
                  >
                    {disconnectMutation.isPending &&
                    disconnectMutation.variables?.accountId === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 mb-1">{account.bankName}</h3>
                  <p className="text-slate-500 font-mono tracking-wider">
                    •••• •••• •••• {account.lastFour}
                  </p>
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                    <span className="capitalize text-slate-600">{account.accountType}</span>
                    <span className="text-slate-400">
                      Added {format(new Date(account.connectedAt), "MMM yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add another account card */}
            <div
              className="rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50/50 transition-colors min-h-[200px] group"
              onClick={() => {
                const btn = document.querySelector<HTMLButtonElement>("[data-plaid-connect]");
                if (btn) btn.click();
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">
                Connect another account
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            Subscriptions are automatically detected from your transaction history.
          </div>
        </>
      )}
    </Layout>
  );
}
