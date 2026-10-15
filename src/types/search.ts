import type { OrderStatus } from "@/types/domain";

export interface SearchOrderResult {
  id: string;
  receiptNumber: string | null;
  customerName: string;
  phone: string;
  status: OrderStatus;
  deliveryDate: string;
}

export interface SearchCustomerResult {
  id: string;
  fullName: string;
  phone: string;
}

export interface SearchResults {
  orders: SearchOrderResult[];
  customers: SearchCustomerResult[];
}
