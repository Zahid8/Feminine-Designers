import { notFound } from "next/navigation";
import { updateCustomerAction } from "@/app/customers/[id]/measurements/actions";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { EditCustomerForm } from "@/components/customers/edit-customer-form";
import { getCustomerMeasurementProfile } from "@/services/customers/customer-measurement-service";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCustomerMeasurementProfile(id);
  if (!profile) notFound();

  return (
    <AppShell>
      <PageHeading title={`Edit ${profile.customer.fullName}`} description="Update contact details and saved measurements in one place." />
      <EditCustomerForm customer={profile.customer} measurements={profile.values} action={updateCustomerAction.bind(null, id)} />
    </AppShell>
  );
}
