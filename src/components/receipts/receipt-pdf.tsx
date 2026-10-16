import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Fragment } from "react";
import type { OrderWithCustomer, ReceiptType, StoreSettings } from "@/types/domain";
import { addDaysISO, formatDate } from "@/lib/utils/date";
import { paiseToRupees } from "@/lib/utils/money";
import { formatMeasurementValue, isPrintableMeasurementValue } from "@/lib/utils/measurement-display";
import { shouldBreakAfterMeasurement } from "@/lib/utils/measurement-sections";
import { getPublicPngDataUri } from "@/lib/utils/pdf-assets";
import { uniqueMeasurementNotes } from "@/lib/utils/receipt-notes";
import { formatExtraCostLine } from "@/lib/utils/extra-cost-display";
import { formatFabricLengthDisplay } from "@/lib/utils/fabric-length-display";
import { advancePaidPaise, billSummaryLines, type SummaryLine } from "@/lib/calculations/payment-summary";
import { groupedExtraCosts } from "@/lib/utils/extra-cost-display";

const customerReceiptFooter = [
  "Delivery date is approximate. Please bring this receipt at the time of delivery.",
  "Alterations requested after delivery may be chargeable. Cancellation charges: Rs. 500.",
  "Conditions apply: Garments must be collected within 30 days of the delivery date. We will not be responsible for garments not collected within this period, and such garments may be sold to recover pending charges. Any required alterations will be completed by us within one week. Thank you. Authorized Signatory"
];
const storeLogoSource = getPublicPngDataUri("Logo.PNG");

const colors = {
  wine: "#7d1f36",
  wineDeep: "#3f0f20",
  wineInk: "#4c1525",
  rose: "#b84862",
  gold: "#d99a62",
  goldSoft: "#f1d0aa",
  cream: "#fff7ec",
  paper: "#fffdfa",
  peach: "#fff1df",
  line: "#ead8c3",
  lineSoft: "#f2e6d8",
  ink: "#2c2522",
  muted: "#7c6d66",
  success: "#12633d",
  successSoft: "#e3f4ea",
  onWine: "#f8dccb"
};

function formatPdfINR(paise: number) {
  return `Rs. ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(paiseToRupees(paise))}`;
}

const styles = StyleSheet.create({
  page: { paddingTop: 26, paddingBottom: 34, paddingHorizontal: 28, fontSize: 9, fontFamily: "Helvetica", color: colors.ink, backgroundColor: "#ffffff" },
  combinedPage: { paddingTop: 16, paddingBottom: 22, paddingHorizontal: 16, fontSize: 7.4 },
  panes: { flexDirection: "row" },
  storePane: { width: "60%", paddingRight: 12 },
  customerPane: { width: "40%", paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: colors.muted, borderStyle: "dashed" },
  cutLabel: { position: "absolute", top: -2, left: -14, fontSize: 5.5, color: colors.muted, letterSpacing: 1 },

  // Header band
  band: { flexDirection: "row", alignItems: "center", backgroundColor: colors.wine, borderRadius: 8, padding: 12 },
  bandCompact: { padding: 8, borderRadius: 6 },
  logoFrame: { backgroundColor: "#ffffff", borderRadius: 7, padding: 3, marginRight: 10 },
  logo: { width: 46, height: 46, borderRadius: 5 },
  logoCompact: { width: 32, height: 32 },
  bandText: { flexGrow: 1, flexShrink: 1, paddingRight: 8 },
  storeName: { fontFamily: "Times-Bold", fontSize: 20, color: "#ffffff" },
  storeNameCompact: { fontSize: 13 },
  bandMuted: { color: colors.onWine, fontSize: 7.6, marginTop: 2, lineHeight: 1.3 },
  bandMutedCompact: { fontSize: 6.2 },
  bandRight: { alignItems: "flex-end" },
  bandCompactMeta: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  copyPill: {
    backgroundColor: colors.cream,
    color: colors.wine,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
    textTransform: "uppercase"
  },
  receiptNumber: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 6 },
  receiptNumberCompact: { fontSize: 9, marginTop: 4 },
  receiptCaption: { color: colors.onWine, fontSize: 6.6, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.6 },

  // Info strip
  infoStrip: { flexDirection: "row", marginTop: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 7, backgroundColor: colors.paper },
  infoStripCompact: { flexWrap: "wrap", marginTop: 7 },
  infoCell: { flexGrow: 1, flexBasis: 0, paddingVertical: 7, paddingHorizontal: 9, borderRightWidth: 1, borderRightColor: colors.lineSoft },
  infoCellCompact: { flexBasis: "50%", paddingVertical: 4, paddingHorizontal: 6 },
  infoCellLast: { borderRightWidth: 0 },
  infoCellHighlight: { backgroundColor: colors.peach, borderTopRightRadius: 6, borderBottomRightRadius: 6 },
  label: { color: colors.muted, fontSize: 6.6, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
  value: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: colors.wineInk },
  valueCompact: { fontSize: 7.8 },

  // Section headings
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14, marginBottom: 5 },
  sectionHeadCompact: { marginTop: 8, marginBottom: 3 },
  sectionTitle: { fontFamily: "Times-Bold", fontSize: 13, color: colors.wineInk },
  sectionTitleCompact: { fontSize: 10 },
  sectionMeta: { fontSize: 6.8, color: colors.muted, textTransform: "uppercase", letterSpacing: 0.6 },
  rule: { height: 1.5, backgroundColor: colors.gold, borderRadius: 1, marginBottom: 2 },

  // Item rows
  itemRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.6, borderBottomColor: colors.lineSoft },
  itemRowCompact: { paddingVertical: 2, paddingHorizontal: 4 },
  itemRowAlt: { backgroundColor: "#fffaf4" },
  itemIndex: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.peach,
    color: colors.wine,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textAlign: "center",
    paddingTop: 3.5,
    marginRight: 7
  },
  itemIndexCompact: { width: 11, height: 11, borderRadius: 5.5, fontSize: 5.6, paddingTop: 2.6, marginRight: 5 },
  itemBody: { flexGrow: 1, flexShrink: 1, paddingRight: 8 },
  itemName: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: colors.wineInk },
  itemNameCompact: { fontSize: 7.8 },
  itemMeta: { fontSize: 7.6, color: colors.muted, marginTop: 1.5 },
  itemMetaInline: { fontFamily: "Helvetica", fontSize: 7.6, color: colors.muted },
  itemMetaInlineCompact: { fontSize: 6.4 },
  itemMetaCompact: { fontSize: 6.4 },
  itemNote: { fontFamily: "Helvetica-Oblique", fontSize: 7.6, color: colors.ink, marginTop: 1.5, textAlign: "justify" },
  itemAmount: { fontFamily: "Helvetica-Bold", fontSize: 9.5, color: colors.wineInk, textAlign: "right", minWidth: 70 },
  itemAmountCompact: { fontSize: 7.8, minWidth: 56 },

  // Lower area
  lower: { flexDirection: "row", marginTop: 12 },
  lowerLeft: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 12 },
  lowerRight: { width: 200 },
  lowerRightCompact: { width: 150 },

  measureGrid: { flexDirection: "row", flexWrap: "wrap" },
  measureChip: {
    width: "22.5%",
    marginRight: "2.4%",
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 0.8,
    borderColor: colors.line,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 5,
    backgroundColor: colors.paper
  },
  measureChipCompact: { width: "31%", paddingVertical: 2, paddingHorizontal: 3 },
  measureCode: { fontFamily: "Helvetica-Bold", color: colors.wine },
  measureBreak: { width: "100%", height: 0.8, backgroundColor: colors.goldSoft, marginBottom: 4 },
  clothSample: { width: 130, height: 95, objectFit: "cover", borderRadius: 6, borderWidth: 1, borderColor: colors.line },
  clothSampleCompact: { width: 100, height: 72 },
  noteBox: { marginTop: 6, padding: 6, borderRadius: 5, backgroundColor: colors.cream, borderLeftWidth: 2, borderLeftColor: colors.gold, textAlign: "justify" },
  internalNoteBox: { borderLeftColor: colors.rose },

  totalsCard: { borderWidth: 1, borderColor: colors.line, borderRadius: 8, backgroundColor: colors.paper, padding: 9 },
  totalsCardCompact: { padding: 6 },
  totalsTitle: { fontFamily: "Times-Bold", fontSize: 11.5, color: colors.wineInk, marginBottom: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.4 },
  totalLabel: { color: colors.muted },
  totalPart: { paddingLeft: 6, borderLeftWidth: 1.5, borderLeftColor: colors.goldSoft },
  totalPartText: { color: colors.muted, fontSize: 8 },
  totalsTitleCompact: { fontSize: 9.5, marginBottom: 2 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: colors.wine
  },
  grandTotalCompact: { marginTop: 4, paddingTop: 4 },
  grandTotalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11, color: colors.wineInk },
  grandTotalValue: { fontFamily: "Helvetica-Bold", fontSize: 14, color: colors.wine },
  grandTotalValueCompact: { fontSize: 11 },
  totalStrong: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 3, paddingTop: 4 },
  totalStrongText: { fontFamily: "Helvetica-Bold", color: colors.wineInk },

  footer: { marginTop: 14, paddingTop: 8, borderTopWidth: 1.5, borderTopColor: colors.goldSoft, color: colors.muted, fontSize: 7.4 },
  footerCompact: { marginTop: 6, paddingTop: 4, fontSize: 5.9 },
  footerParagraph: { marginBottom: 2.5, textAlign: "justify" },
  terms: { color: colors.muted, fontSize: 7.2 },
  termsCompact: { fontSize: 5.9 },
  termsTitle: { fontFamily: "Helvetica-Bold", color: colors.wineInk, fontSize: 7.4, marginBottom: 3, textTransform: "uppercase" },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 22 },
  signatureRowCompact: { marginTop: 10 },
  signature: { width: 130, borderTopWidth: 0.8, borderTopColor: colors.muted, paddingTop: 3, textAlign: "center", color: colors.muted },
  signatureCompact: { width: 95 },
  thanks: { marginTop: 8, textAlign: "center", fontFamily: "Times-Italic", fontSize: 9.5, color: colors.wine },
  thanksCompact: { fontSize: 7.5, marginTop: 5 },
  pageNumber: { position: "absolute", bottom: 14, right: 28, fontSize: 7, color: colors.muted }
});

export function ReceiptPdfDocument({
  order,
  settings,
  type
}: {
  order: OrderWithCustomer;
  settings: StoreSettings;
  type: ReceiptType;
}) {
  const isCombined = type === "combined";
  return (
    <Document title={`${type}-${order.receiptNumber}`} author={settings.storeName}>
      <Page size="A4" orientation={isCombined ? "landscape" : "portrait"} style={isCombined ? [styles.page, styles.combinedPage] : styles.page}>
        {isCombined ? (
          <View style={styles.panes}>
            <View style={styles.storePane}>
              <PdfPanel order={order} settings={settings} mode="store" compact />
            </View>
            <View style={styles.customerPane}>
              <PdfPanel order={order} settings={settings} mode="customer" compact />
            </View>
          </View>
        ) : (
          <PdfPanel order={order} settings={settings} mode={type} />
        )}
        <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : "")} />
      </Page>
    </Document>
  );
}

function PdfPanel({
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
  const isCustomer = mode === "customer";
  const printableMeasurements = order.measurements.filter((measurement) => isPrintableMeasurementValue(measurement.value));
  const specialNotes = uniqueMeasurementNotes(order.measurements);
  const deliveryDateForPdf = mode === "store" ? addDaysISO(order.deliveryDate, -3) : order.deliveryDate;

  return (
    <View>
      <View style={compact ? [styles.band, styles.bandCompact] : styles.band}>
        <View style={styles.logoFrame}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF Image does not support alt text. */}
          <Image src={storeLogoSource} style={compact ? [styles.logo, styles.logoCompact] : styles.logo} />
        </View>
        <View style={styles.bandText}>
          <Text style={compact ? [styles.storeName, styles.storeNameCompact] : styles.storeName}>{settings.storeName}</Text>
          <Text style={compact ? [styles.bandMuted, styles.bandMutedCompact] : styles.bandMuted}>{settings.addressLines.join(", ")}</Text>
          <Text style={compact ? [styles.bandMuted, styles.bandMutedCompact] : styles.bandMuted}>
            GSTIN {settings.gstin} | {settings.phonePrimary} / {settings.phoneSecondary}
          </Text>
          {compact ? (
            <View style={styles.bandCompactMeta}>
              <Text style={styles.copyPill}>{isCustomer ? "Customer Receipt" : "Store Copy"}</Text>
              <Text style={[styles.receiptNumber, styles.receiptNumberCompact, { marginTop: 0, marginLeft: 6 }]}>{order.receiptNumber ?? "Draft"}</Text>
            </View>
          ) : null}
        </View>
        {compact ? null : (
          <View style={styles.bandRight}>
            <Text style={styles.copyPill}>{isCustomer ? "Customer Receipt" : "Store Copy"}</Text>
            <Text style={styles.receiptNumber}>{order.receiptNumber ?? "Draft"}</Text>
            <Text style={styles.receiptCaption}>Receipt no.</Text>
          </View>
        )}
      </View>

      <View style={compact ? [styles.infoStrip, styles.infoStripCompact] : styles.infoStrip}>
        <Info label="Customer" value={order.customer.fullName} compact={compact} />
        <Info label="Phone" value={order.customer.phonePrimary} compact={compact} />
        <Info label="Order date" value={formatDate(order.orderDate)} compact={compact} />
        <Info label={isCustomer ? "Delivery" : "Ready by"} value={formatDate(deliveryDateForPdf)} compact={compact} highlight last />
      </View>

      <ReceiptPdfItemSummary order={order} mode={mode} compact={compact} />

      <View style={styles.lower}>
        <View style={styles.lowerLeft}>
          {mode === "store" ? (
            <>
              {printableMeasurements.length > 0 ? (
                <View wrap={false}>
                  <SectionHead title="Measurements" meta={`${printableMeasurements.length} recorded`} compact={compact} />
                  <View style={styles.measureGrid}>
                    {printableMeasurements.map((measurement) => (
                      <Fragment key={measurement.id}>
                        <View style={compact ? [styles.measureChip, styles.measureChipCompact] : styles.measureChip}>
                          <Text style={styles.measureCode}>{measurement.displayCode}</Text>
                          <Text>{formatMeasurementValue(measurement.value, measurement.unit)}</Text>
                        </View>
                        {shouldBreakAfterMeasurement(measurement) ? <View style={styles.measureBreak} /> : null}
                      </Fragment>
                    ))}
                  </View>
                </View>
              ) : null}
              {order.clothSampleImageUrl ? (
                <View wrap={false}>
                  <SectionHead title="Cloth Sample" compact={compact} />
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF Image does not support alt text. */}
                  <Image src={order.clothSampleImageUrl} style={compact ? [styles.clothSample, styles.clothSampleCompact] : styles.clothSample} />
                </View>
              ) : null}
              {specialNotes.map((note) => (
                <Text key={note} style={styles.noteBox}>
                  Special Notes: {note}
                </Text>
              ))}
              {order.internalNotes ? <Text style={[styles.noteBox, styles.internalNoteBox]}>Internal: {order.internalNotes}</Text> : null}
            </>
          ) : (
            <>
              {order.customerNotes ? <Text style={[styles.noteBox, { marginTop: 0, marginBottom: 6 }]}>Customer Notes: {order.customerNotes}</Text> : null}
              <Terms paragraphs={customerReceiptFooter} compact={compact} />
            </>
          )}
        </View>
        <View style={compact ? [styles.lowerRight, styles.lowerRightCompact] : styles.lowerRight} wrap={false}>
          <PaymentSummary order={order} compact={compact} />
        </View>
      </View>

      <View style={compact ? [styles.footer, styles.footerCompact] : styles.footer} wrap={false}>
        {isCustomer ? null : <Text style={styles.footerParagraph}>{settings.termsAndConditions}</Text>}
        <View style={compact ? [styles.signatureRow, styles.signatureRowCompact] : styles.signatureRow}>
          <Text style={compact ? [styles.signature, styles.signatureCompact] : styles.signature}>{isCustomer ? "Customer" : "Thank you"}</Text>
          <Text style={compact ? [styles.signature, styles.signatureCompact] : styles.signature}>Authorized Signatory</Text>
        </View>
        {isCustomer ? <Text style={compact ? [styles.thanks, styles.thanksCompact] : styles.thanks}>Thank you for choosing {settings.storeName}</Text> : null}
      </View>
    </View>
  );
}

function Terms({ paragraphs, compact = false }: { paragraphs: string[]; compact?: boolean }) {
  return (
    <View style={compact ? [styles.terms, styles.termsCompact] : styles.terms}>
      <Text style={styles.termsTitle}>Terms</Text>
      {paragraphs.map((paragraph) => (
        <Text key={paragraph} style={styles.footerParagraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

function SectionHead({ title, meta, badge, compact = false }: { title: string; meta?: string; badge?: string; compact?: boolean }) {
  return (
    <View>
      <View style={compact ? [styles.sectionHead, styles.sectionHeadCompact] : styles.sectionHead}>
        <Text style={compact ? [styles.sectionTitle, styles.sectionTitleCompact] : styles.sectionTitle}>{title}</Text>
        {meta || badge ? <Text style={styles.sectionMeta}>{[meta, badge].filter(Boolean).join(" | ")}</Text> : null}
      </View>
      <View style={styles.rule} />
    </View>
  );
}

function ReceiptPdfItemSummary({ order, mode, compact }: { order: OrderWithCustomer; mode: "customer" | "store"; compact: boolean }) {
  return (
    <View>
      <SectionHead
        title="Item summary"
        meta={`${order.items.length} ${order.items.length === 1 ? "garment" : "garments"}`}
        badge={mode === "store" ? "Store Copy" : undefined}
        compact={compact}
      />
      {order.items.map((item, index) => {
        const fabricLength = formatFabricLengthDisplay(item.fabricLength);
        const meta = [
          `Qty ${item.quantity}`,
          fabricLength ? `Fabric ${fabricLength}` : "",
          item.fabricColor ? item.fabricColor : ""
        ]
          .filter(Boolean)
          .join(" | ");
        const rowStyle = [styles.itemRow, ...(compact ? [styles.itemRowCompact] : []), ...(index % 2 === 1 ? [styles.itemRowAlt] : [])];

        return (
          <View key={item.id} style={rowStyle} wrap={false}>
            <Text style={compact ? [styles.itemIndex, styles.itemIndexCompact] : styles.itemIndex}>{index + 1}</Text>
            <View style={styles.itemBody}>
              <Text style={compact ? [styles.itemName, styles.itemNameCompact] : styles.itemName}>
                {item.garmentType}
                <Text style={compact ? [styles.itemMetaInline, styles.itemMetaInlineCompact] : styles.itemMetaInline}>{`   ${meta}`}</Text>
              </Text>
              {item.extraCosts.length ? (
                <Text style={compact ? [styles.itemMeta, styles.itemMetaCompact] : styles.itemMeta}>
                  {item.extraCosts.map((cost) => formatExtraCostLine(cost.label, formatPdfINR(cost.amountPaise))).join(", ")}
                </Text>
              ) : null}
              {mode === "store" && item.stitchingInstructions ? <Text style={styles.itemNote}>{item.stitchingInstructions}</Text> : null}
            </View>
            <Text style={compact ? [styles.itemAmount, styles.itemAmountCompact] : styles.itemAmount}>{formatPdfINR(item.lineTotalPaise)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PaymentSummary({ order, compact }: { order: OrderWithCustomer; compact: boolean }) {
  const lines = billSummaryLines(order.totals, { namedExtras: groupedExtraCosts(order.items), advancePaise: advancePaidPaise(order.payments) });
  // Running calculation: parts add up to the subtotal, taxes are added, any advance is taken off.
  const sign = (line: SummaryLine, index: number) =>
    line.kind === "part" ? (index === 0 ? "" : "+ ") : line.kind === "tax" ? "+ " : line.kind === "discount" || line.kind === "paid" ? "- " : "";

  return (
    <View style={compact ? [styles.totalsCard, styles.totalsCardCompact] : styles.totalsCard}>
      <Text style={compact ? [styles.totalsTitle, styles.totalsTitleCompact] : styles.totalsTitle}>Payment summary</Text>
      {lines.map((line, index) =>
        line.kind === "total" ? (
          <View key={line.key} style={compact ? [styles.grandTotal, styles.grandTotalCompact] : styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>{line.label}</Text>
            <Text style={compact ? [styles.grandTotalValue, styles.grandTotalValueCompact] : styles.grandTotalValue}>{formatPdfINR(line.amountPaise)}</Text>
          </View>
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
    </View>
  );
}

function Info({
  label,
  value,
  compact = false,
  highlight = false,
  last = false
}: {
  label: string;
  value: string;
  compact?: boolean;
  highlight?: boolean;
  last?: boolean;
}) {
  const cellStyle = [styles.infoCell, ...(compact ? [styles.infoCellCompact] : []), ...(last ? [styles.infoCellLast] : []), ...(highlight && !compact ? [styles.infoCellHighlight] : [])];
  return (
    <View style={cellStyle}>
      <Text style={styles.label}>{label}</Text>
      <Text style={compact ? [styles.value, styles.valueCompact] : styles.value}>{value}</Text>
    </View>
  );
}

function Total({ label, value, strong = false, part = false }: { label: string; value: number; strong?: boolean; part?: boolean }) {
  return (
    <View style={strong ? [styles.totalRow, styles.totalStrong] : part ? [styles.totalRow, styles.totalPart] : styles.totalRow}>
      <Text style={strong ? styles.totalStrongText : part ? styles.totalPartText : styles.totalLabel}>{label}</Text>
      <Text style={strong ? styles.totalStrongText : part ? styles.totalPartText : undefined}>{formatPdfINR(value)}</Text>
    </View>
  );
}
