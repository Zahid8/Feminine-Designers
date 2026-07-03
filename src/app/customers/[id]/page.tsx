import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { OrderTable } from "@/components/orders/order-table";
import { getCustomerProfile } from "@/services/customers/customer-service";
import { formatINR } from "@/lib/utils/money";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCustomerProfile(id);
  if (!profile) notFound();
  return (
    <AppShell>
      <PageHeading
        title={profile.customer.fullName}
        description={`${profile.customer.phonePrimary} · ${profile.customer.preferredCommunication} · Outstanding ${formatINR(profile.outstandingPaise)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/customers/${id}/measurements`}>
              <Button type="button" variant="secondary">
                Measurements
              </Button>
            </Link>
            <Link href="/orders/new">
              <Button>Create New Order</Button>
            </Link>
          </div>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>{profile.customer.address}</p>
            <p>{profile.customer.email}</p>
            <p>{profile.customer.notes}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {profile.customer.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-[#dfc5a8] bg-[#fff7ec] px-2.5 py-1 text-xs font-semibold shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
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
          <OrderTable orders={profile.orders} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
