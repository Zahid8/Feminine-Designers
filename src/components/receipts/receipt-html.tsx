"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Check,
  Download,
  Link as LinkIcon,
  MessageCircle,
  Printer
} from "lucide-react";
import { useState } from "react";
import { whatsappLink } from "@/lib/contact/phone-links";
import type {
  OrderWithCustomer,
  ReceiptType,
  StoreSettings
} from "@/types/domain";
import {
  Button,
  buttonBaseClass,
  buttonVariantClasses
} from "@/components/ui/button";
import { addDaysISO, formatDate } from "@/lib/utils/date";
import { formatINR } from "@/lib/utils/money";
import {
  formatMeasurementValue,
  isPrintableMeasurementValue
} from "@/lib/utils/measurement-display";
import { shouldBreakAfterMeasurement } from "@/lib/utils/measurement-sections";
import { receiptFileName } from "@/lib/utils/receipt-file-name";
import { uniqueMeasurementNotes } from "@/lib/utils/receipt-notes";
import { formatExtraCostLine } from "@/lib/utils/extra-cost-display";
import { formatFabricLengthDisplay } from "@/lib/utils/fabric-length-display";
import { cn } from "@/lib/utils/cn";
import { advancePaidPaise, billSummaryLines, type SummaryLine } from "@/lib/calculations/payment-summary";
import { groupedExtraCosts } from "@/lib/utils/extra-cost-display";

const customerReceiptFooter = [
  "Delivery date is approximate. Please bring this receipt at the time of delivery.",
  "Alterations requested after delivery may be chargeable. Cancellation charges: ₹500.",
  "Conditions apply: Garments must be collected within 30 days of the delivery date. We will not be responsible for garments not collected within this period, and such garments may be sold to recover pending charges. Any required alterations will be completed by us within one week. Thank you. Authorized Signatory"
];

const copyTabs: { type: ReceiptType; label: string }[] = [
  { type: "customer", label: "Customer" },
  { type: "store", label: "Store" },
  { type: "combined", label: "Combined" }
];

export function ReceiptHtml({
  order,
  settings,
  type,
  billLinkUrl
}: {
  order: OrderWithCustomer;
  settings: StoreSettings;
  type: ReceiptType;
  /** Absolute signed URL for this order's customer bill, shown to staff for sharing. */
  billLinkUrl?: string;
}) {
  const content =
    type === "combined" ? (
      <div className="grid grid-cols-[3fr_2fr] gap-5">
        <ReceiptPanel order={order} settings={settings} mode="store" compact />
        <div className="relative border-l-2 border-dashed border-muted pl-5">
          <ReceiptPanel
            order={order}
            settings={settings}
            mode="customer"
            compact
          />
        </div>
      </div>
    ) : (
      <ReceiptPanel order={order} settings={settings} mode={type} />
    );

  return (
    <div className="min-h-screen bg-background p-3 text-ink sm:p-6 print:bg-white print:p-0">
      {billLinkUrl ? (
        <ShareBillLink
          order={order}
          storeName={settings.storeName}
          url={billLinkUrl}
        />
      ) : null}
      <div className="no-print mx-auto mb-4 grid max-w-6xl gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <Link
          href={`/orders/${order.id}`}
          className={cn(
            buttonBaseClass,
            buttonVariantClasses.secondary,
            "justify-self-start"
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to order
        </Link>
        <nav
          aria-label="Receipt copies"
          className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-sunken p-1.5 shadow-pressed sm:mx-auto sm:inline-grid sm:w-auto"
        >
          {copyTabs.map((tab) => (
            <Link
              key={tab.type}
              href={`/receipts/${order.id}/${tab.type}`}
              aria-current={tab.type === type ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-semibold transition sm:px-5",
                tab.type === type
                  ? "bg-gradient-to-br from-wine to-rose text-white shadow-brand"
                  : "text-ink-soft hover:bg-surface hover:text-wine"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <a
            href={`/api/receipts/${order.id}/${type}`}
            download={receiptFileName(type, order.receiptNumber)}
            className={cn(buttonBaseClass, buttonVariantClasses.secondary)}
          >
            <Download className="h-4 w-4" aria-hidden />
            Download PDF
          </a>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </Button>
        </div>
      </div>
      {type === "combined" ? (
        <p className="no-print mx-auto mb-2 max-w-6xl text-xs text-muted sm:hidden">
          Combined is a landscape print layout. Swipe sideways to see it all, or
          use Customer and Store for easier reading on a phone.
        </p>
      ) : null}
      <div className="overflow-x-auto print:overflow-visible">
        <article
          className={cn(
            "print-page mx-auto rounded-2xl bg-white p-6 shadow-raised-lg [print-color-adjust:exact] print:rounded-none print:p-0 print:shadow-none",
            type === "combined"
              ? "min-w-[960px] max-w-[1122px] print:min-w-0"
              : "max-w-3xl"
          )}
        >
          {content}
        </article>
      </div>
      <style>{`
        @page { size: ${type === "combined" ? "A4 landscape" : "A4 portrait"}; margin: 10mm; }
        @media print {
          .print-page { width: 100%; }
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
  const printableMeasurements = order.measurements.filter((measurement) =>
    isPrintableMeasurementValue(measurement.value)
  );
  const specialNotes = uniqueMeasurementNotes(order.measurements);
  const isCustomer = mode === "customer";
  const deliveryDateForReceipt =
    mode === "store" ? addDaysISO(order.deliveryDate, -3) : order.deliveryDate;
  const copyLabel = isCustomer ? "Customer Receipt" : "Store Copy";

  return (
    <section className={compact ? "text-[11px]" : "text-sm"}>
      <header
        className={cn(
          "flex flex-wrap items-center gap-3 rounded-xl bg-wine text-white sm:flex-nowrap",
          compact ? "p-3" : "p-4"
        )}
      >
        <span className="shrink-0 rounded-lg bg-white p-1">
          <Image
            src="/Logo.PNG"
            alt={`${settings.storeName} logo`}
            width={compact ? 40 : 52}
            height={compact ? 40 : 52}
            className={cn(
              "rounded-md object-cover",
              compact ? "h-10 w-10" : "h-13 w-13"
            )}
            priority={!compact}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-serif font-medium leading-tight",
              compact ? "text-lg" : "text-2xl"
            )}
          >
            {settings.storeName}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-[#f8dccb]">
            {settings.addressLines.join(", ")}
          </p>
          <p className="text-[11px] text-[#f8dccb]">
            GSTIN {settings.gstin} · {settings.phonePrimary} /{" "}
            {settings.phoneSecondary}
          </p>
          {compact ? (
            <p className="mt-1.5 flex items-center gap-2">
              <span className="whitespace-nowrap rounded-full bg-cream px-2.5 py-0.5 text-[10px] font-bold uppercase text-wine">
                {copyLabel}
              </span>
              <span className="font-bold">
                {order.receiptNumber ?? "Draft"}
              </span>
            </p>
          ) : null}
        </div>
        {compact ? null : (
          <div className="flex w-full items-center gap-2 border-t border-white/15 pt-2 sm:block sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0 sm:text-right">
            <span className="whitespace-nowrap rounded-full bg-cream px-2.5 py-0.5 text-[10px] font-bold uppercase text-wine">
              {copyLabel}
            </span>
            <p className="whitespace-nowrap text-base font-bold sm:mt-2 sm:text-lg">
              {order.receiptNumber ?? "Draft"}
            </p>
            <p className="hidden text-[10px] uppercase tracking-wide text-[#f8dccb] sm:block">
              Receipt no.
            </p>
          </div>
        )}
      </header>

      <dl
        className={cn(
          "mt-3 grid overflow-hidden rounded-xl border border-line bg-paper",
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"
        )}
      >
        <Info label="Customer" value={order.customer.fullName} />
        <Info label="Phone" value={order.customer.phonePrimary} />
        <Info label="Order date" value={formatDate(order.orderDate)} />
        <Info
          label={isCustomer ? "Delivery" : "Ready by"}
          value={formatDate(deliveryDateForReceipt)}
          highlight
        />
      </dl>

      <ReceiptItemSummary order={order} compact={compact} mode={mode} />

      <div
        className={cn(
          "mt-4 grid gap-4",
          compact
            ? "grid-cols-[1fr_190px]"
            : "grid-cols-1 sm:grid-cols-[1fr_240px]"
        )}
      >
        <div className="min-w-0">
          {mode === "store" ? (
            <>
              {printableMeasurements.length > 0 ? (
                <div className="break-inside-avoid">
                  <SectionHead
                    title="Measurements"
                    meta={`${printableMeasurements.length} recorded`}
                    compact={compact}
                  />
                  <div
                    className={cn(
                      "grid gap-1.5",
                      compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"
                    )}
                  >
                    {printableMeasurements.map((measurement) => (
                      <div key={measurement.id} className="contents">
                        <div className="flex justify-between rounded-md border border-line bg-paper px-2 py-1">
                          <span className="font-bold text-wine">
                            {measurement.displayCode}
                          </span>
                          <span>
                            {formatMeasurementValue(
                              measurement.value,
                              measurement.unit
                            )}
                          </span>
                        </div>
                        {shouldBreakAfterMeasurement(measurement) ? (
                          <div
                            className="col-span-full h-px bg-gold-soft"
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {order.clothSampleImageUrl ? (
                <div className="mt-3 break-inside-avoid">
                  <SectionHead title="Cloth Sample" compact={compact} />
                  <Image
                    src={order.clothSampleImageUrl}
                    alt="Customer cloth sample"
                    width={compact ? 150 : 200}
                    height={compact ? 110 : 145}
                    unoptimized
                    className="rounded-lg border border-line object-cover"
                  />
                </div>
              ) : null}
              {specialNotes.map((note) => (
                <p
                  key={note}
                  className="mt-2 rounded-md border-l-2 border-gold bg-cream p-2"
                >
                  Special Notes: {note}
                </p>
              ))}
              {order.internalNotes ? (
                <p className="mt-2 rounded-md border-l-2 border-rose bg-cream p-2">
                  Internal: {order.internalNotes}
                </p>
              ) : null}
            </>
          ) : (
            <>
              {order.customerNotes ? (
                <p className="mb-2 rounded-md border-l-2 border-gold bg-cream p-2">
                  Customer Notes: {order.customerNotes}
                </p>
              ) : null}
              <div
                className={cn(
                  "grid gap-1.5 text-muted",
                  compact
                    ? "text-[9.5px] leading-snug"
                    : "text-[11px] leading-relaxed"
                )}
              >
                <p className="font-bold uppercase text-wine-ink">Terms</p>
                {customerReceiptFooter.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </>
          )}
        </div>
        <PaymentSummary order={order} compact={compact} />
      </div>

      <footer className="mt-4 border-t-2 border-gold-soft pt-3 text-xs text-muted">
        {isCustomer ? null : <p>{settings.termsAndConditions}</p>}
        <div
          className={cn("flex justify-between", isCustomer ? "mt-8" : "mt-6")}
        >
          <span className="w-36 border-t border-muted pt-1 text-center">
            {isCustomer ? "Customer" : "Thank you"}
          </span>
          <span className="w-36 border-t border-muted pt-1 text-center">
            Authorized Signatory
          </span>
        </div>
        {isCustomer ? (
          <p className="mt-2 text-center font-serif text-sm italic text-wine">
            Thank you for choosing {settings.storeName}
          </p>
        ) : null}
      </footer>
    </section>
  );
}

function SectionHead({
  title,
  meta,
  badge,
  compact = false
}: {
  title: string;
  meta?: string;
  badge?: string;
  compact?: boolean;
}) {
  return (
    <div className="mb-1.5 flex items-end justify-between gap-3 border-b-2 border-gold pb-1">
      <p
        className={cn(
          "font-serif font-medium text-wine-ink",
          compact ? "text-sm" : "text-lg"
        )}
      >
        {title}
      </p>
      {meta || badge ? (
        <p className="text-[10px] uppercase tracking-wide text-muted">
          {[meta, badge].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
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
    <section className="mt-4">
      <SectionHead
        title="Item summary"
        meta={`${order.items.length} ${order.items.length === 1 ? "garment" : "garments"}`}
        badge={mode === "store" ? "Store Copy" : undefined}
        compact={compact}
      />
      <ol>
        {order.items.map((item, index) => {
          const fabricLength = formatFabricLengthDisplay(item.fabricLength);
          const meta = [
            `Qty ${item.quantity}`,
            fabricLength ? `Fabric ${fabricLength}` : "",
            item.fabricColor ?? ""
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <li
              key={item.id}
              className={cn(
                "flex items-start gap-2.5 border-b border-line-soft px-2",
                compact ? "py-1" : "py-1.5",
                index % 2 === 1 && "bg-paper-warm"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-peach font-bold text-wine",
                  compact ? "h-4 w-4 text-[9px]" : "h-5 w-5 text-[10px]"
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p>
                  <span className="font-bold text-wine-ink">
                    {item.garmentType}
                  </span>
                  <span className="ml-2 text-xs text-muted">{meta}</span>
                </p>
                {item.extraCosts.length ? (
                  <p className="text-xs text-muted">
                    {item.extraCosts
                      .map((cost) =>
                        formatExtraCostLine(
                          cost.label,
                          formatINR(cost.amountPaise)
                        )
                      )
                      .join(", ")}
                  </p>
                ) : null}
                {mode === "store" && item.stitchingInstructions ? (
                  <p className="text-xs italic text-ink">
                    {item.stitchingInstructions}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-bold tabular-nums text-wine-ink">
                {formatINR(item.lineTotalPaise)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function PaymentSummary({ order, compact }: { order: OrderWithCustomer; compact: boolean }) {
  const lines = billSummaryLines(order.totals, { namedExtras: groupedExtraCosts(order.items), advancePaise: advancePaidPaise(order.payments) });
  const sign = (line: SummaryLine, index: number) =>
    line.kind === "part" ? (index === 0 ? "" : "+ ") : line.kind === "tax" ? "+ " : line.kind === "discount" || line.kind === "paid" ? "− " : "";

  return (
    <div className={cn("h-fit break-inside-avoid rounded-xl border border-line bg-paper", compact ? "p-2.5 text-[11px]" : "p-3 text-sm")}>
      <p className="mb-1 font-serif text-base font-medium text-wine-ink">Payment summary</p>
      {lines.map((line, index) =>
        line.kind === "total" ? (
          <p key={line.key} className="mt-2 flex items-baseline justify-between gap-4 border-t-2 border-wine pt-2 font-bold text-wine-ink">
            <span>{line.label}</span>
            <span className={cn("tabular-nums text-wine", compact ? "text-base" : "text-xl")}>{formatINR(line.amountPaise)}</span>
          </p>
        ) : (
          <Total
            key={line.key}
            label={`${sign(line, index)}${line.label}`}
            value={Math.abs(line.amountPaise)}
            strong={line.kind === "subtotal"}
            part={line.kind === "part"}
          />
        )
      )}
    </div>
  );
}

function Info({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-b border-r border-line-soft px-3 py-2",
        highlight && "bg-peach"
      )}
    >
      <dt className="text-[10px] uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="font-bold text-wine-ink">{value}</dd>
    </div>
  );
}

function Total({ label, value, strong = false, part = false }: { label: string; value: number; strong?: boolean; part?: boolean }) {
  return (
    <p
      className={cn(
        "flex justify-between gap-4 py-0.5",
        strong && "mt-1 border-t border-line pt-1.5 font-bold text-wine-ink",
        part && "border-l-2 border-gold-soft pl-2 text-xs"
      )}
    >
      <span className={strong ? undefined : "text-muted"}>{label}</span>
      <span className={cn("tabular-nums", part && "text-muted")}>{formatINR(value)}</span>
    </p>
  );
}

/** Staff-only panel: copy or WhatsApp the customer's public bill link. */
function ShareBillLink({
  order,
  storeName,
  url
}: {
  order: OrderWithCustomer;
  storeName: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const message = `Hello ${order.customer.fullName}, here is your bill ${order.receiptNumber ?? ""} from ${storeName}: ${url}`;
  const whatsapp = whatsappLink(order.customer.phonePrimary, message);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this bill link", url);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <section
      aria-label="Share bill link"
      className="no-print mx-auto mb-4 grid max-w-6xl gap-3 rounded-2xl border border-white/70 bg-surface p-4 shadow-raised sm:grid-cols-[1fr_auto] sm:items-center"
    >
      <div className="min-w-0">
        <p className="font-semibold text-wine-ink">Customer bill link</p>
        <p className="text-sm text-muted">
          Send this instead of the PDF file. The customer taps it and the bill
          PDF opens, no login needed.
        </p>
        <p
          className="mt-2 truncate rounded-lg bg-surface-sunken px-3 py-2 font-mono text-xs text-ink-soft shadow-pressed"
          title={url}
        >
          {url}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:flex sm:flex-col">
        <Button onClick={() => void copy()} className="min-h-12 px-6 text-base">
          {copied ? (
            <Check className="h-5 w-5" aria-hidden />
          ) : (
            <LinkIcon className="h-5 w-5" aria-hidden />
          )}
          {copied ? "Link copied" : "Copy bill link"}
        </Button>
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonBaseClass,
              "min-h-12 bg-gradient-to-br from-emerald-600 to-emerald-500 px-6 text-base text-white shadow-raised-sm"
            )}
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Send on WhatsApp
          </a>
        ) : null}
      </div>
    </section>
  );
}
