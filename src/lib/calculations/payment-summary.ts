import type { OrderTotals } from "@/types/domain";

export type SummaryLineKind = "part" | "subtotal" | "discount" | "tax" | "total" | "paid" | "balance";

export interface SummaryLine {
  key: string;
  label: string;
  amountPaise: number;
  kind: SummaryLineKind;
}

type SummaryTotals = Pick<
  OrderTotals,
  | "subtotalPaise"
  | "accessoriesCostPaise"
  | "stitchingCostPaise"
  | "fabricPricePaise"
  | "dyePricePaise"
  | "extraCostPaise"
  | "orderDiscountPaise"
  | "cgstRate"
  | "cgstAmountPaise"
  | "sgstRate"
  | "sgstAmountPaise"
  | "grandTotalPaise"
  | "totalPaidPaise"
  | "balanceDuePaise"
>;

function percent(rate: number) {
  return `${Number.isInteger(rate) ? rate : rate.toFixed(2).replace(/0+$/, "")}%`;
}

/**
 * Bill summary in reading order. Stitching, fabric, dye, extras and accessories are
 * already part of the subtotal, so they are listed *before* it as the parts that add
 * up to it ("part" lines), never after it where they would look like extra charges.
 * Garment charges are whatever remains of the subtotal (rate × qty, after any item
 * discount). Zero parts are left out; if garments are the only part, the breakdown is
 * skipped because it would just repeat the subtotal.
 */
export function paymentSummaryLines(totals: SummaryTotals, options: { namedExtras?: { label: string; amountPaise: number }[] } = {}): SummaryLine[] {
  const otherParts: SummaryLine[] = [
    { key: "stitching", label: "Stitching", amountPaise: totals.stitchingCostPaise, kind: "part" },
    { key: "fabric", label: "Fabric", amountPaise: totals.fabricPricePaise, kind: "part" },
    { key: "dye", label: "Dyeing", amountPaise: totals.dyePricePaise, kind: "part" },
    ...extrasParts(totals.extraCostPaise, options.namedExtras),
    { key: "accessories", label: "Accessories", amountPaise: totals.accessoriesCostPaise, kind: "part" }
  ];
  const otherTotal = otherParts.reduce((sum, part) => sum + part.amountPaise, 0);
  const garmentsPaise = totals.subtotalPaise - otherTotal;
  const visibleOthers = otherParts.filter((part) => part.amountPaise !== 0);
  const showParts = garmentsPaise >= 0 && visibleOthers.length > 0;

  const lines: SummaryLine[] = showParts
    ? [{ key: "garments", label: "Garments", amountPaise: garmentsPaise, kind: "part" }, ...visibleOthers]
    : [];

  lines.push({ key: "subtotal", label: "Subtotal", amountPaise: totals.subtotalPaise, kind: "subtotal" });
  if (totals.orderDiscountPaise > 0) {
    lines.push({ key: "discount", label: "Discount", amountPaise: -totals.orderDiscountPaise, kind: "discount" });
  }
  lines.push(
    { key: "cgst", label: `CGST ${percent(totals.cgstRate)}`, amountPaise: totals.cgstAmountPaise, kind: "tax" },
    { key: "sgst", label: `SGST ${percent(totals.sgstRate)}`, amountPaise: totals.sgstAmountPaise, kind: "tax" },
    { key: "total", label: "Grand total", amountPaise: totals.grandTotalPaise, kind: "total" },
    { key: "paid", label: "Paid", amountPaise: totals.totalPaidPaise, kind: "paid" },
    { key: "balance", label: totals.balanceDuePaise > 0 ? "Balance due" : "Paid in full", amountPaise: totals.balanceDuePaise, kind: "balance" }
  );
  return lines;
}

/** Named extra-cost lines when they account for the whole extras total, else one "Extras" line. */
function extrasParts(extraCostPaise: number, namedExtras: { label: string; amountPaise: number }[] = []): SummaryLine[] {
  const named = namedExtras.filter((extra) => extra.amountPaise !== 0);
  if (named.length && named.reduce((sum, extra) => sum + extra.amountPaise, 0) === extraCostPaise) {
    return named.map((extra, index) => ({ key: `extra-${index}`, label: extra.label, amountPaise: extra.amountPaise, kind: "part" }));
  }
  return [{ key: "extras", label: "Extras", amountPaise: extraCostPaise, kind: "part" }];
}

/** True when the summary shows a breakdown of what makes up the subtotal. */
export function hasSubtotalBreakdown(lines: SummaryLine[]) {
  return lines.some((line) => line.kind === "part");
}

/**
 * Customer bill version: same parts → subtotal → taxes, then any advance is taken off
 * and the bold "Grand total" is what the customer still has to pay. No separate
 * balance box. (Staff screens keep `paymentSummaryLines` with the full bill total.)
 */
export function billSummaryLines(totals: SummaryTotals, options: { namedExtras?: { label: string; amountPaise: number }[] } = {}): SummaryLine[] {
  const lines = paymentSummaryLines(totals, options).filter((line) => line.kind !== "total" && line.kind !== "paid" && line.kind !== "balance");
  if (totals.totalPaidPaise > 0) {
    lines.push({ key: "advance", label: "Paid", amountPaise: -totals.totalPaidPaise, kind: "paid" });
  }
  // An overpaid order (status "Credit") would otherwise show a negative total.
  lines.push(
    totals.balanceDuePaise < 0
      ? { key: "total", label: "Overpaid", amountPaise: -totals.balanceDuePaise, kind: "total" }
      : { key: "total", label: "Grand total", amountPaise: totals.balanceDuePaise, kind: "total" }
  );
  return lines;
}
