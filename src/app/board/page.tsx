import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { WorkshopBoard } from "@/components/board/workshop-board";
import { isOnBoard } from "@/lib/orders/board";
import { todayISO } from "@/lib/utils/date";
import { listOrders } from "@/services/orders/order-service";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const orders = (await listOrders()).filter((order) => isOnBoard(order));

  return (
    <AppShell>
      <PageHeading title="Workshop Board" description="Every order by stage, from new to delivered. Move an order forward when work on it moves on." />
      <WorkshopBoard orders={orders} today={todayISO()} />
    </AppShell>
  );
}
