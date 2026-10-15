"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, Menu, Plus, ReceiptText, Settings, UserRoundPlus, Users } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo-mark";
import { IndiaClock } from "@/components/shared/india-clock";
import { GlobalSearch } from "@/components/layout/global-search";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/orders/new", label: "New Order", icon: UserRoundPlus },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings }
];

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
    <div className={cn("min-h-screen transition-[grid-template-columns] duration-200 lg:grid", sidebarExpanded ? "lg:grid-cols-[272px_1fr]" : "lg:grid-cols-[0_1fr]")}>
      <aside
        aria-label="Primary navigation"
        className={cn(
          "no-print hidden overflow-hidden bg-surface shadow-raised transition-all duration-200 lg:sticky lg:top-0 lg:block lg:h-screen lg:rounded-r-3xl",
          sidebarExpanded ? "p-4 opacity-100 lg:w-[272px]" : "w-0 border-0 p-0 opacity-0"
        )}
      >
        <div className={cn("min-w-[240px] transition-opacity duration-150", sidebarExpanded ? "opacity-100" : "opacity-0")}>
          <div className="rounded-2xl p-2">
            <LogoMark />
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
                    active ? "bg-surface-sunken text-wine shadow-pressed" : "text-ink-soft hover:bg-surface-strong hover:text-wine hover:shadow-raised-sm"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition",
                      active ? "bg-gradient-to-br from-wine to-rose text-white shadow-brand" : "bg-surface text-wine shadow-raised-sm group-hover:text-rose"
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
        <main className="page-enter px-3 pb-28 pt-4 sm:px-4 md:px-8 md:pt-6 lg:pb-10">
          {children}
        </main>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(146,104,78,0.16)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5 items-end">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const primary = item.href === "/orders/new";
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-semibold transition",
                    primary ? "text-wine" : active ? "text-wine" : "text-muted-strong"
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
  );
}
