"use client";

import Link from "next/link";

export function MobileTopbar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const initials = (userName || userEmail)
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[rgba(244,240,233,0.88)] backdrop-blur border-b border-border">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-[26px] h-[26px] rounded-[8px] bg-dark-panel flex items-center justify-center rotate-45">
          <div className="w-[9px] h-[9px] bg-amber rounded-[2px]" />
        </div>
        <span className="font-serif text-[22px]">Vault</span>
      </Link>
      <div className="w-[34px] h-[34px] rounded-full bg-[#E7DECE] flex items-center justify-center font-mono text-[11px] font-bold text-muted-foreground">
        {initials || "V"}
      </div>
    </header>
  );
}
