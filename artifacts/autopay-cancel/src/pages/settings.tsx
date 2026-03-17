import { Layout } from "@/components/layout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

export default function Settings() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your profile and preferences.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="shadow-sm border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Profile Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                {user.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{user.name}</div>
                <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" /> {user.email}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500 pl-1">
              <Calendar className="h-4 w-4" /> Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl">Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-slate-900">AutoPay Cancel Pro</span>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 capitalize">{user.subscriptionStatus}</Badge>
                </div>
                {user.trialEndsAt && user.subscriptionStatus === 'trial' && (
                  <p className="text-sm text-slate-500">
                    Trial ends on {format(new Date(user.trialEndsAt), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800">
                You have full access to detection algorithms, document generation, and step-by-step cancellation workflows.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 rounded-2xl border-red-100">
          <CardHeader>
            <CardTitle className="text-xl text-red-600">Danger Zone</CardTitle>
            <CardDescription>Destructive actions for your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between pt-2">
               <div>
                 <div className="font-medium text-slate-900">Sign Out</div>
                 <div className="text-sm text-slate-500">Sign out of your account on this device.</div>
               </div>
               <Button variant="outline" onClick={() => logout()}>Sign Out</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
