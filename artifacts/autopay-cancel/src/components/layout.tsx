import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasterDisclaimer } from "@/components/MasterDisclaimer";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/sign-in" />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-slate-50">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">
                {user.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title="Sign Out"
                className="text-slate-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
            <div className="mt-8">
              <MasterDisclaimer />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
