import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { NewOrderForm } from "@/components/orders/new-order-form";
import { saveOrderAction } from "@/app/orders/new/actions";
import { todayISO } from "@/lib/utils/date";
import { getStoreSettings, listGarmentTypes, listTailors } from "@/services/settings/settings-service";
import { listMeasurementTemplates } from "@/services/measurements/measurement-service";
import { getNextReceiptPreview } from "@/services/orders/receipt-preview-service";
import { getCustomerMeasurementProfile } from "@/services/customers/customer-measurement-service";
import type { ReturningCustomerMatch } from "@/types/customer-search";

export const dynamic = "force-dynamic";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<{ customer?: string }> }) {
  const { customer: customerId } = await searchParams;
  const orderDate = todayISO();
  const deliveryDate = orderDate;
  const [garmentTypes, measurementTemplates, nextReceiptNumber, customerProfile, settings, tailors] = await Promise.all([
    listGarmentTypes(),
    listMeasurementTemplates(),
    getNextReceiptPreview(orderDate),
    customerId ? getCustomerMeasurementProfile(customerId) : Promise.resolve(undefined),
    getStoreSettings(),
    listTailors()
  ]);
  const initialCustomer: ReturningCustomerMatch | undefined = customerProfile
    ? {
        id: customerProfile.customer.id,
        customerCode: customerProfile.customer.customerCode,
        fullName: customerProfile.customer.fullName,
        phonePrimary: customerProfile.customer.phonePrimary,
        measurements: customerProfile.values
      }
    : undefined;
  return (
    <AppShell>
      <PageHeading
        title="New Order"
        description={
          initialCustomer
            ? `For ${initialCustomer.fullName} · saved measurements are filled in, edit anything that changed.`
            : "Customer, garments, measurements, and payment on one screen."
        }
      />
      <NewOrderForm
        action={saveOrderAction}
        garmentTypes={garmentTypes}
        measurementTemplates={measurementTemplates}
        nextReceiptNumber={nextReceiptNumber}
        orderDate={orderDate}
        deliveryDate={deliveryDate}
        initialCustomer={initialCustomer}
        cgstRate={settings.defaultCgstRate}
        sgstRate={settings.defaultSgstRate}
        tailors={tailors.filter((tailor) => tailor.active).map((tailor) => tailor.name)}
      />
    </AppShell>
  );
}
