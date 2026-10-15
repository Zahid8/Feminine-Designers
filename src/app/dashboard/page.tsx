import { InteractiveDashboard } from "@/components/dashboard/interactive-dashboard";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { ChartColumn } from "lucide-react";
import { buildDashboardModel } from "@/lib/dashboard/dashboard-model";
import { formatLongDay, indiaGreeting, todayISO } from "@/lib/utils/date";
import { listOrders } from "@/services/orders/order-service";
import { isOnBoard } from "@/lib/orders/board";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [{ view }, orders] = await Promise.all([searchParams, listOrders()]);
  const model = buildDashboardModel(orders, todayISO());

  return (
    <AppShell>
      <PageHeading
        title={indiaGreeting()}
        description={`${formatLongDay()} · Tap a card to see the matching orders.`}
        action={
          <div className="flex gap-2">
            <ButtonLink href="/reports" variant="secondary">
              <ChartColumn className="h-4 w-4" aria-hidden />
              Reports
            </ButtonLink>
            <ButtonLink href="/orders/new" className="hidden lg:inline-flex">New Order</ButtonLink>
          </div>
        }
      />
      <InteractiveDashboard model={model} boardOrders={orders.filter((order) => isOnBoard(order))} initialWorkView={view === "list" ? "list" : "board"} />
    </AppShell>
  );
}
