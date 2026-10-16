"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, RotateCcw, Save, Shirt, Trash2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { initialSettingsActionState, type SettingsActionState } from "@/services/settings/settings-action-state";
import type { GarmentType } from "@/types/domain";
import { cn } from "@/lib/utils/cn";

type Result = Promise<SettingsActionState>;

/** Garment list: rename, default price for New Order, order (most used first), remove/restore, add. */
export function GarmentManager({
  garmentTypes,
  addAction,
  updateAction,
  moveAction,
  setActiveAction
}: {
  garmentTypes: GarmentType[];
  addAction: (state: SettingsActionState, formData: FormData) => Result;
  updateAction: (formData: FormData) => Result;
  moveAction: (id: string, direction: "up" | "down") => Result;
  setActiveAction: (id: string, active: boolean) => Result;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState("");
  const [addState, addFormAction, adding] = useActionState(addAction, initialSettingsActionState);
  const active = garmentTypes.filter((garment) => garment.active);
  const removed = garmentTypes.filter((garment) => !garment.active);

  useEffect(() => {
    if (addState.status !== "idle") toast.show({ tone: addState.status === "error" ? "error" : "success", message: addState.message });
  }, [addState, toast]);

  function run(id: string, task: () => Result) {
    setBusyId(id);
    startTransition(() => {
      void task()
        .then((result) => {
          if (result.status === "error" || result.message !== "Order updated.") toast.show({ tone: result.status === "error" ? "error" : "success", message: result.message });
          router.refresh();
        })
        .finally(() => setBusyId(""));
    });
  }

  return (
    <Card id="garments">
      <CardHeader className="grid gap-1">
        <div className="flex items-center gap-3">
          <Shirt className="h-5 w-5 text-section-new" aria-hidden />
          <CardTitle>Garments & prices</CardTitle>
        </div>
        <p className="text-sm text-muted">The price fills in automatically on New Order (you can still change it per order). Use the arrows to put popular garments first.</p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ul className="grid max-h-[32rem] gap-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
          {active.map((garment, index) => (
            <li key={garment.id} className={cn("rounded-xl border border-white/70 bg-surface p-2 shadow-raised-sm", busyId === garment.id && "opacity-60")}>
              <form
                className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:grid-cols-[auto_1fr_9rem_auto]"
                action={(formData) => run(garment.id, () => updateAction(formData))}
              >
                <input type="hidden" name="id" value={garment.id} />
                <div className="flex flex-col">
                  <button type="button" aria-label={`Move ${garment.name} up`} disabled={index === 0 || busyId !== ""} onClick={() => run(garment.id, () => moveAction(garment.id, "up"))} className="rounded-md p-1 text-muted hover:text-wine disabled:opacity-30">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" aria-label={`Move ${garment.name} down`} disabled={index === active.length - 1 || busyId !== ""} onClick={() => run(garment.id, () => moveAction(garment.id, "down"))} className="rounded-md p-1 text-muted hover:text-wine disabled:opacity-30">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input name="name" defaultValue={garment.name} aria-label="Garment name" className="h-10" />
                <label className="relative col-span-2 sm:col-span-1">
                  <span className="sr-only">Default price for {garment.name}</span>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">₹</span>
                  <Input name="defaultRate" inputMode="decimal" defaultValue={garment.defaultRatePaise === undefined ? "" : String(garment.defaultRatePaise / 100)} placeholder="No default" className="h-10 pl-7" />
                </label>
                <div className="col-start-3 row-start-1 flex gap-1 sm:col-start-auto sm:row-start-auto">
                  <Button type="submit" variant="secondary" className="min-h-10 px-3" aria-label={`Save ${garment.name}`} disabled={busyId !== ""}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" className="min-h-10 px-3 text-danger" aria-label={`Remove ${garment.name}`} disabled={busyId !== ""} onClick={() => run(garment.id, () => setActiveAction(garment.id, false))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </li>
          ))}
        </ul>
        <form action={addFormAction} className="flex flex-wrap gap-2">
          <Input name="name" placeholder="Add a garment, e.g. Sharara" className="min-w-48 flex-1" />
          <Button type="submit" disabled={adding}>Add garment</Button>
        </form>
        {removed.length ? (
          <details className="rounded-xl bg-surface-sunken p-3 shadow-pressed">
            <summary className="cursor-pointer text-sm font-semibold text-muted-strong">Removed garments ({removed.length})</summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {removed.map((garment) => (
                <li key={garment.id}>
                  <Button type="button" variant="secondary" className="min-h-9 px-3 text-sm" disabled={busyId !== ""} onClick={() => run(garment.id, () => setActiveAction(garment.id, true))}>
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    Restore {garment.name}
                  </Button>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
