import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  CreditCard,
  FolderLock,
  LayoutDashboard,
  Settings,
  ShieldAlert,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { label: "Disputes", href: "/disputes", icon: ShieldAlert },
  { label: "Evidence Vault", href: "/evidence-vault", icon: FolderLock },
  { label: "Continued Charges", href: "/continued-charges", icon: AlertTriangle },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  
  return (
    <Sidebar className="border-r border-zinc-800 bg-zinc-950 text-zinc-100">
      <SidebarHeader className="border-b border-zinc-800 p-6">
        <h1 className="text-2xl font-bold leading-tight text-white">
          Recurring Charge Protection
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Organize, track, and dispute recurring charges.
        </p>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroupContent>
          <SidebarMenu className="space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location === item.href ||
                (item.href !== "/dashboard" && location.startsWith(item.href));
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={`h-12 rounded-xl px-4 transition-all duration-200 ${
                      isActive
                        ? "bg-white text-black hover:bg-white hover:text-black"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <Link href={item.href}>
                      <Icon className="mr-3 h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>
    </Sidebar>
  );
}
