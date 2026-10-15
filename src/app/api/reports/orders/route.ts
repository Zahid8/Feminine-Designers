import { buildReportModel, resolveReportRange } from "@/lib/reports/report-model";
import { ordersToCsv } from "@/lib/reports/orders-csv";
import { todayISO } from "@/lib/utils/date";
import { listOrders } from "@/services/orders/order-service";

export async function GET(request: Request) {
  const today = todayISO();
  const range = resolveReportRange(new URL(request.url).searchParams.get("range") ?? undefined, today);
  const model = buildReportModel(await listOrders(), range, today);
  const name = `orders-${range.from || "all"}-to-${range.to}.csv`;
  return new Response("﻿" + ordersToCsv(model.orders), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store"
    }
  });
}
