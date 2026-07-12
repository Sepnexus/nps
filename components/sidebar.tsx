"use client";

import {
  ArrowLeftRight,
  Bot,
  LayoutDashboard,
  Landmark,
  PiggyBank,
  Plus,
  Receipt,
  Settings,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Money",
    items: [
      { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
      { href: "/accounts", label: "Accounts", icon: Wallet },
      { href: "/income", label: "Income Sources", icon: PiggyBank },
      { href: "/receipts", label: "Receipts", icon: Receipt },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/loans", label: "Loans", icon: Landmark },
      { href: "/investments", label: "Investments", icon: TrendingUp },
      { href: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/assistant", label: "AI Assistant", icon: Bot },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname = usePathname();
  const initials = (userName || userEmail)
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="hidden md:flex md:w-[246px] md:flex-shrink-0 md:h-dvh md:sticky md:top-0 md:flex-col border-r border-border bg-cream px-4 pt-6 pb-4">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 pb-1">
        <div className="w-[31px] h-[31px] rounded-[9px] bg-dark-panel flex items-center justify-center rotate-45 flex-shrink-0">
          <div className="w-[11px] h-[11px] bg-amber rounded-[2px]" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-serif text-[25px] tracking-[0.01em]">Vault</span>
          <span className="font-mono text-[8.5px] tracking-[0.2em] text-muted-foreground mt-[3px]">FINANCE OS</span>
        </div>
      </Link>

      <nav className="flex flex-col gap-4 mt-6 flex-1 overflow-y-auto scrollbar-hide">
        {GROUPS.map((g) => (
          <div key={g.label} className="flex flex-col gap-0.5">
            <div className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-muted-foreground px-2.5 pb-1">
              {g.label}
            </div>
            {g.items.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] px-2.5 py-[9px] text-[13.5px] transition-colors",
                    active
                      ? "bg-white text-foreground font-semibold shadow-[0_1px_0_rgba(33,29,24,0.05)]"
                      : "text-foreground/75 hover:bg-[rgba(33,29,24,0.045)]",
                  )}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <Link
        href="/transactions/new"
        className="mt-4 flex items-center justify-center gap-2 rounded-[13px] bg-dark-panel text-dark-panel-foreground py-[11px] text-[13.5px] font-semibold hover:brightness-110 transition"
      >
        <Plus className="w-[17px] h-[17px]" />
        Add transaction
      </Link>

      <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 pl-1.5">
        <div className="w-9 h-9 rounded-full bg-[#E7DECE] flex items-center justify-center font-mono text-[12px] font-bold text-muted-foreground flex-shrink-0">
          {initials || "V"}
        </div>
        <div className="min-w-0 leading-[1.3]">
          <div className="text-[13.5px] font-semibold truncate">{userName || "Vault user"}</div>
          <div className="text-[11px] text-muted-foreground truncate">{userEmail}</div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const items: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
    { href: "/transactions/new", label: "Add", icon: Plus },
    { href: "/accounts", label: "Accounts", icon: Wallet },
    { href: "/assistant", label: "Assist", icon: Bot },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-[rgba(244,240,233,0.95)] backdrop-blur">
      <div className="grid grid-cols-5">
        {items.map((item, i) => {
          const active =
            pathname === item.href ||
            (item.href !== "/transactions/new" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon;
          const isAdd = i === 2;
          return (
            <Link
              key={item.href + i}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-mono tracking-wider",
                isAdd
                  ? "text-primary font-bold"
                  : active
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground",
              )}
            >
              <Icon className={cn("w-5 h-5", isAdd && "w-6 h-6")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
