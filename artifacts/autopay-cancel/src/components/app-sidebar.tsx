import { Link, useLocation } from "wouter";
import { LayoutDashboard, List, Building, FileText, Settings, ShieldCheck, ShieldAlert } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Subscriptions", url: "/subscriptions", icon: List },
  { title: "Bank Accounts", url: "/accounts", icon: Building },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Bank Stop Payments", url: "/dashboard/disputes", icon: ShieldAlert },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  return (
    <Sidebar className="border-r border-border/50 bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-6 border-b border-border/50 justify-center flex-row">
         <div className="flex items-center gap-2 font-display text-lg font-bold text-primary w-full">
           <ShieldCheck className="h-6 w-6" />
           <span>AutoPay Cancel</span>
         </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isActive = location === item.url || (item.url !== '/dashboard' && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className={`rounded-xl h-10 px-3 transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5 mr-3" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
