"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/input";

const OTHER = "__other__";

/**
 * Tailor picker: choose from the managed list (Settings → Tailors), leave it empty, or
 * pick "Other…" to type a name. Older orders with a name not in the list keep showing it.
 * Always submits a single "assignedTailor" value.
 */
export function TailorField({ tailors, defaultValue = "", id = "assigned-tailor" }: { tailors: string[]; defaultValue?: string; id?: string }) {
  const known = !defaultValue || tailors.includes(defaultValue);
  const [choice, setChoice] = useState(known ? defaultValue : OTHER);
  const [custom, setCustom] = useState(known ? "" : defaultValue);

  if (tailors.length === 0) {
    return <Input id={id} name="assignedTailor" defaultValue={defaultValue} placeholder="Optional" />;
  }

  return (
    <div className="grid gap-2">
      <Select id={id} value={choice} onChange={(event) => setChoice(event.target.value)} aria-label="Assigned tailor">
        <option value="">Not assigned</option>
        {tailors.map((tailor) => (
          <option key={tailor} value={tailor}>
            {tailor}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </Select>
      {choice === OTHER ? (
        <Input aria-label="Tailor name" value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Type a name" autoFocus={!custom} />
      ) : null}
      <input type="hidden" name="assignedTailor" value={choice === OTHER ? custom.trim() : choice} />
    </div>
  );
}
