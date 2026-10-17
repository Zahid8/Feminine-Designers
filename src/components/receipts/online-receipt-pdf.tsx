import { Document, Image, Link, Page, Text, View } from "@react-pdf/renderer";
import { colors, formatPdfINR, Info, SectionHead, storeLogoSource, styles, Terms, Total } from "@/components/receipts/receipt-pdf";
import { ONLINE_ORDER_TERMS } from "@/lib/constants/business";
import { onlineBillAmounts } from "@/lib/online-orders/online-bill";
import { formatDate } from "@/lib/utils/date";
import { rupeesToPaise } from "@/lib/utils/money";
import { ORDER_TYPE_LABELS, orderTypeOf, stageLabel, type OnlineOrder } from "@/services/online-orders/online-order-service";
import type { StoreSettings } from "@/types/domain";

/**
 * Customer bill for a webstore (online) order, in the same design as the in-store
 * customer receipt: wine header, info strip, item summary, payment summary, terms.
 */
export function OnlineReceiptPdfDocument({ order, settings }: { order: OnlineOrder; settings: StoreSettings }) {
  const amounts = onlineBillAmounts(order);
  const paid = order.payment_status === "paid";
  return (
    <Document title={`Bill-${order.order_number}`} author={settings.storeName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.band}>
          <View style={styles.logoFrame}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- React-PDF Image does not support alt text. */}
            <Image src={storeLogoSource} style={styles.logo} />
          </View>
          <View style={styles.bandText}>
            <Text style={styles.storeName}>{settings.storeName}</Text>
            <Text style={styles.bandMuted}>{settings.addressLines.join(", ")}</Text>
            <Text style={styles.bandMuted}>
              GSTIN {settings.gstin} | {settings.phonePrimary}
              {settings.phoneSecondary ? ` / ${settings.phoneSecondary}` : ""}
            </Text>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.copyPill}>Online Order Bill</Text>
            <Text style={styles.receiptNumber}>{order.order_number}</Text>
            <Text style={styles.receiptCaption}>Order no.</Text>
          </View>
        </View>

        <View style={styles.infoStrip}>
          <Info label="Customer" value={order.customer.name} />
          <Info label="Phone" value={order.customer.phone || "—"} />
          <Info label="Order date" value={formatDate(order.created_at)} />
          <Info label="Status" value={stageLabel(order.status, order.status_label)} highlight last />
        </View>

        <SectionHead
          title="Item summary"
          meta={`${order.item_count} ${order.item_count === 1 ? "piece" : "pieces"}`}
          badge={ORDER_TYPE_LABELS[orderTypeOf(order)]}
        />
        {order.items.map((item, index) => {
          const meta = [`Qty ${item.quantity}`, item.made_to_measure ? "Custom size" : item.size ? `Size ${item.size}` : "", item.color]
            .filter(Boolean)
            .join(" | ");
          const measurements = item.customization_summary.map((row) => `${row.label} ${row.value}`).join(" · ");
          return (
            <View key={`${item.sku}-${index}`} style={index % 2 === 1 ? [styles.itemRow, styles.itemRowAlt] : styles.itemRow} wrap={false}>
              <Text style={styles.itemIndex}>{index + 1}</Text>
              <View style={styles.itemBody}>
                <Text style={styles.itemName}>
                  {item.product_name}
                  <Text style={styles.itemMetaInline}>{`   ${meta}`}</Text>
                </Text>
                {item.sku ? <Text style={styles.itemMeta}>SKU {item.sku} · {formatPdfINR(rupeesToPaise(Number.parseFloat(item.unit_price) || 0))} each</Text> : null}
                {measurements ? <Text style={styles.itemMeta}>Measurements: {measurements}</Text> : null}
                {item.customization?.notes ? <Text style={styles.itemNote}>“{item.customization.notes}”</Text> : null}
              </View>
              <Text style={styles.itemAmount}>{formatPdfINR(rupeesToPaise(Number.parseFloat(item.line_total) || 0))}</Text>
            </View>
          );
        })}

        <View style={styles.lower}>
          <View style={styles.lowerLeft}>
            <SectionHead title="Delivery address" />
            <Text style={[styles.noteBox, { marginTop: 2 }]}>{order.shipping_address || "—"}</Text>
            {order.location_url ? (
              <Link src={order.location_url} style={{ marginTop: 4, fontSize: 8, color: colors.wine }}>
                Google Maps location: {order.location_url}
              </Link>
            ) : null}
            {order.notes ? <Text style={styles.noteBox}>Customer Notes: {order.notes}</Text> : null}
            <View style={{ marginTop: 10 }}>
              <Terms paragraphs={ONLINE_ORDER_TERMS} />
            </View>
          </View>
          <View style={styles.lowerRight} wrap={false}>
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Payment summary</Text>
              <Total label="Items" value={amounts.subtotalPaise} />
              {amounts.discountPaise > 0 ? <Total label="− Discount" value={amounts.discountPaise} /> : null}
              <Total label={amounts.shippingPaise > 0 ? "+ Shipping" : "Shipping (free)"} value={amounts.shippingPaise} />
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>{formatPdfINR(amounts.totalPaise)}</Text>
              </View>
              <Total label={paid ? "− Paid" : "Paid"} value={amounts.paidPaise} />
              <Total label="Balance" value={amounts.balancePaise} strong />
              <Text style={{ marginTop: 6, fontSize: 7.4, color: paid ? colors.success : colors.muted }}>
                {order.payment_method_label} · {order.payment_status_label}
                {order.payment_reference ? ` · Ref ${order.payment_reference}` : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer} wrap={false}>
          <View style={styles.signatureRow}>
            <Text style={styles.signature}>Customer</Text>
            <Text style={styles.signature}>Authorized Signatory</Text>
          </View>
          <Text style={styles.thanks}>Thank you for choosing {settings.storeName}</Text>
        </View>
        <Text style={styles.pageNumber} fixed render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : "")} />
      </Page>
    </Document>
  );
}
