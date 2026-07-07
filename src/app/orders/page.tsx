import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { OrderTable } from "@/components/orders/order-table";
import { listOrders } from "@/services/orders/order-service";
import { isCompletedOrderForList, isPastOrderForList } from "@/lib/calculations/status";
import { cn } from "@/lib/utils/cn";
import { todayISO } from "@/lib/utils/date";

type OrdersView = "current" | "past" | "completed";

export default async function OrdersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; view?: string }>;
}) {
  const params = await searchParams;
  const orders = await listOrders({ query: params.q, status: params.status as never });
  const today = todayISO();
  const selectedView: OrdersView = params.view === "past" || params.view === "completed" ? params.view : "current";
  const completedOrders = orders.filter(isCompletedOrderForList);
  const pastOrders = orders.filter((order) => isPastOrderForList(order, today));
  const currentOrders = orders.filter((order) => !isCompletedOrderForList(order) && !isPastOrderForList(order, today));
  const visibleOrders = selectedView === "completed" ? completedOrders : selectedView === "past" ? pastOrders : currentOrders;
  const tabBaseParams = new URLSearchParams();
  if (params.q) tabBaseParams.set("q", params.q);
  if (params.status) tabBaseParams.set("status", params.status);

  function tabHref(view: OrdersView) {
    const nextParams = new URLSearchParams(tabBaseParams);
    if (view !== "current") nextParams.set("view", view);
    return `/orders${nextParams.size ? `?${nextParams.toString()}` : ""}`;
  }

  return (
    <AppShell>
      <PageHeading
        title="Orders"
        description="Search by receipt number, customer name, or phone number. Filters are ready for server-side Supabase queries."
        action={
          <Link href="/orders/new">
            <Button>New Order</Button>
          </Link>
        }
      />
      <Card className="mb-5">
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Field label="Search">
            <Input name="q" form="orders-filter" placeholder="Receipt, phone, customer" defaultValue={params.q ?? ""} />
          </Field>
          <Field label="Status">
            <select
              name="status"
              form="orders-filter"
              className="h-10 rounded-md border border-[#dfc5a8] bg-white/95 px-3 text-sm outline-none focus:border-[#d99a62] focus:ring-2 focus:ring-[#d99a62]/30"
              defaultValue={params.status ?? "All"}
            >
              {["All", "Draft", "New", "In Stitching", "Ready", "Delivered", "Cancelled"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
          <form id="orders-filter" className="flex items-end">
            {selectedView !== "current" ? <input type="hidden" name="view" value={selectedView} /> : null}
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["current", "Current Orders", currentOrders.length],
          ["past", "Past Orders", pastOrders.length],
          ["completed", "Completed Orders", completedOrders.length]
        ].map(([view, label, count]) => (
          <Link
            key={view}
            href={tabHref(view as OrdersView)}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold",
              selectedView === view
                ? "border-[#7d1f36] bg-[#7d1f36] text-white"
                : "border-[#dfc5a8] bg-white/95 text-[#2c2522] hover:border-[#d99a62] hover:bg-[#fff5ea]"
            )}
          >
            {label}
            <span className={selectedView === view ? "text-white/80" : "text-[#7c6d66]"}>{count}</span>
          </Link>
        ))}
      </div>
      <OrderTable orders={visibleOrders} />
    </AppShell>
  );
}
