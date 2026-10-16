"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, RotateCcw, Save, Trash2 } from "lucide-react";
import { startTransition, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { SettingsActionState } from "@/services/settings/settings-action-state";
import type { MeasurementTemplate } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

type Field = MeasurementTemplate["fields"][number];
type Result = Promise<SettingsActionState>;

export interface MeasurementFieldActions {
  update: (id: string, formData: FormData) => Result;
  move: (id: string, direction: "up" | "down") => Result;
  setActive: (id: string, active: boolean) => Result;
}

/** One measurement field: edit code/label, move up/down, remove or restore. */
export function MeasurementFieldRow({ field, isFirst, isLast, actions }: { field: Field; isFirst: boolean; isLast: boolean; actions: MeasurementFieldActions }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const label = field.longLabel ?? field.displayLabel;

  function run(task: () => Result, quiet = false) {
    setBusy(true);
    startTransition(() => {
      void task()
        .then((result) => {
          if (!quiet || result.status === "error") toast.show({ tone: result.status === "error" ? "error" : "success", message: result.message });
          router.refresh();
        })
        .finally(() => setBusy(false));
    });
  }

  if (!field.active) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-sunken px-2 py-1.5 text-xs text-muted shadow-pressed">
        <span>
          <strong>{field.displayCode}</strong> {label} · removed
        </span>
        <button type="button" disabled={busy} onClick={() => run(() => actions.setActive(field.id, true))} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-wine hover:bg-surface">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Restore
        </button>
      </div>
    );
  }

  return (
    <form
      action={(formData) => run(() => actions.update(field.id, formData))}
      className={cn("grid grid-cols-[auto_4.5rem_1fr_auto] items-center gap-1.5 rounded-xl border border-white/70 bg-surface px-1.5 py-1 shadow-raised-sm", busy && "opacity-60")}
    >
      <div className="flex flex-col">
        <button type="button" aria-label={`Move ${field.displayCode} up`} disabled={isFirst || busy} onClick={() => run(() => actions.move(field.id, "up"), true)} className="rounded p-0.5 text-muted hover:text-wine disabled:opacity-30">
          <ArrowUp className="h-3 w-3" />
        </button>
        <button type="button" aria-label={`Move ${field.displayCode} down`} disabled={isLast || busy} onClick={() => run(() => actions.move(field.id, "down"), true)} className="rounded p-0.5 text-muted hover:text-wine disabled:opacity-30">
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
      <Input name="displayCode" defaultValue={field.displayCode} aria-label="Code" className="h-9 px-2 text-center text-xs font-bold" />
      <Input name="displayLabel" defaultValue={label} aria-label="Label" className="h-9 px-2 text-xs" />
      <div className="flex">
        <button type="submit" aria-label={`Save ${field.displayCode}`} disabled={busy} className="rounded-lg p-2 text-muted hover:bg-surface-sunken hover:text-wine">
          <Save className="h-4 w-4" />
        </button>
        <button type="button" aria-label={`Remove ${field.displayCode}`} disabled={busy} onClick={() => run(() => actions.setActive(field.id, false))} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-danger">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
