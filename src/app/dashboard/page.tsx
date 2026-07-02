import Link from "next/link";
import { InteractiveDashboard } from "@/components/dashboard/interactive-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { buildDashboardModel } from "@/lib/dashboard/dashboard-model";
import { todayISO } from "@/lib/utils/date";
import { listOrders } from "@/services/orders/order-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const orders = await listOrders();
  const model = buildDashboardModel(orders, todayISO());

  return (
    <AppShell>
      <PageHeading
        title="Dashboard"
        description="Interactive workbench for orders, deliveries, collections, and balances."
        action={
          <Link href="/orders/new">
            <Button>New Order</Button>
          </Link>
        }
      />
      <InteractiveDashboard model={model} />
    </AppShell>
  );
}
