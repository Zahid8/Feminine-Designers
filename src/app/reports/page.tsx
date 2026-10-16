import Link from "next/link";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { CollectionsChart, GarmentMixChart } from "@/components/reports/report-charts";
import { Card, CardContent } from "@/components/ui/card";
import { buttonBaseClass, buttonVariantClasses } from "@/components/ui/button";
import { REPORT_RANGES, buildReportModel, resolveReportRange } from "@/lib/reports/report-model";
import { cn } from "@/lib/utils/cn";
import { formatDate, todayISO } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";
import { listOrders } from "@/services/orders/order-service";

export const dynamic = "force-dynamic";

const wholeRupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const formatWhole = (paise: number) => wholeRupees.format(Math.round(paise / 100));

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const today = todayISO();
  const range = resolveReportRange(rangeParam, today);
  const model = buildReportModel(await listOrders(), range, today);
  const rangeText = range.from ? (range.from === range.to ? formatDate(range.from) : `${formatDate(range.from)} – ${formatDate(range.to)}`) : "All time";

  return (
    <AppShell>
      <PageHeading
        title="Reports"
        description={`Sales, collections, and garments for ${rangeText}.`}
        action={
          <a href={`/api/reports/orders?range=${range.id}`} className={cn(buttonBaseClass, buttonVariantClasses.secondary)} download>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </a>
        }
      />

      <nav aria-label="Report period" className="mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-surface-sunken p-1.5 shadow-pressed">
        {REPORT_RANGES.map((option) => (
          <Link
            key={option.id}
            href={`/reports?range=${option.id}`}
            aria-current={option.id === range.id ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center rounded-xl px-4 text-sm font-semibold transition",
              option.id === range.id ? "bg-gradient-to-br from-wine to-rose text-white shadow-brand" : "text-ink-soft hover:bg-surface hover:text-wine"
            )}
          >
            {option.label}
          </Link>
        ))}
      </nav>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_2fr]">
        <Card>
          <CardContent className="grid h-full content-center gap-2">
            <p className="text-sm font-semibold text-muted-strong">Money collected</p>
            <p className="text-4xl font-semibold tabular-nums text-wine-ink sm:text-5xl">{formatWhole(model.collectedPaise)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {model.collectedByMethod.length === 0 ? (
                <span className="text-sm text-muted">No payments in this period.</span>
              ) : (
                model.collectedByMethod.map((entry) => (
                  <span key={entry.method} className="rounded-xl bg-surface-sunken px-3 py-1.5 text-sm shadow-pressed">
                    <strong className="tabular-nums text-wine-ink">{formatINR(entry.amountPaise)}</strong>
                    <span className="ml-1.5 text-muted">
                      {entry.method} · {entry.count}
                    </span>
                  </span>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            ["Orders taken", String(model.ordersCount), "Created in this period"],
            ["Billed value", formatWhole(model.billedPaise), "Grand total of those orders"],
            ["Average order", formatWhole(model.averageOrderPaise), "Billed ÷ orders"],
            ["Outstanding now", formatWhole(model.outstandingPaise), `${model.outstandingOrders} orders with money due`]
          ].map(([label, value, hint]) => (
            <div key={label} className="rounded-2xl border border-white/70 bg-surface p-4 shadow-raised">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">{label}</p>
              <p className="mt-1.5 text-xl font-bold tabular-nums text-wine-ink sm:text-2xl">{value}</p>
              <p className="mt-1 text-xs text-muted">{hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardContent>
            <CollectionsChart buckets={model.collections} grouping={model.collectionsGrouping} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <GarmentMixChart buckets={model.garmentMix} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-3 font-serif text-xl font-medium text-wine-deep">Top customers this period</h2>
          {model.topCustomers.length === 0 ? (
            <p className="text-sm text-muted">No orders in this period.</p>
          ) : (
            <div className="max-h-96 overflow-auto overscroll-contain [scrollbar-width:thin]">
              <table className="w-full min-w-[32rem] text-sm">
                <thead className="sticky top-0 z-10 bg-surface text-left text-xs uppercase text-muted-strong">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Customer</th>
                    <th className="py-2 pr-3 text-right font-semibold">Orders</th>
                    <th className="py-2 pr-3 text-right font-semibold">Billed</th>
                    <th className="py-2 text-right font-semibold">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {model.topCustomers.map((customer) => (
                    <tr key={customer.customerId}>
                      <td className="py-2 pr-3">
                        <Link href={`/customers/${customer.customerId}`} className="font-semibold text-wine-ink hover:text-rose">
                          {customer.name}
                        </Link>
                        <span className="ml-2 text-xs text-muted">{customer.phone}</span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{customer.orders}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatINR(customer.billedPaise)}</td>
                      <td className={cn("py-2 text-right tabular-nums", customer.duePaise > 0 ? "font-semibold text-wine" : "text-success")}>
                        {customer.duePaise > 0 ? formatINR(customer.duePaise) : "Settled"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
