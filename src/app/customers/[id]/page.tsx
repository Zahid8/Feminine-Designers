import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { OrderTable } from "@/components/orders/order-table";
import { getCustomerProfile } from "@/services/customers/customer-service";
import { formatINR } from "@/lib/utils/money";
import { formatDate, todayISO } from "@/lib/utils/date";
import { initialsFor } from "@/lib/utils/initials";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCustomerProfile(id);
  if (!profile) notFound();
  const orderDates = profile.orders.map((order) => order.orderDate).sort();
  const firstOrderDate = orderDates[0];
  const lastOrderDate = orderDates.at(-1);
  const lifetimePaise = profile.orders.reduce((sum, order) => sum + order.totals.grandTotalPaise, 0);
  return (
    <AppShell>
      <PageHeading
        title={profile.customer.fullName}
        description={`${profile.customer.phonePrimary} · Prefers ${profile.customer.preferredCommunication}`}
        action={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/customers/${id}/measurements`} variant="secondary">Measurements</ButtonLink>
            <ButtonLink href="/orders/new">Create New Order</ButtonLink>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-peach to-gold-soft text-lg font-bold text-wine shadow-raised-sm"
            >
              {initialsFor(profile.customer.fullName)}
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate">{profile.customer.fullName}</CardTitle>
              <p className="text-sm text-muted">Customer since {formatDate(firstOrderDate ?? profile.customer.createdAt.slice(0, 10))}</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <dl className="grid grid-cols-2 gap-3">
              {[
                ["Orders", String(profile.orders.length)],
                ["Lifetime value", formatINR(lifetimePaise)],
                ["Outstanding", formatINR(profile.outstandingPaise)],
                ["Last order", lastOrderDate ? formatDate(lastOrderDate) : "None yet"]
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-surface-sunken px-3 py-2.5 shadow-pressed">
                  <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">{label}</dt>
                  <dd
                    className={
                      label === "Outstanding" && profile.outstandingPaise > 0
                        ? "mt-0.5 text-base font-bold tabular-nums text-wine"
                        : "mt-0.5 text-base font-bold tabular-nums text-wine-ink"
                    }
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <dl className="grid gap-2">
              {[
                ["Phone", profile.customer.phonePrimary],
                ["Email", profile.customer.email],
                ["Address", profile.customer.address],
                ["Notes", profile.customer.notes]
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[5rem_1fr] gap-2">
                  <dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">{label}</dt>
                  <dd className={value ? "text-ink" : "text-muted-soft"}>{value || "Not recorded"}</dd>
                </div>
              ))}
            </dl>
            {profile.customer.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.customer.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-peach px-2.5 py-1 text-xs font-semibold text-wine-ink">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latest Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <MeasurementGrid values={profile.latestMeasurements} />
          </CardContent>
        </Card>
      </div>
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderTable orders={profile.orders} today={todayISO()} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
