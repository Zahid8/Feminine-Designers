"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartColumn, Home, LogOut, Menu, Plus, ReceiptText, Settings, UserRoundPlus, Users } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo-mark";
import { IndiaClock } from "@/components/shared/india-clock";
import { PageTransition } from "@/components/shared/page-transition";
import { GlobalSearch } from "@/components/layout/global-search";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { ToastProvider } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, accent: "bg-section-dashboard", text: "text-section-dashboard" },
  { href: "/orders", label: "Orders", icon: ReceiptText, accent: "bg-section-orders", text: "text-section-orders" },
  { href: "/orders/new", label: "New Order", icon: UserRoundPlus, accent: "bg-section-new", text: "text-section-new" },
  { href: "/customers", label: "Customers", icon: Users, accent: "bg-section-customers", text: "text-section-customers" },
  { href: "/reports", label: "Reports", icon: ChartColumn, accent: "bg-section-reports", text: "text-section-reports" },
  { href: "/settings", label: "Settings", icon: Settings, accent: "bg-section-settings", text: "text-section-settings" }
];

// Phones and tablets: five tabs; Settings is the header gear button.
const mobileNavItems = navItems.filter((item) => item.href !== "/settings");

function isActivePath(pathname: string, href: string) {
  if (href === "/orders") return pathname === "/orders" || (pathname.startsWith("/orders/") && !pathname.startsWith("/orders/new"));
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShellFrame({
  children,
  logoutAction
}: {
  children: React.ReactNode;
  logoutAction: () => void | Promise<void>;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const pathname = usePathname() ?? "";

  return (
    <ToastProvider>
      <div className={cn("min-h-screen transition-[grid-template-columns] duration-200 lg:grid", sidebarExpanded ? "lg:grid-cols-[272px_1fr]" : "lg:grid-cols-[0_1fr]")}>
        <aside
          aria-label="Primary navigation"
          className={cn(
            "no-print hidden overflow-hidden bg-gradient-to-b from-wine-deep via-wine-ink to-wine shadow-raised transition-all duration-200 lg:sticky lg:top-0 lg:block lg:h-screen lg:rounded-r-3xl",
            sidebarExpanded ? "p-4 opacity-100 lg:w-[272px]" : "w-0 border-0 p-0 opacity-0"
          )}
        >
          <div className={cn("min-w-[240px] transition-opacity duration-150", sidebarExpanded ? "opacity-100" : "opacity-0")}>
            <div className="rounded-2xl p-2">
              <LogoMark onDark />
            </div>
            <nav className="mt-6 grid gap-2">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition duration-150",
                      active ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" : "text-white/75 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition",
                        item.accent,
                        "text-white shadow-[0_4px_10px_rgba(0,0,0,0.25)]",
                        active ? "ring-2 ring-gold-soft" : "opacity-85 group-hover:opacity-100"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="min-w-0">
          <header className="no-print sticky top-0 z-20 bg-background/85 px-3 py-2.5 backdrop-blur-md sm:px-4 md:px-8 md:py-3">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                <Link href="/dashboard" aria-label="Dashboard" className="shrink-0 lg:hidden">
                  <LogoMark compact iconOnly />
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  className="hidden min-h-11 px-3 lg:inline-flex"
                  aria-label={sidebarExpanded ? "Hide sidebar" : "Show sidebar"}
                  aria-expanded={sidebarExpanded}
                  onClick={() => setSidebarExpanded((current) => !current)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <GlobalSearch />
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-2xl bg-surface px-3 py-2.5 shadow-raised-sm md:inline-flex">
                  <IndiaClock />
                </span>
                <KeyboardShortcuts />
                <Link
                  href="/settings"
                  aria-label="Settings"
                  aria-current={isActivePath(pathname, "/settings") ? "page" : undefined}
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-xl transition lg:hidden",
                    isActivePath(pathname, "/settings") ? "bg-surface-sunken text-wine shadow-pressed" : "bg-surface text-muted-strong shadow-raised-sm"
                  )}
                >
                  <Settings className="h-4 w-4" aria-hidden />
                </Link>
                <ButtonLink href="/orders/new" className="hidden lg:inline-flex">
                  <Plus className="h-4 w-4" />
                  New Order
                </ButtonLink>
                <form action={logoutAction}>
                  <Button type="submit" variant="secondary" aria-label="Log out" className="px-3 sm:px-4">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Log out</span>
                  </Button>
                </form>
              </div>
            </div>
          </header>
          <main className="px-3 pb-28 pt-4 sm:px-4 md:px-8 md:pt-6 lg:pb-10">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        <nav
          aria-label="Mobile navigation"
          className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(146,104,78,0.16)] backdrop-blur-md lg:hidden"
        >
          <ul className="mx-auto grid max-w-xl grid-cols-5 items-end">
            {mobileNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              const primary = item.href === "/orders/new";
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition",
                      primary ? "text-wine" : active ? item.text : "text-muted-strong"
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center rounded-2xl transition",
                        primary
                          ? "-mt-6 h-14 w-14 bg-gradient-to-br from-wine to-rose text-white shadow-brand ring-4 ring-background"
                          : active
                            ? "h-8 w-12 bg-surface-sunken shadow-pressed"
                            : "h-8 w-12"
                      )}
                    >
                      <item.icon className={primary ? "h-6 w-6" : "h-5 w-5"} aria-hidden />
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </ToastProvider>
  );
}
