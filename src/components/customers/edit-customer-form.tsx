"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { MeasurementGrid } from "@/components/measurements/measurement-grid";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useUnsavedChangesGuard } from "@/lib/ui/use-unsaved-changes-guard";
import type { Customer, MeasurementValue } from "@/types/domain";

type FormState = { error?: string };

/** Customer details and saved measurements on one page, with a single Save. */
export function EditCustomerForm({
  customer,
  measurements,
  action
}: {
  customer: Customer;
  measurements: MeasurementValue[];
  action: (state: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const guard = useUnsavedChangesGuard();

  return (
    <form action={formAction} onChange={guard.onChange} onSubmit={guard.onSubmit} className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Customer details</CardTitle>
        </CardHeader>
        <CardContent className="grid items-start gap-4 md:grid-cols-2">
          <Field label="Name">
            <Input name="fullName" defaultValue={customer.fullName} required />
          </Field>
          <Field label="Phone number">
            <Input name="phonePrimary" defaultValue={customer.phonePrimary} required inputMode="tel" />
          </Field>
          <Field label="Second phone">
            <Input name="phoneSecondary" defaultValue={customer.phoneSecondary ?? ""} inputMode="tel" placeholder="Optional" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={customer.email ?? ""} placeholder="Optional" />
          </Field>
          <Field label="Address">
            <Textarea name="address" defaultValue={customer.address ?? ""} className="min-h-24" placeholder="Optional" />
          </Field>
          <Field label="Notes" hint="Only staff see this.">
            <Textarea name="notes" defaultValue={customer.notes ?? ""} className="min-h-24" placeholder="Optional" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Measurements</CardTitle>
          <p className="mt-1 text-sm text-muted">Saved for next time; new orders start from these. Past orders and their bills don’t change.</p>
        </CardHeader>
        <CardContent>
          {measurements.length ? (
            <MeasurementGrid values={measurements} editable />
          ) : (
            <p className="rounded-xl bg-surface-sunken p-4 text-sm text-muted shadow-pressed">No measurements saved yet. They’re saved automatically with each order, or you can add them from a new order.</p>
          )}
        </CardContent>
      </Card>

      {state.error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
          {state.error}
        </p>
      ) : null}

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex flex-wrap justify-end gap-2 rounded-2xl border border-white/70 bg-surface/95 px-3 py-3 shadow-raised backdrop-blur lg:bottom-3">
        <ButtonLink href={`/customers/${customer.id}`} variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={pending}>
          <Save className="h-4 w-4" aria-hidden />
          {pending ? "Saving…" : "Save customer"}
        </Button>
      </div>
    </form>
  );
}
