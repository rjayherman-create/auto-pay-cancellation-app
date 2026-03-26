import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Register() {
  const { register, user, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  if (user) return <Redirect to="/onboarding" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await register({ name, email, password });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50">
      <div className="hidden lg:flex flex-col justify-center relative w-0 flex-1 bg-primary text-white p-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           <img src={`${import.meta.env.BASE_URL}images/auth-bg.png`} alt="" className="w-full h-full object-cover mix-blend-overlay" />
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-2 font-display text-3xl font-bold mb-12">
            <ShieldCheck className="h-10 w-10 text-blue-200" />
            <span>AutoPay Cancel</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-6">Take back control of your spending.</h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">Start your 7-day free trial today and instantly see how much you could save by cancelling unwanted subscriptions.</p>
          
          <ul className="space-y-4">
            {["Detect hidden recurring charges", "Step-by-step cancellation guides", "Generate legal revocation documents", "Track your total savings"].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-lg text-blue-50">
                <CheckCircle2 className="h-6 w-6 text-blue-300 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 bg-white">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-sm lg:w-96">
          <Card className="border-0 shadow-none p-0">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-3xl font-bold text-slate-900 tracking-tight">Create an account</CardTitle>
              <CardDescription className="text-base mt-2">
                Start your 7-day free trial. No credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0 mt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    required 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white" 
                    placeholder="Jane Doe"
                  />
                </div>
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
                  <Label htmlFor="password">Password (min 8 chars)</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white" 
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:-translate-y-0.5" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Start Free Trial"}
                </Button>
              </form>
              
              <div className="mt-8 text-center text-sm text-slate-600">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
