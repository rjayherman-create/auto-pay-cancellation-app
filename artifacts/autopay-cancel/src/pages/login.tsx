import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login, user, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  if (user) return <Redirect to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login({ email, password });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 border-r border-slate-200 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex items-center gap-2 font-display text-2xl font-bold text-primary mb-8">
            <ShieldCheck className="h-8 w-8" />
            <span>AutoPay Cancel</span>
          </div>
          
          <Card className="border-0 shadow-none p-0">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-base mt-2">
                Sign in to manage and cancel your subscriptions.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white" 
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white" 
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:-translate-y-0.5" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Sign in"}
                </Button>
              </form>
              
              <div className="mt-8 text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link href="/register" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                  Start your 7-day free trial
                </Link>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 text-xs text-slate-500 text-center leading-relaxed">
                <ShieldCheck className="h-4 w-4 mx-auto mb-2 text-blue-400" />
                We provide tools and guidance to help you cancel subscriptions. We are not a service that acts on your behalf.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Abstract aesthetic background"
        />
        <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
      </div>
    </div>
  );
}
