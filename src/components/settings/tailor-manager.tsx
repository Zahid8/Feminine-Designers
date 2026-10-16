"use client";

import { useRouter } from "next/navigation";
import { EyeOff, RotateCcw, Save, Scissors, UserPlus } from "lucide-react";
import { startTransition, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { SettingsActionState } from "@/services/settings/settings-action-state";
import type { Tailor } from "@/types/domain";

type Result = Promise<SettingsActionState>;

/** Managed tailor names used by the tailor dropdown on orders and the board's tailor filter. */
export function TailorManager({
  tailors,
  addAction,
  renameAction,
  setActiveAction
}: {
  tailors: Tailor[];
  addAction: (formData: FormData) => Result;
  renameAction: (id: string, formData: FormData) => Result;
  setActiveAction: (id: string, active: boolean) => Result;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const addForm = useRef<HTMLFormElement>(null);

  function run(task: () => Result, after?: () => void) {
    setBusy(true);
    startTransition(() => {
      void task()
        .then((result) => {
          toast.show({ tone: result.status === "error" ? "error" : "success", message: result.message });
          if (result.status !== "error") after?.();
          router.refresh();
        })
        .finally(() => setBusy(false));
    });
  }

  return (
    <Card id="tailors">
      <CardHeader className="grid gap-1">
        <div className="flex items-center gap-3">
          <Scissors className="h-5 w-5 text-section-customers" aria-hidden />
          <CardTitle>Tailors</CardTitle>
        </div>
        <p className="text-sm text-muted">Pick from this list when assigning an order, so names stay consistent. Hidden tailors stay on their old orders.</p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {tailors.length === 0 ? <p className="text-sm text-muted">No tailors yet. Add the people who stitch, one at a time.</p> : null}
        <ul className="grid gap-2">
          {tailors.map((tailor) => (
            <li key={tailor.id}>
              <form className="flex flex-wrap items-center gap-2" action={(formData) => run(() => renameAction(tailor.id, formData))}>
                <Input name="name" defaultValue={tailor.name} aria-label="Tailor name" className="h-10 min-w-40 flex-1" disabled={!tailor.active} />
                {tailor.active ? (
                  <>
                    <Button type="submit" variant="secondary" className="min-h-10 px-3" aria-label={`Save ${tailor.name}`} disabled={busy}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-10 px-3" disabled={busy} onClick={() => run(() => setActiveAction(tailor.id, false))}>
                      <EyeOff className="h-4 w-4" aria-hidden />
                      Hide
                    </Button>
                  </>
                ) : (
                  <Button type="button" variant="secondary" className="min-h-10 px-3" disabled={busy} onClick={() => run(() => setActiveAction(tailor.id, true))}>
                    <RotateCcw className="h-4 w-4" aria-hidden />
                    Restore
                  </Button>
                )}
              </form>
            </li>
          ))}
        </ul>
        <form ref={addForm} className="flex flex-wrap gap-2" action={(formData) => run(() => addAction(formData), () => addForm.current?.reset())}>
          <Input name="name" placeholder="Tailor name, e.g. Shakir" className="min-w-48 flex-1" />
          <Button type="submit" disabled={busy}>
            <UserPlus className="h-4 w-4" aria-hidden />
            Add tailor
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
