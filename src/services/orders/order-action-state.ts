export interface OrderActionState {
  status: "idle" | "success" | "error";
  message: string;
  orderId?: string;
  receiptNumber?: string;
  redirectTo?: string;
}

export const initialOrderActionState: OrderActionState = {
  status: "idle",
  message: ""
};
