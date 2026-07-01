import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { SummaryGrid } from "@/components/dashboard/summary-grid";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderTable } from "@/components/orders/order-table";
import { getDashboardSummary, getOrdersWithOverdueMeta } from "@/lib/data/mock";
import { getOrdersDueToday, getRecentOrders, getUpcomingDeliveries } from "@/services/orders/order-service";
import { formatDate } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";

export default async function DashboardPage() {
  const [dueToday, upcoming, recent] = await Promise.all([getOrdersDueToday(), getUpcomingDeliveries(), getRecentOrders()]);
  const overdue = getOrdersWithOverdueMeta().filter((order) => order.overdue);
  return (
    <AppShell>
      <PageHeading
        title="Dashboard"
        description="Counter view for today's deliveries, pending balances, and order activity."
        action={
          <Link href="/orders/new">
            <Button>New Order</Button>
          </Link>
        }
      />
      <div className="grid gap-5">
        <SummaryGrid summary={getDashboardSummary()} />
        <div className="grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTable orders={dueToday} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {upcoming.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="rounded-md border border-[#eadfce] p-3">
                  <p className="font-semibold text-[#4c1525]">{order.customer.fullName}</p>
                  <p className="text-sm text-[#7c6d66]">
                    {order.receiptNumber} · {formatDate(order.deliveryDate)} · {formatINR(order.totals.balanceDuePaise)}
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
        {overdue.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Overdue Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTable orders={overdue} />
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTable orders={recent} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
