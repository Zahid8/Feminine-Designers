import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Fragment } from "react";
import type { OrderWithCustomer, ReceiptType, StoreSettings } from "@/types/domain";
import { addDaysISO, formatDate } from "@/lib/utils/date";
import { paiseToRupees } from "@/lib/utils/money";
import { formatMeasurementValue, isPrintableMeasurementValue } from "@/lib/utils/measurement-display";
import { shouldBreakAfterMeasurement } from "@/lib/utils/measurement-sections";
import { getPublicPngDataUri } from "@/lib/utils/pdf-assets";
import { uniqueMeasurementNotes } from "@/lib/utils/receipt-notes";

const customerReceiptFooter = [
  "Delivery date is approximate. Please bring this receipt at the time of delivery.",
  "Alterations requested after delivery may be chargeable. Cancellation charges: Rs. 500.",
  "Conditions apply: Garments must be collected within 30 days of the delivery date. We will not be responsible for garments not collected within this period, and such garments may be sold to recover pending charges. Any required alterations will be completed by us within one week. Thank you. Authorized Signatory"
];
const storeLogoSource = getPublicPngDataUri("Logo.PNG");

function formatPdfINR(paise: number) {
  return `Rs. ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(paiseToRupees(paise))}`;
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#2c2522"
  },
  combinedPage: {
    padding: 16,
    fontSize: 7.5
  },
  panel: {},
  panelCompact: {
    fontSize: 7.5
  },
  title: {
    fontSize: 18,
    color: "#5d1428",
    marginBottom: 5
  },
  titleCompact: {
    fontSize: 13
  },
  muted: {
    color: "#6f625d"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#d8c7b4"
  },
  headerText: {
    flexGrow: 1,
    flexShrink: 1,
    paddingRight: 6
  },
  storeLogo: {
    width: 44,
    height: 44,
    objectFit: "cover"
  },
  storeLogoCompact: {
    width: 36,
    height: 36
  },
  row: {
    flexDirection: "row",
    gap: 8
  },
  storePane: {
    width: "66%",
    paddingRight: 12
  },
  customerPane: {
    width: "34%",
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: "#7c6d66",
    borderStyle: "dashed"
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eadfce"
  },
  infoGridCompact: {
    paddingVertical: 6
  },
  infoCell: {
    width: "50%",
    paddingRight: 8,
    paddingBottom: 7
  },
  infoCellCompact: {
    paddingBottom: 4
  },
  label: {
    color: "#7c6d66",
    fontSize: 7.5,
    textTransform: "uppercase",
    marginBottom: 2
  },
  value: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold"
  },
  table: {
    marginTop: 10
  },
  itemHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eadfce",
    paddingBottom: 6
  },
  itemRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee2d3",
    paddingVertical: 7
  },
  itemRowCompact: {
    paddingVertical: 4
  },
  itemName: { width: "26%" },
  itemFabric: { width: "12%" },
  numeric: { width: "8.85%", textAlign: "right" },
  itemInstruction: {
    marginTop: 2,
    color: "#6f625d",
    fontSize: 8
  },
  storeSection: {
    marginTop: 14
  },
  storeSectionCompact: {
    marginTop: 8
  },
  sectionTitle: {
    color: "#4c1525",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6
  },
  sectionTitleCompact: {
    fontSize: 10,
    marginBottom: 4
  },
  totalsBox: {
    width: 190,
    alignSelf: "flex-end",
    marginTop: 14
  },
  totalsBoxCompact: {
    width: 145,
    marginTop: 8
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2
  },
  totalStrong: {
    borderTopWidth: 1,
    borderTopColor: "#d8c7b4",
    paddingTop: 4,
    fontFamily: "Helvetica-Bold"
  },
  measureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  measure: {
    width: "31%",
    borderWidth: 1,
    borderColor: "#e8dcca",
    padding: 4,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  measureCompact: {
    padding: 3
  },
  measureCode: {
    fontFamily: "Helvetica-Bold"
  },
  measureBreak: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#d8c7b4",
    marginVertical: 2
  },
  clothSample: {
    width: 160,
    height: 110,
    objectFit: "cover",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e8dcca"
  },
  internalNote: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#eadfce",
    padding: 6
  },
  noteBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#eadfce",
    padding: 6
  },
  footer: {
    marginTop: 18,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "#eadfce",
    color: "#6f625d",
    fontSize: 8
  },
  footerCompact: {
    marginTop: 8,
    paddingTop: 6,
    fontSize: 6.6
  },
  footerParagraph: {
    marginBottom: 4,
    lineHeight: 1.35
  },
  signatureRow: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  signatureRowCompact: {
    marginTop: 14
  }
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
    <Document title={`${type}-${order.receiptNumber}`}>
      <Page size="A4" orientation={isCombined ? "landscape" : "portrait"} style={isCombined ? [styles.page, styles.combinedPage] : styles.page}>
        {isCombined ? (
          <View style={styles.row}>
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
  const printableMeasurements = order.measurements.filter((measurement) => isPrintableMeasurementValue(measurement.value));
  const specialNotes = uniqueMeasurementNotes(order.measurements);
  const deliveryDateForPdf = mode === "store" ? addDaysISO(order.deliveryDate, -3) : order.deliveryDate;

  return (
    <View style={compact ? styles.panelCompact : styles.panel}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={compact ? [styles.title, styles.titleCompact] : styles.title}>{settings.storeName}</Text>
          <Text style={styles.muted}>{settings.addressLines.join("\n")}</Text>
          <Text style={styles.muted}>
            GSTIN {settings.gstin} | {settings.phonePrimary} / {settings.phoneSecondary}
          </Text>
        </View>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF Image does not support alt text. */}
        <Image src={storeLogoSource} style={compact ? [styles.storeLogo, styles.storeLogoCompact] : styles.storeLogo} />
      </View>
      <View style={compact ? [styles.infoGrid, styles.infoGridCompact] : styles.infoGrid}>
        <Info label="Receipt" value={order.receiptNumber ?? "Draft"} compact={compact} />
        <Info label="Copy" value={mode === "store" ? "Store Copy" : "Customer Copy"} compact={compact} />
        <Info label="Customer" value={order.customer.fullName} compact={compact} />
        <Info label="Phone" value={order.customer.phonePrimary} compact={compact} />
        <Info label="Order date" value={formatDate(order.orderDate)} compact={compact} />
        <Info label="Delivery" value={formatDate(deliveryDateForPdf)} compact={compact} />
      </View>
      <View style={styles.table}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemName, styles.label]}>Garment</Text>
          <Text style={[styles.itemFabric, styles.label]}>Fabric</Text>
          <Text style={[styles.numeric, styles.label]}>Qty</Text>
          <Text style={[styles.numeric, styles.label]}>Rate</Text>
          <Text style={[styles.numeric, styles.label]}>Stitching</Text>
          <Text style={[styles.numeric, styles.label]}>Fabric</Text>
          <Text style={[styles.numeric, styles.label]}>Dye</Text>
          <Text style={[styles.numeric, styles.label]}>Extra</Text>
          <Text style={[styles.numeric, styles.label]}>Amount</Text>
        </View>
        {order.items.map((item) => (
          <View key={item.id} style={compact ? [styles.itemRow, styles.itemRowCompact] : styles.itemRow}>
            <View style={styles.itemName}>
              <Text style={styles.value}>{item.garmentType}</Text>
              {item.extraCosts.length ? (
                <Text style={styles.itemInstruction}>
                  Extra: {item.extraCosts.map((cost) => `${cost.label} ${formatPdfINR(cost.amountPaise)}`).join(", ")}
                </Text>
              ) : null}
              {mode === "store" && item.stitchingInstructions ? (
                <Text style={styles.itemInstruction}>{item.stitchingInstructions}</Text>
              ) : null}
            </View>
            <Text style={styles.itemFabric}>{item.fabricLength ?? "-"}</Text>
            <Text style={styles.numeric}>{item.quantity}</Text>
            <Text style={styles.numeric}>{formatPdfINR(item.ratePaise)}</Text>
            <Text style={styles.numeric}>{formatPdfINR(item.stitchingCostPaise)}</Text>
            <Text style={styles.numeric}>{formatPdfINR(item.fabricPricePaise)}</Text>
            <Text style={styles.numeric}>{formatPdfINR(item.dyePricePaise)}</Text>
            <Text style={styles.numeric}>{formatPdfINR(item.extraCostPaise)}</Text>
            <Text style={styles.numeric}>{formatPdfINR(item.lineTotalPaise)}</Text>
          </View>
        ))}
      </View>
      {mode === "store" ? (
        <View style={compact ? [styles.storeSection, styles.storeSectionCompact] : styles.storeSection}>
          {order.clothSampleImageUrl ? (
            <View style={compact ? [styles.storeSection, styles.storeSectionCompact] : styles.storeSection}>
              <Text style={compact ? [styles.sectionTitle, styles.sectionTitleCompact] : styles.sectionTitle}>Cloth Sample</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF Image does not support alt text. */}
              <Image src={order.clothSampleImageUrl} style={styles.clothSample} />
            </View>
          ) : null}
          {printableMeasurements.length > 0 ? (
            <View style={compact ? [styles.storeSection, styles.storeSectionCompact] : styles.storeSection}>
              <Text style={compact ? [styles.sectionTitle, styles.sectionTitleCompact] : styles.sectionTitle}>Measurements</Text>
              <View style={styles.measureGrid}>
                {printableMeasurements.map((measurement) => (
                  <Fragment key={measurement.id}>
                    <View style={compact ? [styles.measure, styles.measureCompact] : styles.measure}>
                      <Text style={styles.measureCode}>{measurement.displayCode}</Text>
                      <Text>{formatMeasurementValue(measurement.value, measurement.unit)}</Text>
                    </View>
                    {shouldBreakAfterMeasurement(measurement) ? <View style={styles.measureBreak} /> : null}
                  </Fragment>
                ))}
              </View>
            </View>
          ) : null}
          {specialNotes.map((note) => (
            <Text key={note} style={styles.noteBox}>
              Special Notes: {note}
            </Text>
          ))}
          {order.internalNotes ? <Text style={styles.internalNote}>Internal: {order.internalNotes}</Text> : null}
        </View>
      ) : null}
      <View style={compact ? [styles.totalsBox, styles.totalsBoxCompact] : styles.totalsBox}>
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
      </View>
      <View style={compact ? [styles.footer, styles.footerCompact] : styles.footer}>
        {mode === "customer" ? (
          <>
            {order.customerNotes ? <Text style={styles.noteBox}>Customer Notes: {order.customerNotes}</Text> : null}
            {customerReceiptFooter.map((paragraph) => (
              <Text key={paragraph} style={styles.footerParagraph}>
                {paragraph}
              </Text>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.footerParagraph}>{settings.termsAndConditions}</Text>
            <View style={compact ? [styles.signatureRow, styles.signatureRowCompact] : styles.signatureRow}>
              <Text>Thank you</Text>
              <Text>Authorized Signatory</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Info({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <View style={compact ? [styles.infoCell, styles.infoCellCompact] : styles.infoCell}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Total({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <View style={strong ? [styles.totalRow, styles.totalStrong] : styles.totalRow}>
      <Text>{label}</Text>
      <Text>{formatPdfINR(value)}</Text>
    </View>
  );
}
