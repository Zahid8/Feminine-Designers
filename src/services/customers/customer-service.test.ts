import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOrder = vi.fn();
const mockIs = vi.fn(() => ({ order: mockOrder }));
const mockSelect = vi.fn(() => ({ is: mockIs }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("customer-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists customers from Supabase instead of the local mock data", async () => {
    mockOrder.mockResolvedValueOnce({
      data: [
        {
          id: "customer-live-1",
          customer_code: "CUST-LIVE",
          full_name: "Bebu",
          phone_primary: "9000000001",
          phone_secondary: null,
          email: null,
          address: null,
          birth_date: null,
          notes: null,
          preferred_communication: "WhatsApp",
          tags: ["live"],
          created_at: "2026-07-01T08:30:00.000Z",
          updated_at: "2026-07-01T08:30:00.000Z"
        }
      ],
      error: null
    });

    const { listCustomers } = await import("./customer-service");

    const customers = await listCustomers("bebu");

    expect(mockFrom).toHaveBeenCalledWith("customers");
    expect(mockIs).toHaveBeenCalledWith("archived_at", null);
    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({
      id: "customer-live-1",
      customerCode: "CUST-LIVE",
      fullName: "Bebu",
      phonePrimary: "9000000001"
    });
  });
});
