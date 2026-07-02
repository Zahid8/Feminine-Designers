"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paiseToRupees } from "@/lib/utils/money";
import type { OrderItemExtraCost } from "@/types/domain";

interface EditableCost {
  label: string;
  amount: number;
}

export function EditExtraCostsField({
  itemIndex,
  dressNumber,
  extraCosts
}: {
  itemIndex: number;
  dressNumber: number;
  extraCosts: OrderItemExtraCost[];
}) {
  const [costs, setCosts] = useState<EditableCost[]>(
    extraCosts.map((cost) => ({ label: cost.label, amount: paiseToRupees(cost.amountPaise) }))
  );

  function addCost() {
    setCosts((current) => [...current, { label: "", amount: 0 }]);
  }

  function updateCost(index: number, patch: Partial<EditableCost>) {
    setCosts((current) => current.map((cost, costIndex) => (costIndex === index ? { ...cost, ...patch } : cost)));
  }

  function removeCost(index: number) {
    setCosts((current) => current.filter((_, costIndex) => costIndex !== index));
  }

  return (
    <div className="mt-4 rounded-md border border-[#eadfce] bg-[#fffdf8] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-[#4c1525]">Extra costs</p>
        <Button type="button" variant="secondary" onClick={addCost} aria-label={`Add extra cost to dress ${dressNumber}`}>
          <Plus className="h-4 w-4" />
          Add cost
        </Button>
      </div>
      {costs.length ? (
        <div className="mt-3 grid gap-2">
          {costs.map((cost, costIndex) => (
            <div key={costIndex} className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
              <Input
                name={`items.${itemIndex}.extraCosts.${costIndex}.label`}
                placeholder="Example: Lace"
                value={cost.label}
                onChange={(event) => updateCost(costIndex, { label: event.target.value })}
                aria-label={`Extra cost ${costIndex + 1} label for dress ${dressNumber}`}
              />
              <Input
                name={`items.${itemIndex}.extraCosts.${costIndex}.amountRupees`}
                type="number"
                min={0}
                step="0.01"
                value={cost.amount}
                onChange={(event) => updateCost(costIndex, { amount: Number(event.target.value) })}
                aria-label={`Extra cost ${costIndex + 1} amount for dress ${dressNumber}`}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeCost(costIndex)}
                aria-label={`Remove extra cost ${costIndex + 1} from dress ${dressNumber}`}
              >
                <Minus className="h-4 w-4" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[#7c6d66]">Add lace, shantoon, buttons, or any other dress-specific cost.</p>
      )}
    </div>
  );
}
