import { useState } from "react";
import { Layout } from "@/components/layout";
import { useGetBankAccounts, useConnectBankAccount, useDisconnectBankAccount } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, Plus, CreditCard, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetBankAccountsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Accounts() {
  const { data: accounts, isLoading } = useGetBankAccounts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountType, setAccountType] = useState<"checking"|"savings"|"credit">("checking");
  const [lastFour, setLastFour] = useState("");

  const connectMutation = useConnectBankAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() });
        setIsOpen(false);
        setBankName("");
        setLastFour("");
        toast({ title: "Bank account connected successfully" });
      }
    }
  });

  const disconnectMutation = useDisconnectBankAccount({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBankAccountsQueryKey() });
        toast({ title: "Bank account disconnected" });
      }
    }
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    connectMutation.mutate({ data: { bankName, accountType, lastFour } });
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bank Accounts</h1>
          <p className="text-muted-foreground mt-2">Connect accounts to automatically detect subscriptions.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-md shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Connect Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Connect Bank Account</DialogTitle>
              <DialogDescription>
                We use secure, read-only access to scan for recurring payments.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConnect} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input required value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. Chase, Bank of America" />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={accountType} onValueChange={(val: any) => setAccountType(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Last 4 Digits</Label>
                <Input required maxLength={4} value={lastFour} onChange={e => setLastFour(e.target.value)} placeholder="1234" />
              </div>
              <DialogFooter className="pt-4">
                <Button type="submit" disabled={connectMutation.isPending} className="w-full">
                  {connectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Securely Connect"}
                </Button>
              </DialogFooter>
              <div className="text-center text-xs text-slate-500 mt-2 flex items-center justify-center">
                 <ShieldCheck className="h-3 w-3 mr-1 text-emerald-500" /> Bank-level encryption
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : !accounts?.length ? (
        <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <Building className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No accounts connected</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">Connect your checking accounts and credit cards to automatically find hidden subscriptions.</p>
          <Button onClick={() => setIsOpen(true)}>Connect your first account</Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map(account => (
            <Card key={account.id} className="rounded-2xl border-border/50 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => {
                    if (confirm("Disconnect this account?")) {
                      disconnectMutation.mutate({ accountId: account.id });
                    }
                  }}
                >
                  {disconnectMutation.isPending && disconnectMutation.variables?.accountId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-1">{account.bankName}</h3>
                <p className="text-slate-500 font-mono tracking-wider">•••• •••• •••• {account.lastFour}</p>
                
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="capitalize text-slate-600">{account.accountType}</span>
                  <span className="text-slate-400">Added {format(new Date(account.connectedAt), 'MMM yyyy')}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
