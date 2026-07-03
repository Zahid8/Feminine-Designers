"use client";

import Link from "next/link";
import Image from "next/image";
import type { OrderWithCustomer, ReceiptType, StoreSettings } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";
import { formatMeasurementValue, isPrintableMeasurementValue } from "@/lib/utils/measurement-display";
import { shouldBreakAfterMeasurement } from "@/lib/utils/measurement-sections";
import { receiptFileName } from "@/lib/utils/receipt-file-name";
import { uniqueMeasurementNotes } from "@/lib/utils/receipt-notes";
import { formatExtraCostLine } from "@/lib/utils/extra-cost-display";

const customerReceiptFooter = [
  "Delivery date is approximate. Please bring this receipt at the time of delivery.",
  "Alterations requested after delivery may be chargeable. Cancellation charges: ₹500.",
  "Conditions apply: Garments must be collected within 30 days of the delivery date. We will not be responsible for garments not collected within this period, and such garments may be sold to recover pending charges. Any required alterations will be completed by us within one week. Thank you. Authorized Signatory"
];

export function ReceiptHtml({
  order,
  settings,
  type
}: {
  order: OrderWithCustomer;
  settings: StoreSettings;
  type: ReceiptType;
}) {
  const content =
    type === "combined" ? (
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <ReceiptPanel order={order} settings={settings} mode="store" />
        <div className="border-l-2 border-dashed border-[#7c6d66] pl-4">
          <ReceiptPanel order={order} settings={settings} mode="customer" compact />
        </div>
      </div>
    ) : (
      <ReceiptPanel order={order} settings={settings} mode={type} />
    );

  return (
    <div className="min-h-screen bg-[#f6efe5] p-4 text-[#2c2522] print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <Link href={`/orders/${order.id}`} className="text-sm font-semibold text-[#7d1f36]">
          Back to order
        </Link>
        <div className="flex gap-2">
          <a href={`/api/receipts/${order.id}/${type}`} download={receiptFileName(type, order.receiptNumber)}>
            <Button variant="secondary">Download PDF</Button>
          </a>
          <Button onClick={() => window.print()}>Print</Button>
        </div>
      </div>
      <article
        className={`print-page mx-auto bg-white p-6 shadow-sm ${
          type === "combined" ? "max-w-[1122px] print:landscape-receipt" : "max-w-3xl"
        }`}
      >
        {content}
      </article>
      <style>{`
        @page { size: ${type === "combined" ? "A4 landscape" : "A4 portrait"}; margin: 10mm; }
        @media print {
          .print-page { width: 100%; }
          .landscape-receipt { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

function ReceiptPanel({
  order,
  settings,
  mode,
  compact = false
}: {
  order: OrderWithCustomer;
  settings: StoreSettings;
  mode: "customer" | "store";
  compact?: boolean;
}) {
  const printableMeasurements = order.measurements.filter((measurement) => isPrintableMeasurementValue(measurement.value));
  const specialNotes = uniqueMeasurementNotes(order.measurements);
  const isCustomer = mode === "customer";

  return (
    <section className={compact ? "text-[11px]" : "text-sm"}>
      <header
        className={
          isCustomer
            ? "rounded-md border border-[#ead7c1] bg-[#fff8f0] p-4 shadow-[0_10px_30px_rgba(76,21,37,0.08)] print:shadow-none"
            : "border-b border-[#d8c7b4] pb-3"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            {isCustomer ? (
              <p className="mb-2 w-fit rounded-full bg-[#7d1f36] px-3 py-1 text-[10px] font-bold uppercase text-white">
                Customer Receipt
              </p>
            ) : null}
            <p className={compact ? "font-serif text-lg font-semibold leading-tight text-[#4c1525]" : "font-serif text-2xl font-semibold leading-tight text-[#4c1525]"}>
              {settings.storeName}
            </p>
            <p className="mt-2 whitespace-pre-line text-xs text-[#6f625d]">{settings.addressLines.join("\n")}</p>
            <p className="mt-1 text-xs text-[#6f625d]">
              GSTIN {settings.gstin} · {settings.phonePrimary} / {settings.phoneSecondary}
            </p>
          </div>
          <Image
            src="/Logo.PNG"
            alt={`${settings.storeName} logo`}
            width={compact ? 40 : 48}
            height={compact ? 40 : 48}
            className={
              compact
                ? "h-10 w-10 rounded-md bg-white object-cover"
                : isCustomer
                  ? "h-14 w-14 rounded-md bg-white object-cover p-1 shadow-sm"
                  : "h-12 w-12 rounded-md object-cover"
            }
            priority={!compact}
          />
        </div>
      </header>
      <div className={isCustomer ? "my-4 grid grid-cols-2 gap-3 rounded-md border border-[#eadfce] bg-[#fffaf5] p-3" : "grid grid-cols-2 gap-3 border-b border-[#eadfce] py-3"}>
        <Info label="Receipt" value={order.receiptNumber ?? "Draft"} />
        {mode === "store" ? <Info label="Copy" value="Store Copy" /> : null}
        <Info label="Customer" value={order.customer.fullName} />
        <Info label="Phone" value={order.customer.phonePrimary} />
        <Info label="Order date" value={formatDate(order.orderDate)} />
        <Info label="Delivery" value={formatDate(order.deliveryDate)} />
      </div>
      <ReceiptItemSummary order={order} compact={compact} mode={mode} />
      {mode === "store" ? (
        <div className="mt-4">
          {order.clothSampleImageUrl ? (
            <div className="mb-4 break-inside-avoid">
              <h3 className="font-serif text-xl font-semibold text-[#4c1525]">Cloth Sample</h3>
              <Image
                src={order.clothSampleImageUrl}
                alt="Customer cloth sample"
                width={260}
                height={180}
                unoptimized
                className="mt-2 max-h-44 rounded-md border border-[#eadfce] object-cover"
              />
            </div>
          ) : null}
          {printableMeasurements.length > 0 ? (
            <>
              <h3 className="font-serif text-xl font-semibold text-[#4c1525]">Measurements</h3>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {printableMeasurements.map((measurement) => (
                  <div key={measurement.id} className="contents">
                    <div className="border border-[#eadfce] px-2 py-1">
                      <span className="font-semibold">{measurement.displayCode}</span>
                      <span className="float-right">{formatMeasurementValue(measurement.value, measurement.unit)}</span>
                    </div>
                    {shouldBreakAfterMeasurement(measurement) ? <div className="col-span-3 h-px bg-[#d8c7b4]" aria-hidden="true" /> : null}
                  </div>
                ))}
              </div>
            </>
          ) : null}
          {specialNotes.map((note) => (
            <p key={note} className="mt-3 border border-[#eadfce] p-2">
              Special Notes: {note}
            </p>
          ))}
          {order.internalNotes ? <p className="mt-3 border border-[#eadfce] p-2">Internal: {order.internalNotes}</p> : null}
        </div>
      ) : null}
      <div
        className={
          "ml-auto mt-4 grid max-w-xs gap-1 rounded-md border border-[#ead7c1] bg-[#fffaf5] p-3 text-sm shadow-[0_10px_24px_rgba(76,21,37,0.06)] print:shadow-none"
        }
      >
        <p className="mb-1 font-serif text-base font-semibold text-[#4c1525]">Payment summary</p>
        <Total label="Subtotal" value={order.totals.subtotalPaise} />
        <Total label="Accessories" value={order.totals.accessoriesCostPaise} />
        <Total label="Stitching" value={order.totals.stitchingCostPaise} />
        <Total label="Fabric price" value={order.totals.fabricPricePaise} />
        <Total label="Dye price" value={order.totals.dyePricePaise} />
        <Total label="Extra costs" value={order.totals.extraCostPaise} />
        <Total label="Discount" value={-order.totals.orderDiscountPaise} />
        <Total label="CGST" value={order.totals.cgstAmountPaise} />
        <Total label="SGST" value={order.totals.sgstAmountPaise} />
        <Total label="Grand Total" value={order.totals.grandTotalPaise} strong />
        <Total label="Advance" value={order.totals.totalPaidPaise} />
        <Total label="Balance" value={order.totals.balanceDuePaise} strong />
      </div>
      <footer className={isCustomer ? "mt-5 rounded-md border border-[#eadfce] bg-[#fffaf5] p-3 text-xs text-[#6f625d]" : "mt-5 border-t border-[#eadfce] pt-3 text-xs text-[#6f625d]"}>
        {mode === "customer" ? (
          <div className="grid gap-2 text-[10px] leading-4">
            {order.customerNotes ? <p className="border border-[#eadfce] p-2">Customer Notes: {order.customerNotes}</p> : null}
            {customerReceiptFooter.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <>
            <p>{settings.termsAndConditions}</p>
            <div className="mt-8 flex justify-between">
              <span>Thank you</span>
              <span>Authorized Signatory</span>
            </div>
          </>
        )}
      </footer>
    </section>
  );
}

function ReceiptItemSummary({
  order,
  compact,
  mode
}: {
  order: OrderWithCustomer;
  compact: boolean;
  mode: "customer" | "store";
}) {
  return (
    <section className="mt-3">
      <div className="flex items-end justify-between gap-3 border-b border-[#eadfce] pb-2">
        <div>
          <p className={compact ? "font-serif text-sm font-semibold text-[#4c1525]" : "font-serif text-lg font-semibold text-[#4c1525]"}>
            Item summary
          </p>
          <p className="text-[10px] uppercase text-[#9a7055]">
            {order.items.length} {order.items.length === 1 ? "garment" : "garments"}
          </p>
        </div>
        {mode === "store" ? (
          <span className="rounded-full bg-[#f8eadb] px-3 py-1 text-[10px] font-bold uppercase text-[#7d1f36]">
            Store Copy
          </span>
        ) : null}
      </div>
      <div className={compact ? "mt-2 grid gap-2" : "mt-3 grid gap-3"}>
        {order.items.map((item, index) => (
          <div key={item.id} className="rounded-md border border-[#ead7c1] bg-white p-3 shadow-[0_8px_20px_rgba(76,21,37,0.05)] print:shadow-none">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-[#b06f47]">Dress {index + 1}</p>
                <p className={compact ? "font-semibold text-[#4c1525]" : "text-base font-semibold text-[#4c1525]"}>{item.garmentType}</p>
                <p className="mt-1 text-xs text-[#6f625d]">
                  Qty {item.quantity}
                  {item.fabricLength ? ` · Fabric ${item.fabricLength}` : ""}
                </p>
                {item.extraCosts.length ? (
                  <p className="mt-1 text-xs text-[#6f625d]">
                    {item.extraCosts.map((cost) => formatExtraCostLine(cost.label, formatINR(cost.amountPaise))).join(", ")}
                  </p>
                ) : null}
                {mode === "store" && item.stitchingInstructions ? <p className="mt-1 text-xs text-[#6f625d]">{item.stitchingInstructions}</p> : null}
              </div>
              <div className="min-w-24 rounded-md bg-[#fff6eb] px-3 py-2 text-right">
                <p className="text-[10px] uppercase text-[#9a7055]">Amount</p>
                <p className="font-bold text-[#4c1525]">{formatINR(item.lineTotalPaise)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-xs uppercase text-[#7c6d66]">{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function Total({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <p className={`flex justify-between gap-4 ${strong ? "border-t border-[#d8c7b4] pt-1 font-bold" : ""}`}>
      <span>{label}</span>
      <span>{formatINR(value)}</span>
    </p>
  );
}
