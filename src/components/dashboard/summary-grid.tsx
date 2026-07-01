import type { DashboardSummary } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils/money";

const labels = [
  ["Orders Today", "ordersToday"],
  ["Deliveries Today", "deliveriesToday"],
  ["Pending Orders", "pendingOrders"],
  ["Overdue Orders", "overdueOrders"],
  ["Collected Today", "amountCollectedTodayPaise"],
  ["Outstanding", "totalOutstandingPaise"]
] as const;

export function SummaryGrid({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {labels.map(([label, key]) => {
        const value = summary[key];
        const display = key.endsWith("Paise") ? formatINR(Number(value)) : String(value);
        return (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7c6d66]">{label}</p>
              <p className="mt-2 text-2xl font-bold text-[#4c1525]">{display}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
