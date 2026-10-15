import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
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
        description="Search by receipt number, customer name, or phone number, and filter by order stage."
        action={
          <ButtonLink href="/orders/new">New Order</ButtonLink>
        }
      />
      <Card className="mb-5">
        <CardContent className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Field label="Search">
            <Input name="q" form="orders-filter" placeholder="Receipt, phone, customer" defaultValue={params.q ?? ""} />
          </Field>
          <Field label="Status">
            <Select name="status" form="orders-filter" defaultValue={params.status ?? "All"}>
              {["All", "Draft", "New", "In Stitching", "Ready", "Delivered", "Cancelled"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </Field>
          <form id="orders-filter" className="flex items-end">
            {selectedView !== "current" ? <input type="hidden" name="view" value={selectedView} /> : null}
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>
      <nav aria-label="Order lists" className="mb-5 inline-flex flex-wrap gap-1 rounded-2xl bg-surface-sunken p-1.5 shadow-pressed">
        {[
          ["current", "Current Orders", currentOrders.length],
          ["past", "Past Orders", pastOrders.length],
          ["completed", "Completed Orders", completedOrders.length]
        ].map(([view, label, count]) => (
          <Link
            key={view}
            href={tabHref(view as OrdersView)}
            aria-current={selectedView === view ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              selectedView === view ? "bg-gradient-to-br from-wine to-rose text-white shadow-brand" : "text-ink-soft hover:bg-surface hover:text-wine"
            )}
          >
            {label}
            <span className={cn("rounded-full px-2 py-0.5 text-xs", selectedView === view ? "bg-white/20 text-white" : "bg-surface text-muted")}>{count}</span>
          </Link>
        ))}
      </nav>
      <OrderTable orders={visibleOrders} />
    </AppShell>
  );
}
