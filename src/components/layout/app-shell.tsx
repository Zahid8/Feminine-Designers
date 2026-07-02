import Link from "next/link";
import { Home, ReceiptText, Search, Settings, UserRoundPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo-mark";
import { IndiaClock } from "@/components/shared/india-clock";
import { logoutAction } from "@/app/(auth)/login/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/orders/new", label: "New Order", icon: UserRoundPlus },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings }
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="no-print border-b border-[#eadfce] bg-[#fffdf8]/95 p-4 lg:min-h-screen lg:border-b-0 lg:border-r">
        <LogoMark />
        <nav className="mt-6 grid gap-2 sm:grid-cols-5 lg:grid-cols-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-[#4a3f3a] transition hover:bg-[#f4e7da] hover:text-[#5d1428]"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="no-print sticky top-0 z-10 border-b border-[#eadfce] bg-[#fbf7ef]/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3 rounded-md border border-[#e8dcca] bg-white px-3 py-2 text-sm text-[#7c6d66]">
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">Search by receipt, phone, customer, or order number</span>
            </div>
            <div className="flex items-center gap-2">
              <IndiaClock initialIso={new Date().toISOString()} />
              <Link href="/orders/new">
                <Button>New Order</Button>
              </Link>
              <form action={logoutAction}>
                <Button type="submit" variant="secondary">
                  Log out
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
