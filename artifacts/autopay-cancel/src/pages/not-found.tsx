import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50">
      <ShieldCheck className="h-16 w-16 text-slate-300 mb-6" />
      <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">404</h1>
      <p className="text-lg text-slate-600 mb-8">This page could not be found.</p>
      <Link href="/dashboard">
        <Button size="lg" className="shadow-lg shadow-primary/20">Return to Dashboard</Button>
      </Link>
    </div>
  );
}
