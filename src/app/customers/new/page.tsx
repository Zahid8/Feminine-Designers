import Link from "next/link";
import { createCustomerAction } from "@/app/customers/new/actions";
import { AppShell } from "@/components/layout/app-shell";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { listMeasurementTemplates } from "@/services/measurements/measurement-service";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  const templates = await listMeasurementTemplates();
  const template = templates[0];

  return (
    <AppShell>
      <PageHeading
        title="Add Customer"
        description="Create a customer profile with contact details and reusable measurements before making an order."
        action={
          <Link href="/customers">
            <Button type="button" variant="secondary">
              Back to Customers
            </Button>
          </Link>
        }
      />
      <form action={createCustomerAction} className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Customer Name">
              <Input name="fullName" required />
            </Field>
            <Field label="Phone Number">
              <Input name="phonePrimary" required inputMode="tel" />
            </Field>
            <Field label="Second Phone">
              <Input name="phoneSecondary" inputMode="tel" />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" />
            </Field>
            <Field label="Address">
              <Textarea name="address" />
            </Field>
            <Field label="Notes">
              <Textarea name="notes" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Measurements</CardTitle>
          </CardHeader>
          <CardContent>
            <MeasurementGrid template={template} editable />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/customers">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit">Save Customer</Button>
        </div>
      </form>
    </AppShell>
  );
}
