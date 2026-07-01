import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Fragment } from "react";
import type { OrderWithCustomer, ReceiptType, StoreSettings } from "@/types/domain";
import { formatINR } from "@/lib/utils/money";
import { formatMeasurementValue, isPrintableMeasurementValue } from "@/lib/utils/measurement-display";
import { shouldBreakAfterMeasurement } from "@/lib/utils/measurement-sections";

const customerReceiptFooter = [
  "Delivery date is approximate. Please bring this receipt at the time of delivery.",
  "Alterations requested after delivery may be chargeable. Cancellation charges: ₹500.",
  "Conditions apply: Garments must be collected within 30 days of the delivery date. We will not be responsible for garments not collected within this period, and such garments may be sold to recover pending charges. Any required alterations will be completed by us within one week. Thank you. Authorized Signatory"
];
const storeLogoSource = `${process.cwd()}/public/Logo.PNG`;

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#2c2522"
  },
  title: {
    fontSize: 18,
    color: "#5d1428",
    marginBottom: 2
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8
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
  section: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#e8dcca"
  },
  itemRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee2d3",
    paddingVertical: 4
  },
  itemName: { width: "45%" },
  itemFabric: { width: "19%" },
  numeric: { width: "18%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2
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
    padding: 3
  },
  measureBreak: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#d8c7b4",
    marginVertical: 2
  },
  clothSample: {
    width: 120,
    height: 90,
    objectFit: "cover",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e8dcca"
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
      <Page size="A4" orientation={isCombined ? "landscape" : "portrait"} style={styles.page}>
        {isCombined ? (
          <View style={styles.row}>
            <View style={styles.storePane}>
              <PdfPanel order={order} settings={settings} mode="store" />
            </View>
            <View style={styles.customerPane}>
              <PdfPanel order={order} settings={settings} mode="customer" />
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
  mode
}: {
  order: OrderWithCustomer;
  settings: StoreSettings;
  mode: "customer" | "store";
}) {
  const printableMeasurements = order.measurements.filter((measurement) => isPrintableMeasurementValue(measurement.value));

  return (
    <View>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{settings.storeName}</Text>
          <Text>{settings.brandSubtitle}</Text>
          <Text>{settings.addressLines.join(", ")}</Text>
          <Text>
            GSTIN {settings.gstin} | {settings.phonePrimary} / {settings.phoneSecondary}
          </Text>
        </View>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF Image does not support alt text. */}
        <Image src={storeLogoSource} style={styles.storeLogo} />
      </View>
      <View style={styles.section}>
        <Text>
          {mode === "store" ? "Store Copy" : "Customer Copy"} | Receipt {order.receiptNumber}
        </Text>
        <Text>
          {order.customer.fullName} | {order.customer.phonePrimary}
        </Text>
        <Text>
          Order {order.orderDate} | Delivery {order.deliveryDate}
        </Text>
      </View>
      <View style={styles.section}>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.garmentType}</Text>
            <Text style={styles.itemFabric}>{item.fabricLength ?? "-"}</Text>
            <Text style={styles.numeric}>{item.quantity}</Text>
            <Text style={styles.numeric}>{formatINR(item.ratePaise)}</Text>
            <Text style={styles.numeric}>{formatINR(item.lineTotalPaise)}</Text>
          </View>
        ))}
      </View>
      {mode === "store" ? (
        <View style={styles.section}>
          {order.clothSampleImageUrl ? (
            <View>
              <Text>Cloth Sample</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF Image does not support alt text. */}
              <Image src={order.clothSampleImageUrl} style={styles.clothSample} />
            </View>
          ) : null}
          {printableMeasurements.length > 0 ? (
            <>
              <Text>Measurements</Text>
              <View style={styles.measureGrid}>
                {printableMeasurements.map((measurement) => (
                  <Fragment key={measurement.id}>
                    <View style={styles.measure}>
                      <Text>
                        {measurement.displayCode}: {formatMeasurementValue(measurement.value, measurement.unit)}
                      </Text>
                    </View>
                    {shouldBreakAfterMeasurement(measurement) ? <View style={styles.measureBreak} /> : null}
                  </Fragment>
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : null}
      <View style={styles.section}>
        <Total label="Subtotal" value={order.totals.subtotalPaise} />
        <Total label="Accessories" value={order.totals.accessoriesCostPaise} />
        <Total label="Stitching" value={order.totals.stitchingCostPaise} />
        <Total label="Discount" value={-order.totals.orderDiscountPaise} />
        <Total label="CGST" value={order.totals.cgstAmountPaise} />
        <Total label="SGST" value={order.totals.sgstAmountPaise} />
        <Total label="Grand Total" value={order.totals.grandTotalPaise} />
        <Total label="Advance" value={order.totals.totalPaidPaise} />
        <Total label="Balance" value={order.totals.balanceDuePaise} />
      </View>
      <View style={styles.section}>
        {mode === "customer" ? (
          customerReceiptFooter.map((paragraph) => <Text key={paragraph}>{paragraph}</Text>)
        ) : (
          <>
            <Text>{settings.termsAndConditions}</Text>
            <Text>Thank you | Authorized Signatory</Text>
          </>
        )}
      </View>
    </View>
  );
}

function Total({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.totalRow}>
      <Text>{label}</Text>
      <Text>{formatINR(value)}</Text>
    </View>
  );
}
