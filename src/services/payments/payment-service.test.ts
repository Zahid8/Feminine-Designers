import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSingle = vi.fn();
const mockSelectEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockInsert = vi.fn();
const mockDeleteEq = vi.fn();
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));
const mockFrom = vi.fn(() => ({ delete: mockDelete, insert: mockInsert, select: mockSelect, update: mockUpdate }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("payment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({
      data: {
        advance_paid: "500.00",
        balance_due: "1200.00",
        grand_total: "1700.00"
      },
      error: null
    });
    mockInsert.mockResolvedValue({ error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
  });

  it("settles an order balance by inserting a payment and marking the order paid", async () => {
    const { settleOrderBalance } = await import("./payment-service");

    await settleOrderBalance("order-1", "UPI");

    expect(mockFrom).toHaveBeenNthCalledWith(1, "orders");
    expect(mockSelect).toHaveBeenCalledWith("advance_paid,balance_due,grand_total");
    expect(mockSelectEq).toHaveBeenCalledWith("id", "order-1");

    expect(mockFrom).toHaveBeenNthCalledWith(2, "payments");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: "order-1",
        amount: "1200.00",
        payment_method: "UPI",
        notes: "Marked paid from dashboard"
      })
    );

    expect(mockFrom).toHaveBeenNthCalledWith(3, "orders");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        advance_paid: "1700.00",
        balance_due: "0.00",
        payment_status: "Paid"
      })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "order-1");
  });

  it("rejects orders that have no outstanding balance", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        advance_paid: "1700.00",
        balance_due: "0.00",
        grand_total: "1700.00"
      },
      error: null
    });
    const { settleOrderBalance } = await import("./payment-service");

    await expect(settleOrderBalance("order-1")).rejects.toThrow("This order has no outstanding balance.");
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("reverses a collected payment and restores order balance", async () => {
    mockSingle
      .mockResolvedValueOnce({
        data: {
          order_id: "order-1",
          amount: "1200.00"
        },
        error: null
      })
      .mockResolvedValueOnce({
        data: {
          advance_paid: "1700.00",
          balance_due: "0.00",
          grand_total: "1700.00"
        },
        error: null
      });
    const { reversePayment } = await import("./payment-service");

    const result = await reversePayment("payment-1");

    expect(result).toEqual({ orderId: "order-1" });
    expect(mockFrom).toHaveBeenNthCalledWith(1, "payments");
    expect(mockSelect).toHaveBeenNthCalledWith(1, "order_id,amount");
    expect(mockSelectEq).toHaveBeenNthCalledWith(1, "id", "payment-1");
    expect(mockFrom).toHaveBeenNthCalledWith(3, "payments");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "payment-1");
    expect(mockFrom).toHaveBeenNthCalledWith(4, "orders");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        advance_paid: "500.00",
        balance_due: "1200.00",
        payment_status: "Partial"
      })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "order-1");
  });

  it("marks an order unpaid by clearing payments and restoring the full balance", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        advance_paid: "1700.00",
        balance_due: "0.00",
        grand_total: "1700.00"
      },
      error: null
    });
    const { setOrderPaymentStatus } = await import("./payment-service");

    await setOrderPaymentStatus("order-1", "Unpaid");

    expect(mockFrom).toHaveBeenNthCalledWith(1, "orders");
    expect(mockFrom).toHaveBeenNthCalledWith(2, "payments");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockDeleteEq).toHaveBeenCalledWith("order_id", "order-1");
    expect(mockFrom).toHaveBeenNthCalledWith(3, "orders");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        advance_paid: "0.00",
        balance_due: "1700.00",
        payment_status: "Unpaid"
      })
    );
  });

  it("marks an order paid by replacing payments with a full settlement payment", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        advance_paid: "500.00",
        balance_due: "1200.00",
        grand_total: "1700.00"
      },
      error: null
    });
    const { setOrderPaymentStatus } = await import("./payment-service");

    await setOrderPaymentStatus("order-1", "Paid");

    expect(mockFrom).toHaveBeenNthCalledWith(2, "payments");
    expect(mockDeleteEq).toHaveBeenCalledWith("order_id", "order-1");
    expect(mockFrom).toHaveBeenNthCalledWith(3, "payments");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: "order-1",
        amount: "1700.00",
        payment_method: "Cash",
        notes: "Marked paid from order edit"
      })
    );
    expect(mockFrom).toHaveBeenNthCalledWith(4, "orders");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        advance_paid: "1700.00",
        balance_due: "0.00",
        payment_status: "Paid"
      })
    );
  });
});
