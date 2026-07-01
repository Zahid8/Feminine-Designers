import { newOrderSchema, type NewOrderInput } from "@/lib/validations/order";
import type { MeasurementValue } from "@/types/domain";

export type OrderSubmitIntent = "draft" | "order" | "print";

export interface ParsedOrderForm {
  intent: OrderSubmitIntent;
  order: NewOrderInput;
  measurementValues: Record<string, Record<string, string>>;
  measurements: MeasurementValue[];
  clothSampleDataUrl?: string;
}

function readString(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" ? value : fallback;
}

function readIntent(formData: FormData): OrderSubmitIntent {
  const value = readString(formData, "intent", "order");
  return value === "draft" || value === "print" ? value : "order";
}

function readItemIndexes(formData: FormData) {
  const indexes = new Set<number>();
  for (const key of formData.keys()) {
    const match = key.match(/^items\.(\d+)\./);
    if (match) indexes.add(Number(match[1]));
  }
  return [...indexes].sort((a, b) => a - b);
}

function measurementIdPrefix(groupKey: string) {
  return groupKey === "global" ? "global" : String(Number(groupKey) + 1);
}

function measurementOrderItemSortOrder(groupKey: string) {
  return groupKey === "global" ? undefined : Number(groupKey) + 1;
}

export function parseOrderFormData(formData: FormData): ParsedOrderForm {
  const intent = readIntent(formData);
  const itemIndexes = readItemIndexes(formData);
  const effectiveItemIndexes = itemIndexes.length ? itemIndexes : [0];
  const measurementValues: Record<string, Record<string, string>> = {};
  const measurementMeta: Record<string, Record<string, Record<string, string>>> = {};

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("measurements.") && typeof value === "string") {
      const [, itemIndex, fieldKey] = key.split(".");
      measurementValues[itemIndex] = { ...(measurementValues[itemIndex] ?? {}), [fieldKey]: value.trim() };
    } else if (key.startsWith("measurement.") && typeof value === "string") {
      const fieldKey = key.replace("measurement.", "");
      measurementValues.global = { ...(measurementValues.global ?? {}), [fieldKey]: value.trim() };
    }
    if (key.startsWith("measurementMeta.") && typeof value === "string") {
      const parts = key.split(".");
      const itemIndex = parts.length === 4 ? parts[1] : "global";
      const fieldKey = parts.length === 4 ? parts[2] : parts[1];
      const metaKey = parts.length === 4 ? parts[3] : parts[2];
      measurementMeta[itemIndex] = {
        ...(measurementMeta[itemIndex] ?? {}),
        [fieldKey]: { ...(measurementMeta[itemIndex]?.[fieldKey] ?? {}), [metaKey]: value }
      };
    }
  }

  const items = effectiveItemIndexes.map((itemIndex) => ({
    garmentType: readString(formData, `items.${itemIndex}.garmentType`, readString(formData, "garmentType")),
    customGarmentType: readString(formData, `items.${itemIndex}.customGarmentType`, readString(formData, "customGarmentType")),
    quantity: readString(formData, `items.${itemIndex}.quantity`, readString(formData, "quantity", "1")),
    rateRupees: readString(formData, `items.${itemIndex}.rateRupees`, readString(formData, "rateRupees", "0")),
    discountRupees: "0",
    fabricLength: readString(formData, `items.${itemIndex}.fabricLength`, readString(formData, "fabricLength")),
    fabricColor: readString(formData, `items.${itemIndex}.fabricColor`, readString(formData, "fabricColor")),
    designReference: readString(formData, `items.${itemIndex}.designReference`, readString(formData, "designReference")),
    stitchingInstructions: readString(
      formData,
      `items.${itemIndex}.stitchingInstructions`,
      readString(formData, "stitchingInstructions")
    )
  }));

  const order = newOrderSchema.parse({
    customerName: readString(formData, "customerName"),
    phonePrimary: readString(formData, "phonePrimary"),
    orderDate: readString(formData, "orderDate"),
    deliveryDate: readString(formData, "deliveryDate"),
    priority: readString(formData, "priority", "Normal"),
    status: intent === "draft" ? "Draft" : "New",
    assignedTailor: readString(formData, "assignedTailor"),
    internalNotes: readString(formData, "internalNotes"),
    customerNotes: readString(formData, "customerNotes"),
    orderDiscountRupees: readString(formData, "orderDiscountRupees", "0"),
    accessoriesCostRupees: readString(formData, "accessoriesCostRupees", "0"),
    stitchingCostRupees: readString(formData, "stitchingCostRupees", "0"),
    advancePaidRupees: readString(formData, "advancePaidRupees", "0"),
    paymentMethod: readString(formData, "paymentMethod", "Cash"),
    items
  });

  const measurements: MeasurementValue[] = Object.entries(measurementValues).flatMap(([itemIndex, fields]) =>
    Object.entries(fields).map(([fieldKey, value], index) => {
      const meta = measurementMeta[itemIndex]?.[fieldKey] ?? {};
      const normalizedValue = value.trim() === "" ? "NA" : value;
      return {
        id: `form-${measurementIdPrefix(itemIndex)}-${fieldKey}`,
        orderItemSortOrder: measurementOrderItemSortOrder(itemIndex),
        fieldKey,
        displayCode: meta.displayCode || fieldKey.toUpperCase(),
        displayLabel: meta.displayLabel || meta.displayCode || fieldKey,
        value: normalizedValue,
        unit: meta.unit || "in",
        sortOrder: Number(meta.sortOrder || index + 1)
      };
    })
  );

  return {
    intent,
    order,
    measurementValues,
    measurements,
    clothSampleDataUrl: readString(formData, "clothSampleDataUrl") || undefined
  };
}
