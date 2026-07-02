import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCustomerMeasurementsAction } from "@/app/customers/[id]/measurements/actions";
import { AppShell } from "@/components/layout/app-shell";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getCustomerMeasurementProfile } from "@/services/customers/customer-measurement-service";

export default async function CustomerMeasurementsPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const profile = await getCustomerMeasurementProfile(id);
  if (!profile) notFound();

  const editing = query.edit === "1";
  const updateAction = updateCustomerMeasurementsAction.bind(null, id);

  return (
    <AppShell>
      <PageHeading
        title={`${profile.customer.fullName} Measurements`}
        description={`${profile.customer.phonePrimary} · ${
          profile.sourceOrder?.receiptNumber ? `Loaded from ${profile.sourceOrder.receiptNumber}` : "No saved order source"
        }`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/customers/${id}`}>
              <Button type="button" variant="secondary">
                Open Customer
              </Button>
            </Link>
            {!editing ? (
              <Link href={`/customers/${id}/measurements?edit=1`}>
                <Button type="button">Edit Measurements</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Edit Measurements" : "Saved Measurements"}</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.values.length ? (
            editing ? (
              <form action={updateAction} className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Customer phone number">
                    <Input name="phonePrimary" required inputMode="tel" defaultValue={profile.customer.phonePrimary} />
                  </Field>
                </div>
                <MeasurementGrid values={profile.values} editable />
                <div className="flex flex-wrap justify-end gap-2">
                  <Link href={`/customers/${id}/measurements`}>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit">Save Measurements</Button>
                </div>
              </form>
            ) : (
              <MeasurementGrid values={profile.values} />
            )
          ) : (
            <div className="rounded-md border border-dashed border-[#d8c7b4] bg-white p-8 text-center text-sm text-[#7c6d66]">
              No saved measurements found for this customer yet.
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
