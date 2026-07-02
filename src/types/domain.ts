export type StaffRole = "admin" | "staff";

export type OrderStatus =
  | "Draft"
  | "New"
  | "In Stitching"
  | "Ready"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus = "Unpaid" | "Partial" | "Paid" | "Credit";
export type Priority = "Normal" | "Urgent" | "Express";
export type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Mixed";
export type PreferredCommunication = "Phone" | "WhatsApp" | "SMS" | "Email";
export type MeasurementInputType = "number" | "text" | "checkbox" | "textarea";
export type ReceiptType = "customer" | "store" | "combined";

export interface StoreSettings {
  id: string;
  storeName: string;
  brandSubtitle: string;
  gstin: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  addressLines: string[];
  logoPath: string;
  defaultCgstRate: number;
  defaultSgstRate: number;
  receiptPrefix: string;
  receiptResetFrequency: "yearly" | "never";
  currencyCode: "INR";
  measurementUnitDefault: "in";
  termsAndConditions: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  fullName: string;
  phonePrimary: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  birthDate?: string;
  notes?: string;
  preferredCommunication: PreferredCommunication;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GarmentType {
  id: string;
  name: string;
  active: boolean;
}

export interface OrderItem {
  id: string;
  garmentType: string;
  customGarmentType?: string;
  quantity: number;
  ratePaise: number;
  discountPaise: number;
  stitchingCostPaise: number;
  fabricPricePaise: number;
  dyePricePaise: number;
  lineTotalPaise: number;
  fabricLength?: string;
  delivered?: boolean;
  deliveredAt?: string;
  fabricColor?: string;
  designReference?: string;
  stitchingInstructions?: string;
  sortOrder: number;
}

export interface MeasurementTemplateField {
  id: string;
  fieldKey: string;
  displayCode: string;
  displayLabel: string;
  longLabel?: string;
  inputType: MeasurementInputType;
  unit: "in" | "text" | "boolean";
  isRequired: boolean;
  sortOrder: number;
  active: boolean;
}

export interface MeasurementTemplate {
  id: string;
  name: string;
  garmentCategories: string[];
  description?: string;
  isActive: boolean;
  fields: MeasurementTemplateField[];
}

export interface MeasurementValue {
  id: string;
  templateId?: string;
  orderItemId?: string;
  orderItemSortOrder?: number;
  fieldKey: string;
  displayCode: string;
  displayLabel: string;
  value: string;
  unit: string;
  notes?: string;
  sortOrder: number;
}

export interface Payment {
  id: string;
  orderId: string;
  amountPaise: number;
  method: PaymentMethod;
  paymentReference?: string;
  paidAt: string;
  notes?: string;
}

export interface StatusHistoryEntry {
  id: string;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedAt: string;
  changedBy: string;
  notes?: string;
}

export interface OrderTotals {
  subtotalPaise: number;
  itemDiscountTotalPaise: number;
  orderDiscountPaise: number;
  accessoriesCostPaise: number;
  stitchingCostPaise: number;
  fabricPricePaise: number;
  dyePricePaise: number;
  taxableAmountPaise: number;
  cgstRate: number;
  cgstAmountPaise: number;
  sgstRate: number;
  sgstAmountPaise: number;
  grandTotalPaise: number;
  totalPaidPaise: number;
  balanceDuePaise: number;
  paymentStatus: PaymentStatus;
}

export interface Order {
  id: string;
  receiptNumber?: string;
  customerId: string;
  status: OrderStatus;
  priority: Priority;
  orderDate: string;
  deliveryDate: string;
  assignedTailor?: string;
  clothSampleImageUrl?: string;
  internalNotes?: string;
  customerNotes?: string;
  items: OrderItem[];
  measurements: MeasurementValue[];
  payments: Payment[];
  statusHistory: StatusHistoryEntry[];
  totals: OrderTotals;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithCustomer extends Order {
  customer: Customer;
}

export interface DashboardSummary {
  ordersToday: number;
  deliveriesToday: number;
  pendingOrders: number;
  overdueOrders: number;
  amountCollectedTodayPaise: number;
  totalOutstandingPaise: number;
}
