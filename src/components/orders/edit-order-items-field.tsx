"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { EditExtraCostsField } from "@/components/orders/edit-extra-costs-field";
import { paiseToRupees } from "@/lib/utils/money";
import type { OrderItem } from "@/types/domain";

type EditableOrderItem = Partial<OrderItem> & {
  formKey: string;
};

function newEditableItem(index: number): EditableOrderItem {
  return {
    formKey: `new-${Date.now()}-${index}`,
    id: "",
    garmentType: "",
    quantity: 1,
    ratePaise: 0,
    stitchingCostPaise: 0,
    fabricPricePaise: 0,
    dyePricePaise: 0,
    fabricLength: "",
    fabricColor: "",
    designReference: "",
    stitchingInstructions: "",
    extraCosts: []
  };
}

export function EditOrderItemsField({ items }: { items: OrderItem[] }) {
  const [editableItems, setEditableItems] = useState<EditableOrderItem[]>(
    items.map((item) => ({ ...item, formKey: item.id }))
  );

  function addDress() {
    setEditableItems((current) => [...current, newEditableItem(current.length)]);
  }

  function deleteDress(formKey: string) {
    setEditableItems((current) => {
      if (current.length <= 1) return current;
      return current.filter((item) => item.formKey !== formKey);
    });
  }

  return (
    <div className="grid gap-3">
      <input type="hidden" name="items.intent" value="replace" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#4c1525]">Garment Items</p>
        <Button type="button" variant="secondary" onClick={addDress} aria-label="Add dress">
          <Plus className="h-4 w-4" />
          Add Dress
        </Button>
      </div>
      {editableItems.map((item, index) => (
        <div key={item.formKey} className="rounded-md border border-[#ead8c3] bg-gradient-to-br from-white to-[#fffaf4] p-4 shadow-sm">
          <input type="hidden" name={`items.${index}.id`} value={item.id ?? ""} />
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-[#4c1525]">Dress {index + 1}</p>
            <Button
              type="button"
              variant="ghost"
              onClick={() => deleteDress(item.formKey)}
              aria-label={`Delete dress ${index + 1}`}
              disabled={editableItems.length <= 1}
              className="min-h-8 px-2 text-[#a83232] hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_.5fr_.7fr_.7fr_.7fr_.7fr_.7fr]">
            <Field label="Garment type">
              <Input name={`items.${index}.garmentType`} defaultValue={item.garmentType ?? ""} />
            </Field>
            <Field label="Quantity">
              <Input name={`items.${index}.quantity`} type="number" min={1} step="1" defaultValue={item.quantity ?? 1} />
            </Field>
            <Field label="Rate">
              <Input name={`items.${index}.rateRupees`} type="number" min={0} step="0.01" defaultValue={paiseToRupees(item.ratePaise ?? 0)} />
            </Field>
            <Field label="Stitching cost">
              <Input
                name={`items.${index}.stitchingCostRupees`}
                type="number"
                min={0}
                step="0.01"
                defaultValue={paiseToRupees(item.stitchingCostPaise ?? 0)}
              />
            </Field>
            <Field label="Fabric price">
              <Input
                name={`items.${index}.fabricPriceRupees`}
                type="number"
                min={0}
                step="0.01"
                defaultValue={paiseToRupees(item.fabricPricePaise ?? 0)}
              />
            </Field>
            <Field label="Dye price">
              <Input
                name={`items.${index}.dyePriceRupees`}
                type="number"
                min={0}
                step="0.01"
                defaultValue={paiseToRupees(item.dyePricePaise ?? 0)}
              />
            </Field>
            <Field label="Fabric length">
              <Input name={`items.${index}.fabricLength`} defaultValue={item.fabricLength ?? ""} />
            </Field>
            <Field label="Fabric/color">
              <Input name={`items.${index}.fabricColor`} defaultValue={item.fabricColor ?? ""} />
            </Field>
            <Field label="Design reference">
              <Input name={`items.${index}.designReference`} defaultValue={item.designReference ?? ""} />
            </Field>
            <label className="grid gap-1.5 text-sm font-medium text-[#3b312d] lg:col-span-4">
              <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#6f352b]">Stitching instructions</span>
              <Textarea name={`items.${index}.stitchingInstructions`} defaultValue={item.stitchingInstructions ?? ""} />
            </label>
          </div>
          <EditExtraCostsField itemIndex={index} dressNumber={index + 1} extraCosts={item.extraCosts ?? []} />
        </div>
      ))}
    </div>
  );
}
