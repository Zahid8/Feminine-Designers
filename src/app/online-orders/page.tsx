import Link from "next/link";
import { Globe } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { OnlineOrderTable } from "@/components/online-orders/online-order-table";
import { hasWebstoreEnv } from "@/lib/webstore/env";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/date";
import { formatINR, rupeesToPaise } from "@/lib/utils/money";
import {
  isOpenOnlineOrder,
  listOnlineOrders,
  needsPaymentCheck,
  orderTypeOf,
  stageLabel,
  WebstoreError,
  type OnlineOrder,
  type OnlineOrderListResult,
  type OnlineOrderStatus,
  type OnlineOrderTypeFilter
} from "@/services/online-orders/online-order-service";

export const dynamic = "force-dynamic";

type OnlineView = "open" | "payment" | "shipped" | "delivered" | "fulfilled" | "all";
const VIEWS: OnlineView[] = ["open", "payment", "shipped", "delivered", "fulfilled", "all"];

function SetupNotice({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="grid gap-3 text-sm leading-6">
        <p className="font-semibold text-wine-ink">Online orders are not connected yet.</p>
        <p className="text-muted-strong">{message}</p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-strong">
          <li>
            On the webstore server set <code className="rounded bg-surface-sunken px-1">WEBSTORE_API_TOKEN</code> (a long random string).
          </li>
          <li>
            Here set <code className="rounded bg-surface-sunken px-1">WEBSTORE_API_URL</code> (e.g. https://shop.example.com) and the same{" "}
            <code className="rounded bg-surface-sunken px-1">WEBSTORE_API_TOKEN</code>, then redeploy.
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}

function sumTotals(orders: OnlineOrder[]) {
  return orders.reduce((sum, order) => sum + rupeesToPaise(Number.parseFloat(order.total) || 0), 0);
}

export default async function OnlineOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string; view?: string }>;
}) {
  const params = await searchParams;
  const selectedView: OnlineView = VIEWS.includes(params.view as OnlineView) ? (params.view as OnlineView) : "open";
  const selectedType: OnlineOrderTypeFilter = params.type === "ready_made" || params.type === "made_to_measure" ? params.type : "All";

  let result: OnlineOrderListResult | null = null;
  let problem: string | null = null;
  if (!hasWebstoreEnv()) {
    problem = "Add the webstore address and API token to this app's environment.";
  } else {
    try {
      result = await listOnlineOrders({ query: params.q, status: params.status as OnlineOrderStatus | "All" | undefined, type: selectedType });
    } catch (error) {
      problem = error instanceof WebstoreError ? error.message : "Unexpected error while loading online orders.";
    }
  }

  const orders = result?.orders ?? [];
  const openOrders = orders.filter(isOpenOnlineOrder);
  const paymentOrders = orders.filter(needsPaymentCheck);
  const shippedOrders = orders.filter((order) => order.status === "shipped");
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const fulfilledOrders = orders.filter((order) => order.status === "completed");
  const viewOrders: Record<OnlineView, OnlineOrder[]> = {
    open: openOrders,
    payment: paymentOrders,
    shipped: shippedOrders,
    delivered: deliveredOrders,
    fulfilled: fulfilledOrders,
    all: orders
  };
  const visibleOrders = viewOrders[selectedView];
  const tabBaseParams = new URLSearchParams();
  if (params.q) tabBaseParams.set("q", params.q);
  if (params.status) tabBaseParams.set("status", params.status);
  if (selectedType !== "All") tabBaseParams.set("type", selectedType);

  function tabHref(view: OnlineView) {
    const nextParams = new URLSearchParams(tabBaseParams);
    if (view !== "open") nextParams.set("view", view);
    return `/online-orders${nextParams.size ? `?${nextParams.toString()}` : ""}`;
  }

  return (
    <AppShell>
      <PageHeading
        title="Online Orders"
        description="Orders placed on the webstore. Confirm payments, then mark each order shipped, delivered and fulfilled; changes save back to the webstore."
        action={
          result ? (
            <p className="inline-flex items-center gap-2 rounded-2xl bg-surface px-3 py-2 text-xs font-semibold text-muted-strong shadow-raised-sm">
              <Globe className="h-4 w-4 text-section-online" aria-hidden />
              Synced {formatDateTime(result.generatedAt)}
            </p>
          ) : null
        }
      />

      {problem ? (
        <SetupNotice message={problem} />
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Open orders", openOrders.length, formatINR(sumTotals(openOrders))],
              ["Payments to verify", paymentOrders.length, formatINR(sumTotals(paymentOrders))],
              ["Custom size", openOrders.filter((order) => orderTypeOf(order) !== "ready_made").length, "open orders to stitch"],
              ["Ready-made", openOrders.filter((order) => orderTypeOf(order) === "ready_made").length, "open orders to pack"]
            ].map(([label, count, detail]) => (
              <Card key={label as string}>
                <CardContent className="py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-label">{label}</p>
                  <p className="mt-1 font-serif text-3xl font-medium text-wine-deep">{count}</p>
                  <p className="text-xs text-muted">{detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-5">
            <CardContent className="grid gap-3 md:grid-cols-[1fr_200px_200px_auto]">
              <Field label="Search">
                <Input name="q" form="online-orders-filter" placeholder="Order number, customer, phone" defaultValue={params.q ?? ""} />
              </Field>
              <Field label="Stage">
                <Select name="status" form="online-orders-filter" defaultValue={params.status ?? "All"}>
                  <option value="All">All</option>
                  {result?.statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {stageLabel(status.value, status.label)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Type">
                <Select name="type" form="online-orders-filter" defaultValue={selectedType}>
                  <option value="All">All orders</option>
                  <option value="ready_made">Ready-made only</option>
                  <option value="made_to_measure">Has custom size</option>
                </Select>
              </Field>
              <form id="online-orders-filter" className="flex items-end">
                {selectedView !== "open" ? <input type="hidden" name="view" value={selectedView} /> : null}
                <Button type="submit">Apply</Button>
              </form>
            </CardContent>
          </Card>

          <nav aria-label="Online order lists" className="mb-5 inline-flex flex-wrap gap-1 rounded-2xl bg-surface-sunken p-1.5 shadow-pressed">
            {[
              ["open", "Open", openOrders.length],
              ["payment", "Payments to Verify", paymentOrders.length],
              ["shipped", "Shipped", shippedOrders.length],
              ["delivered", "Delivered", deliveredOrders.length],
              ["fulfilled", "Fulfilled", fulfilledOrders.length],
              ["all", "All", orders.length]
            ].map(([view, label, count]) => (
              <Link
                key={view}
                href={tabHref(view as OnlineView)}
                aria-current={selectedView === view ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                  selectedView === view ? "bg-gradient-to-br from-wine to-rose text-white shadow-brand" : "text-ink-soft hover:bg-surface hover:text-wine"
                )}
              >
                {label}
                <span className={cn("rounded-full px-2 py-0.5 text-xs", selectedView === view ? "bg-white/20" : "bg-surface")}>{count}</span>
              </Link>
            ))}
          </nav>

          <OnlineOrderTable orders={visibleOrders} />
          {result?.hasMore ? <p className="mt-3 text-xs text-muted">Showing the 200 most recent orders. Use search to find older ones.</p> : null}
        </>
      )}
    </AppShell>
  );
}
