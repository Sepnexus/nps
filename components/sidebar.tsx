"use client";

import {
  ArrowLeftRight,
  Bot,
  Briefcase,
  LayoutDashboard,
  Landmark,
  PiggyBank,
  Receipt,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/loans", label: "Loans", icon: Landmark },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/income", label: "Income Sources", icon: PiggyBank },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/entities", label: "Entities", icon: Briefcase },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:bg-card/40">
      <div className="px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs font-bold">V</div>
          Vault
        </Link>
      </div>
      <nav className="flex-1 px-2 pb-4">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items = NAV.slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t bg-card/95 backdrop-blur">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
