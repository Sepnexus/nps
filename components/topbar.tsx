"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/transactions": "Transactions",
  "/accounts": "Accounts",
  "/loans": "Loans",
  "/investments": "Investments",
  "/goals": "Goals",
  "/income": "Income Sources",
  "/receipts": "Receipts",
  "/assistant": "AI Assistant",
  "/entities": "Entities",
};

export function Topbar() {
  const pathname = usePathname();
  const title = Object.entries(TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? "Vault";
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/70 backdrop-blur px-4 md:px-6">
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <Button size="sm" asChild>
          <Link href="/transactions/new">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Add transaction</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
