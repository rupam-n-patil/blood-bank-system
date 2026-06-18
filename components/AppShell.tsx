"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Droplets,
  ClipboardList,
  HeartPulse,
  LogOut,
  Menu,
  X,
  Syringe,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function AppShell({
  title,
  subtitle,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<"admin" | "donor" | "public" | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(data?.role || null);
    };

    loadRole();
  }, []);

  const adminNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Donors", href: "/donors", icon: Users },
    { name: "Inventory", href: "/inventory", icon: Droplets },
    { name: "Requests", href: "/requests", icon: ClipboardList },
    { name: "Donations", href: "/donations", icon: Syringe },
    { name: "Chat", href: "/chat", icon: MessageCircle },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const navItems = role === "admin" ? adminNav : [];

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-rose-500/15 p-3 ring-1 ring-rose-400/20">
            <HeartPulse className="h-6 w-6 text-rose-300" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-wide text-zinc-50">
              Blood Bank
            </h1>
            <p className="text-sm text-zinc-400">Management System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "bg-zinc-100 text-zinc-950 shadow-sm"
                  : "text-zinc-300 hover:bg-white/5 hover:text-zinc-50"
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  active ? "text-rose-700" : "text-zinc-500 group-hover:text-rose-300"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2d1a20_0%,#18181b_28%,#0b0b0d_100%)] text-zinc-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-zinc-950/50 backdrop-blur md:flex">
          {Sidebar}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-72 border-r border-white/10 bg-zinc-950">
              {Sidebar}
            </div>
            <button
              className="flex-1 bg-black/60"
              onClick={() => setMobileOpen(false)}
            />
          </div>
        )}

        <main className="flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/45 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl border border-white/10 bg-white/5 p-2 md:hidden"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>

                <div>
                  <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
                  {subtitle ? (
                    <p className="text-sm text-zinc-400 md:text-base">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="hidden rounded-full border border-rose-300/15 bg-rose-200/10 px-4 py-2 text-sm text-rose-100 md:block">
                Blood operations panel
              </div>
            </div>
          </header>

          <section className="p-4 md:p-8">{children}</section>
        </main>
      </div>
    </div>
  );
}