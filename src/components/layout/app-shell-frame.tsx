"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, Menu, Plus, ReceiptText, Search, Settings, UserRoundPlus, Users } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo-mark";
import { IndiaClock } from "@/components/shared/india-clock";
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
          "no-print overflow-hidden bg-surface shadow-raised transition-all duration-200 lg:sticky lg:top-0 lg:h-screen lg:rounded-r-3xl",
          sidebarExpanded ? "max-h-[520px] p-4 opacity-100 lg:max-h-none lg:w-[272px]" : "max-h-0 w-0 border-0 p-0 opacity-0"
        )}
      >
        <div className={cn("min-w-[240px] transition-opacity duration-150", sidebarExpanded ? "opacity-100" : "opacity-0")}>
          <div className="rounded-2xl p-2">
            <LogoMark />
          </div>
          <nav className="mt-6 grid gap-2 sm:grid-cols-5 lg:grid-cols-1">
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
        <header className="no-print sticky top-0 z-10 bg-background/85 px-4 py-3 backdrop-blur-md md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 px-3"
                aria-label={sidebarExpanded ? "Hide sidebar" : "Show sidebar"}
                aria-expanded={sidebarExpanded}
                onClick={() => setSidebarExpanded((current) => !current)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              <form action="/orders" method="get" role="search" className="relative min-w-0 max-w-xl flex-1">
                <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  name="q"
                  aria-label="Search orders"
                  placeholder="Search receipt, phone, or customer"
                  className="h-11 w-full rounded-2xl border border-transparent bg-surface-sunken pl-9 pr-3 text-sm text-ink shadow-pressed outline-none transition placeholder:text-muted-soft focus:border-gold focus:bg-surface-strong focus:ring-2 focus:ring-gold/30"
                />
              </form>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-2xl bg-surface px-3 py-2.5 shadow-raised-sm md:inline-flex">
                <IndiaClock />
              </span>
              <ButtonLink href="/orders/new">
                <Plus className="h-4 w-4" />
                New Order
              </ButtonLink>
              <form action={logoutAction}>
                <Button type="submit" variant="secondary" aria-label="Log out">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </form>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
