import type { OnlineOrder, OnlineOrderItem } from "@/services/online-orders/online-order-service";

/** Test fixture: a webstore order with one ready-made and one custom-size piece. */
const item = (overrides: Partial<OnlineOrderItem> = {}): OnlineOrderItem => ({
  product_name: "Silk Blouse",
  sku: "FD-1",
  quantity: 1,
  unit_price: "2400.00",
  discount_amount: "0.00",
  line_total: "2400.00",
  color: "",
  size: "M",
  made_to_measure: false,
  customization: null,
  customization_summary: [],
  product_url: null,
  ...overrides
});

export const onlineOrder = (overrides: Partial<OnlineOrder> = {}): OnlineOrder => ({
  order_number: "FD-20261017-ABC123",
  status: "confirmed",
  status_label: "Confirmed",
  payment_status: "pending",
  payment_status_label: "Pending",
  payment_method: "manual_upi",
  payment_method_label: "Manual UPI",
  payment_reference: "",
  paid_at: null,
  created_at: "2026-10-17T10:00:00+05:30",
  updated_at: "2026-10-17T10:00:00+05:30",
  customer: { name: "Asha Rao", email: "asha@example.com", phone: "9876543210", account_id: null },
  shipping_address: "12 MG Road, Pune",
  location_url: "https://maps.app.goo.gl/AbC123",
  notes: "",
  currency: "INR",
  subtotal: "4800.00",
  discount_total: "200.00",
  shipping_total: "100.00",
  total: "4700.00",
  item_count: 2,
  has_made_to_measure: true,
  order_type: "mixed",
  items: [
    item(),
    item({ product_name: "Zari Blouse", size: "Made to measure", made_to_measure: true, customization_summary: [{ label: "Chest", value: "36 in" }] })
  ],
  links: { admin: "", staff: "" },
  ...overrides
});
