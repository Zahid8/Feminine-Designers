import { describe, expect, it } from "vitest";
import { renderTemplate } from "./render-template";

describe("renderTemplate", () => {
  it("fills placeholders", () => {
    expect(renderTemplate("Hello {name}, balance {balance}.", { name: "Abha", balance: "₹500.00" })).toBe("Hello Abha, balance ₹500.00.");
  });

  it("drops a labelled line whose only value is empty", () => {
    expect(renderTemplate("Receipt: {receipt}\nYour bill: {bill_link}", { receipt: "SJD-1" })).toBe("Receipt: SJD-1");
  });

  it("removes an empty inline placeholder together with its label", () => {
    expect(renderTemplate("Ready. Bill: {bill_link} Thank you!", {})).toBe("Ready. Thank you!");
  });

  it("leaves unknown placeholders visible so typos are noticed", () => {
    expect(renderTemplate("Hi {nmae}", { name: "Abha" })).toBe("Hi {nmae}");
  });
});
