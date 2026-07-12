import { redirect } from "next/navigation";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { MobileTopbar } from "@/components/topbar";
import { getSessionUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar userName={user.displayName ?? ""} userEmail={user.email} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileTopbar userName={user.displayName ?? ""} userEmail={user.email} />
        <main className="flex-1 px-5 md:px-8 py-6 md:py-8 pb-24 md:pb-10 max-w-[1180px] w-full mx-auto anim-fadeup">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
