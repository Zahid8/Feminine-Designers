import { beforeEach, describe, expect, it, vi } from "vitest";

const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockUpdateEq = vi.fn();
const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
const mockFrom = vi.fn(() => ({ insert: mockInsert, update: mockUpdate }));

vi.mock("@/lib/supabase/admin", () => ({
  hasSupabaseAdminEnv: vi.fn(() => true),
  createSupabaseAdminClient: vi.fn(() => ({ from: mockFrom }))
}));

describe("customer record service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: "customer-1" }, error: null });
    mockUpdateEq.mockResolvedValue({ error: null });
  });

  it("creates a customer record and returns its id", async () => {
    const { createCustomerRecord } = await import("./customer-record-service");

    const customerId = await createCustomerRecord({
      fullName: "Bebu",
      phonePrimary: "9000000001",
      phoneSecondary: "",
      email: "",
      address: "Gurugram",
      notes: "VIP"
    });

    expect(customerId).toBe("customer-1");
    expect(mockFrom).toHaveBeenCalledWith("customers");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: "Bebu",
        phone_primary: "9000000001",
        address: "Gurugram",
        notes: "VIP"
      })
    );
  });

  it("archives a customer record instead of hard deleting order history", async () => {
    const { archiveCustomerRecord } = await import("./customer-record-service");

    await archiveCustomerRecord("customer-1");

    expect(mockFrom).toHaveBeenCalledWith("customers");
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ archived_at: expect.any(String) }));
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "customer-1");
  });

  it("updates a customer's primary phone number", async () => {
    const { updateCustomerContact } = await import("./customer-record-service");

    await updateCustomerContact("customer-1", { phonePrimary: " 9876543210 " });

    expect(mockFrom).toHaveBeenCalledWith("customers");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        phone_primary: "9876543210",
        updated_at: expect.any(String)
      })
    );
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "customer-1");
  });
});
