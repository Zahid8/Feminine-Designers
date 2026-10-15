import { describe, expect, it } from "vitest";
import { orders } from "@/lib/data/mock";
import { ordersToCsv } from "./orders-csv";

describe("ordersToCsv", () => {
  it("writes a header row and escapes commas, quotes, and formula-like names", () => {
    const order = { ...orders[0], customer: { ...orders[0].customer, fullName: '=Tanya, "T"' } };
    const [header, row] = ordersToCsv([order]).split("\r\n");
    expect(header).toBe("Receipt,Order date,Delivery date,Customer,Phone,Status,Garments,Grand total,Paid,Balance,Payment status");
    expect(row).toContain(`"'=Tanya, ""T"""`);
  });
});
