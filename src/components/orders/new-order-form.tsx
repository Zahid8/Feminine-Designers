"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Camera, Calculator, Check, Printer, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { GARMENT_TYPES, MEASUREMENT_TEMPLATES, STORE_SETTINGS } from "@/lib/constants/business";
import { calculateOrderTotals } from "@/lib/calculations/order";
import { todayISO } from "@/lib/utils/date";
import { rupeesToPaise, formatINR } from "@/lib/utils/money";
import { initialOrderActionState, type OrderActionState } from "@/services/orders/order-action-state";
import type { ReturningCustomerMatch } from "@/types/customer-search";
import type { GarmentType, MeasurementTemplate } from "@/types/domain";

const CLOTH_SAMPLE_MAX_DIMENSION = 900;
const CLOTH_SAMPLE_TARGET_LENGTH = 650_000;

function loadImageDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read cloth sample image."));
    };
    reader.onerror = () => reject(new Error("Could not read cloth sample image."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load cloth sample image."));
    image.src = source;
  });
}

function canvasToCompressedDataUrl(canvas: HTMLCanvasElement) {
  let quality = 0.72;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);

  while (dataUrl.length > CLOTH_SAMPLE_TARGET_LENGTH && quality > 0.42) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }

  return dataUrl;
}

async function compressClothSample(file: File) {
  const source = await loadImageDataUrl(file);
  const image = await loadImageElement(source);
  const scale = Math.min(1, CLOTH_SAMPLE_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const context = canvas.getContext("2d");
  if (!context) {
    return source.length <= CLOTH_SAMPLE_TARGET_LENGTH ? source : "";
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvasToCompressedDataUrl(canvas);
}

export function NewOrderForm({
  action = async () => initialOrderActionState,
  garmentTypes = GARMENT_TYPES,
  measurementTemplates = MEASUREMENT_TEMPLATES,
  nextReceiptNumber,
  orderDate = todayISO(),
  deliveryDate = orderDate
}: {
  action?: (state: OrderActionState, formData: FormData) => Promise<OrderActionState>;
  garmentTypes?: GarmentType[];
  measurementTemplates?: MeasurementTemplate[];
  nextReceiptNumber?: string;
  orderDate?: string;
  deliveryDate?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialOrderActionState);
  const [customerName, setCustomerName] = useState("");
  const [phonePrimary, setPhonePrimary] = useState("");
  const [returningCustomerQuery, setReturningCustomerQuery] = useState("");
  const [returningCustomerMatches, setReturningCustomerMatches] = useState<ReturningCustomerMatch[]>([]);
  const [selectedReturningCustomerId, setSelectedReturningCustomerId] = useState("");
  const [returningCustomerStatus, setReturningCustomerStatus] = useState<"idle" | "searching" | "error">("idle");
  const [appliedMeasurements, setAppliedMeasurements] = useState<ReturningCustomerMatch["measurements"]>([]);
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [measurementGridKey, setMeasurementGridKey] = useState("new");
  const [clothCount, setClothCount] = useState(1);
  const [items, setItems] = useState([
    {
      quantity: 1,
      rate: 1500,
      stitchingCost: 0,
      fabricPrice: 0,
      dyePrice: 0,
      garmentType: garmentTypes.find((type) => type.active)?.name ?? "Blouse"
    }
  ]);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [accessoriesCost, setAccessoriesCost] = useState(0);
  const [advance, setAdvance] = useState(0);
  const [clothSampleDataUrl, setClothSampleDataUrl] = useState("");
  const [clothSampleError, setClothSampleError] = useState("");
  const clothInputRef = useRef<HTMLInputElement>(null);
  const receipt = nextReceiptNumber ?? "Assigned on save";
  const activeGarmentTypes = garmentTypes.filter((type) => type.active);
  const visibleItems = useMemo(() => Array.from({ length: clothCount }, (_, index) => items[index] ?? items[0]), [clothCount, items]);
  const globalMeasurementTemplate = templateForGarment(visibleItems[0]?.garmentType ?? activeGarmentTypes[0]?.name ?? "");
  const totals = useMemo(
    () =>
      calculateOrderTotals({
        items: visibleItems.map((item) => ({
          quantity: item.quantity,
          ratePaise: rupeesToPaise(item.rate),
          discountPaise: 0,
          stitchingCostPaise: rupeesToPaise(item.stitchingCost),
          fabricPricePaise: rupeesToPaise(item.fabricPrice),
          dyePricePaise: rupeesToPaise(item.dyePrice)
        })),
        accessoriesCostPaise: rupeesToPaise(accessoriesCost),
        orderDiscountPaise: rupeesToPaise(orderDiscount),
        cgstRate: STORE_SETTINGS.defaultCgstRate,
        sgstRate: STORE_SETTINGS.defaultSgstRate,
        payments: advance > 0 ? [{ amountPaise: rupeesToPaise(advance) }] : []
      }),
    [accessoriesCost, advance, orderDiscount, visibleItems]
  );

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) {
      window.location.assign(state.redirectTo);
    }
  }, [state]);

  useEffect(() => {
    const query = returningCustomerQuery.trim();
    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setReturningCustomerStatus("searching");
      try {
        const response = await fetch(`/api/customers/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        if (!response.ok) throw new Error("Customer search failed.");
        const payload = (await response.json()) as { matches?: ReturningCustomerMatch[] };
        const matches = payload.matches ?? [];
        setReturningCustomerMatches(matches);
        setSelectedReturningCustomerId(matches[0]?.id ?? "");
        setReturningCustomerStatus("idle");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setReturningCustomerMatches([]);
        setSelectedReturningCustomerId("");
        setReturningCustomerStatus("error");
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [returningCustomerQuery]);

  async function handleClothSampleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setClothSampleError("");
    try {
      const dataUrl = await compressClothSample(file);
      if (!dataUrl) {
        setClothSampleError("Photo is too large. Crop closer to the cloth sample and try again.");
        setClothSampleDataUrl("");
        return;
      }
      setClothSampleDataUrl(dataUrl);
    } catch {
      setClothSampleError("Could not read this photo. Please take the cloth sample photo again.");
      setClothSampleDataUrl("");
    }
  }

  function updateClothCount(nextCount: number) {
    const boundedCount = Math.min(12, Math.max(1, nextCount || 1));
    setClothCount(boundedCount);
    setItems((current) =>
      Array.from({ length: boundedCount }, (_, index) => current[index] ?? {
        quantity: 1,
        rate: 1500,
        stitchingCost: 0,
        fabricPrice: 0,
        dyePrice: 0,
        garmentType: activeGarmentTypes[0]?.name ?? "Blouse"
      })
    );
  }

  function updateItem(
    index: number,
    patch: Partial<{ quantity: number; rate: number; stitchingCost: number; fabricPrice: number; dyePrice: number; garmentType: string }>
  ) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  }

  function handleReturningCustomerQueryChange(value: string) {
    setReturningCustomerQuery(value);
    if (value.trim().length < 2) {
      setReturningCustomerMatches([]);
      setSelectedReturningCustomerId("");
      setReturningCustomerStatus("idle");
    }
  }

  function applyReturningCustomer() {
    const match = returningCustomerMatches.find((customer) => customer.id === selectedReturningCustomerId);
    if (!match) return;

    setCustomerName(match.fullName);
    setPhonePrimary(match.phonePrimary);
    setAppliedMeasurements(match.measurements);
    setMeasurementValues(Object.fromEntries(match.measurements.map((measurement) => [measurement.fieldKey, measurement.value === "NA" ? "" : measurement.value])));
    setReturningCustomerQuery(match.fullName);
    setMeasurementGridKey(`${match.id}-${Date.now()}`);
  }

  function updateMeasurementValue(fieldKey: string, value: string) {
    setMeasurementValues((current) => ({ ...current, [fieldKey]: value }));
  }

  function templateForGarment(garmentType: string) {
    return (
      measurementTemplates.find((template) => template.garmentCategories.includes(garmentType)) ??
      measurementTemplates.find((template) => template.id === "tmpl-general") ??
      measurementTemplates[0] ??
      MEASUREMENT_TEMPLATES[0]
    );
  }

  return (
    <form action={formAction} className="grid gap-5">
      {state.message ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm font-semibold ${
            state.status === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {state.message}
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field label="Search or customer name">
            <Input
              name="customerName"
              placeholder="Name or phone number"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
            />
          </Field>
          <Field label="Phone number">
            <Input
              name="phonePrimary"
              placeholder="Indian mobile number"
              value={phonePrimary}
              onChange={(event) => setPhonePrimary(event.target.value)}
            />
          </Field>
          <div className="rounded-md border border-[#eadfce] bg-[#fdf8ef] p-3 text-sm">
            <p className="font-semibold text-[#4c1525]">Returning customer match</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c6d66]" />
                <Input
                  value={returningCustomerQuery}
                  onChange={(event) => handleReturningCustomerQueryChange(event.target.value)}
                  placeholder="Search by name or phone"
                  className="pl-9"
                  aria-label="Search saved customer by name or phone"
                />
              </label>
              <Button type="button" variant="secondary" onClick={applyReturningCustomer} disabled={!selectedReturningCustomerId}>
                <Check className="h-4 w-4" />
                Apply
              </Button>
            </div>
            {returningCustomerMatches.length ? (
              <select
                className="mt-2 h-10 w-full rounded-md border border-[#d8c7b4] bg-white px-3 text-sm"
                value={selectedReturningCustomerId}
                onChange={(event) => setSelectedReturningCustomerId(event.target.value)}
                aria-label="Returning customer suggestions"
              >
                {returningCustomerMatches.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName} - {customer.phonePrimary}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-2 text-xs text-[#7c6d66]">
                {returningCustomerStatus === "searching"
                  ? "Searching saved customers..."
                  : returningCustomerStatus === "error"
                    ? "Could not search customers."
                  : "Type at least 2 letters or digits from the customer name or phone number."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Field label="Receipt number">
            <Input value={receipt} readOnly />
          </Field>
          <Field label="Order date">
            <Input name="orderDate" type="date" defaultValue={orderDate} />
          </Field>
          <Field label="Delivery date">
            <Input name="deliveryDate" type="date" defaultValue={deliveryDate} />
          </Field>
          <Field label="Priority">
            <select name="priority" className="h-10 rounded-md border border-[#d8c7b4] bg-white px-3 text-sm" defaultValue="Normal">
              <option>Normal</option>
              <option>Urgent</option>
              <option>Express</option>
            </select>
          </Field>
          <Field label="Assigned tailor">
            <Input name="assignedTailor" placeholder="Optional" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Garment Items</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Field label="Number of cloth / garments">
            <Input
              name="clothCount"
              type="number"
              min={1}
              max={12}
              value={clothCount}
              onChange={(event) => updateClothCount(Number(event.target.value))}
            />
          </Field>
          <div className="grid gap-4">
            {visibleItems.map((item, index) => (
              <details
                key={index}
                open={index === 0}
                className="rounded-md border border-[#eadfce] bg-white p-4"
              >
                <summary className="cursor-pointer text-sm font-bold text-[#4c1525]">
                  Dress {index + 1}: {item.garmentType}
                </summary>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_.6fr_.7fr_.7fr_.7fr_.7fr]">
                  <Field label="Garment type">
                    <select
                      name={`items.${index}.garmentType`}
                      className="h-10 rounded-md border border-[#d8c7b4] bg-white px-3 text-sm"
                      value={item.garmentType}
                      onChange={(event) => updateItem(index, { garmentType: event.target.value })}
                    >
                      {activeGarmentTypes.map((type) => (
                        <option key={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Quantity">
                    <Input
                      name={`items.${index}.quantity`}
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                    />
                  </Field>
                  <Field label="Rate">
                    <Input
                      name={`items.${index}.rateRupees`}
                      type="number"
                      min={0}
                      value={item.rate}
                      onChange={(event) => updateItem(index, { rate: Number(event.target.value) })}
                    />
                  </Field>
                  <Field label="Stitching cost">
                    <Input
                      name={`items.${index}.stitchingCostRupees`}
                      type="number"
                      min={0}
                      value={item.stitchingCost}
                      onChange={(event) => updateItem(index, { stitchingCost: Number(event.target.value) })}
                    />
                  </Field>
                  <Field label="Fabric price">
                    <Input
                      name={`items.${index}.fabricPriceRupees`}
                      type="number"
                      min={0}
                      value={item.fabricPrice}
                      onChange={(event) => updateItem(index, { fabricPrice: Number(event.target.value) })}
                    />
                  </Field>
                  <Field label="Dye price">
                    <Input
                      name={`items.${index}.dyePriceRupees`}
                      type="number"
                      min={0}
                      value={item.dyePrice}
                      onChange={(event) => updateItem(index, { dyePrice: Number(event.target.value) })}
                    />
                  </Field>
                  <Field label="Fabric length">
                    <Input name={`items.${index}.fabricLength`} placeholder="Example: 2.5 m" />
                  </Field>
                  <Field label="Fabric/color">
                    <Input name={`items.${index}.fabricColor`} placeholder="Optional" />
                  </Field>
                  <Field label="Design reference">
                    <Input name={`items.${index}.designReference`} placeholder="Optional" />
                  </Field>
                  <label className="grid gap-1 text-sm font-medium lg:col-span-4">
                    <span>Stitching instructions</span>
                    <Textarea
                      name={`items.${index}.stitchingInstructions`}
                      defaultValue={index === 0 ? "Princess cut, padded, lining required" : ""}
                    />
                  </label>
                </div>
              </details>
            ))}
          </div>
          <div className="rounded-md border border-[#eadfce] bg-white p-4">
            <h3 className="text-sm font-bold text-[#4c1525]">Measurements</h3>
            <div className="mt-4">
              <MeasurementGrid
                key={measurementGridKey}
                template={globalMeasurementTemplate}
                defaultValues={appliedMeasurements}
                controlledValues={measurementValues}
                onValueChange={updateMeasurementValue}
                editable
                valuePrefix="measurement"
                metaPrefix="measurementMeta"
              />
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-[#eadfce] bg-white p-4 md:grid-cols-[1fr_220px]">
            <div>
              <p className="font-semibold text-[#4c1525]">Customer cloth sample</p>
              <p className="mt-1 text-sm text-[#7c6d66]">
                Take a photo of the 2cm x 2cm cloth reference. It appears in the web order and store copy only.
              </p>
              <label className="sr-only" htmlFor="cloth-sample-photo">
                Cloth sample photo
              </label>
              <input
                ref={clothInputRef}
                id="cloth-sample-photo"
                className="sr-only"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleClothSampleChange}
              />
              <input type="hidden" name="clothSampleDataUrl" value={clothSampleDataUrl} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => clothInputRef.current?.click()}>
                  <Camera className="h-4 w-4" />
                  Take Cloth Photo
                </Button>
                {clothSampleDataUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setClothSampleDataUrl("");
                      setClothSampleError("");
                    }}
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
              {clothSampleError ? (
                <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
                  {clothSampleError}
                </p>
              ) : null}
            </div>
            <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-[#d8c7b4] bg-[#fdf8ef]">
              {clothSampleDataUrl ? (
                // Data URLs are generated from tablet camera input and are not remotely optimizable.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={clothSampleDataUrl}
                  alt="Customer cloth sample preview"
                  className="max-h-52 w-full rounded-md object-cover"
                />
              ) : (
                <span className="px-4 text-center text-sm text-[#7c6d66]">No cloth sample photo yet</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment and Tax</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Advance paid">
              <Input name="advancePaidRupees" type="number" min={0} value={advance} onChange={(event) => setAdvance(Number(event.target.value))} />
            </Field>
            <Field label="Payment mode">
              <select name="paymentMethod" className="h-10 rounded-md border border-[#d8c7b4] bg-white px-3 text-sm">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
                <option>Mixed</option>
              </select>
            </Field>
            <Field label="Payment reference">
              <Input name="paymentReference" placeholder="Optional" />
            </Field>
            <Field label="Order discount">
              <Input
                name="orderDiscountRupees"
                type="number"
                min={0}
                value={orderDiscount}
                onChange={(event) => setOrderDiscount(Number(event.target.value))}
              />
            </Field>
            <Field label="Accessories cost">
              <Input
                name="accessoriesCostRupees"
                type="number"
                min={0}
                value={accessoriesCost}
                onChange={(event) => setAccessoriesCost(Number(event.target.value))}
              />
            </Field>
            <label className="grid gap-1 text-sm font-medium md:col-span-2">
              <span>Customer-facing notes</span>
              <Textarea name="customerNotes" placeholder="Shown on customer copy" />
            </label>
            <label className="grid gap-1 text-sm font-medium md:col-span-2">
              <span>Internal notes</span>
              <Textarea name="internalNotes" placeholder="Private stitching/workshop note" />
            </label>
          </div>
          <div className="rounded-md border border-[#eadfce] bg-[#fdf8ef] p-4">
            <p className="mb-3 flex items-center gap-2 font-semibold text-[#4c1525]">
              <Calculator className="h-4 w-4" />
              Live totals
            </p>
            {[
              ["Subtotal", totals.subtotalPaise],
              ["Accessories", totals.accessoriesCostPaise],
              ["Stitching", totals.stitchingCostPaise],
              ["Fabric price", totals.fabricPricePaise],
              ["Dye price", totals.dyePricePaise],
              ["Discount", -totals.orderDiscountPaise],
              ["CGST", totals.cgstAmountPaise],
              ["SGST", totals.sgstAmountPaise],
              ["Grand Total", totals.grandTotalPaise],
              ["Advance", totals.totalPaidPaise],
              ["Balance", totals.balanceDuePaise]
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-[#eadfce] py-2 text-sm last:border-0">
                <span>{label}</span>
                <strong>{formatINR(Number(value))}</strong>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-[#eadfce] bg-[#fbf7ef]/95 py-4 backdrop-blur">
        <Button type="submit" name="intent" value="draft" variant="secondary" disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Draft"}
        </Button>
        <Button type="submit" name="intent" value="order" disabled={isPending}>
          {isPending ? "Saving..." : "Save Order"}
        </Button>
        <Button type="submit" name="intent" value="print" variant="secondary" disabled={isPending}>
          <Printer className="h-4 w-4" />
          {isPending ? "Saving..." : "Save and Print"}
        </Button>
      </div>
    </form>
  );
}
