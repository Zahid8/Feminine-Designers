import { InteractiveDashboard } from "@/components/dashboard/interactive-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { buildDashboardModel } from "@/lib/dashboard/dashboard-model";
import { formatLongDay, indiaGreeting, todayISO } from "@/lib/utils/date";
import { listOrders } from "@/services/orders/order-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const orders = await listOrders();
  const model = buildDashboardModel(orders, todayISO());

  return (
    <AppShell>
      <PageHeading
        title={indiaGreeting()}
        description={`${formatLongDay()} · Tap a card to see the matching orders.`}
        action={
          <ButtonLink href="/orders/new" className="hidden lg:inline-flex">New Order</ButtonLink>
        }
      />
      <InteractiveDashboard model={model} />
    </AppShell>
  );
}
