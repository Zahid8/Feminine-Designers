import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { NewOrderForm } from "@/components/orders/new-order-form";
import { saveOrderAction } from "@/app/orders/new/actions";
import { todayISO } from "@/lib/utils/date";
import { listGarmentTypes } from "@/services/settings/settings-service";
import { listMeasurementTemplates } from "@/services/measurements/measurement-service";
import { getNextReceiptPreview } from "@/services/orders/receipt-preview-service";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const orderDate = todayISO();
  const deliveryDate = orderDate;
  const [garmentTypes, measurementTemplates, nextReceiptNumber] = await Promise.all([
    listGarmentTypes(),
    listMeasurementTemplates(),
    getNextReceiptPreview(orderDate)
  ]);
  return (
    <AppShell>
      <PageHeading
        title="New Order"
        description="Single-screen workflow for customer lookup, garment items, measurements, GST, advance payment, and print actions."
      />
      <NewOrderForm
        action={saveOrderAction}
        garmentTypes={garmentTypes}
        measurementTemplates={measurementTemplates}
        nextReceiptNumber={nextReceiptNumber}
        orderDate={orderDate}
        deliveryDate={deliveryDate}
      />
    </AppShell>
  );
}
