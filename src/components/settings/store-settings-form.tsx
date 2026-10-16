"use client";

import { useActionState, useEffect, useState } from "react";
import { AlertTriangle, MessageCircle, Receipt, Save, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { MESSAGE_PLACEHOLDERS, renderTemplate } from "@/lib/messages/render-template";
import { useUnsavedChangesGuard } from "@/lib/ui/use-unsaved-changes-guard";
import { initialSettingsActionState, type SettingsActionState } from "@/services/settings/settings-action-state";
import type { MessageTemplates, StoreSettings } from "@/types/domain";

const SAMPLE_VALUES = {
  name: "Natasha",
  store: "",
  receipt: "SJD-2026-000043",
  items: "Blouse ×2, Saree Fall/Pico",
  total: "₹4,515.00",
  paid: "₹1,000.00",
  balance: "₹3,515.00",
  delivery: "05/09/2026",
  bill_link: "https://…/bill/…"
};

const TEMPLATE_FIELDS: { key: keyof MessageTemplates; label: string; hint: string }[] = [
  { key: "orderConfirmation", label: "Order confirmation", hint: "Sent after the order is booked." },
  { key: "readyForPickup", label: "Ready for pickup", hint: "Sent when the clothes are ready." },
  { key: "balanceReminder", label: "Balance reminder", hint: "Only offered when money is still due." }
];

/** Store profile, GST and bill terms, and WhatsApp wording: one form, one Save. */
export function StoreSettingsForm({
  settings,
  action
}: {
  settings: StoreSettings;
  action: (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, initialSettingsActionState);
  const toast = useToast();
  const guard = useUnsavedChangesGuard();
  const [templates, setTemplates] = useState<MessageTemplates>(settings.messageTemplates);
  const [rates, setRates] = useState({ cgst: String(settings.defaultCgstRate), sgst: String(settings.defaultSgstRate) });
  const gstChanged = Number(rates.cgst) !== settings.defaultCgstRate || Number(rates.sgst) !== settings.defaultSgstRate;

  useEffect(() => {
    if (state.status !== "idle") toast.show({ tone: state.status === "error" ? "error" : "success", message: state.message, durationMs: 7000 });
  }, [state, toast]);

  return (
    <form action={formAction} onChange={guard.onChange} onSubmit={guard.onSubmit} className="grid gap-5">
      <Card id="store">
        <CardHeader className="flex items-center gap-3">
          <Store className="h-5 w-5 text-section-settings" aria-hidden />
          <CardTitle>Store profile</CardTitle>
        </CardHeader>
        <CardContent className="grid items-start gap-4 md:grid-cols-2">
          <Field label="Store name">
            <Input name="storeName" defaultValue={settings.storeName} required />
          </Field>
          <Field label="GSTIN" hint="15 letters and digits, printed on every bill.">
            <Input name="gstin" defaultValue={settings.gstin} className="uppercase" maxLength={15} required />
          </Field>
          <Field label="Primary phone">
            <Input name="phonePrimary" defaultValue={settings.phonePrimary} inputMode="tel" required />
          </Field>
          <Field label="Second phone">
            <Input name="phoneSecondary" defaultValue={settings.phoneSecondary} inputMode="tel" placeholder="Optional" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" defaultValue={settings.email} placeholder="Optional" />
          </Field>
          <Field label="Address" hint="One line per row; printed on bills.">
            <Textarea name="address" defaultValue={settings.addressLines.join("\n")} className="min-h-28" required />
          </Field>
        </CardContent>
      </Card>

      <Card id="bill">
        <CardHeader className="flex items-center gap-3">
          <Receipt className="h-5 w-5 text-section-orders" aria-hidden />
          <CardTitle>Bill & GST</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="CGST %">
              <Input name="defaultCgstRate" inputMode="decimal" value={rates.cgst} onChange={(event) => setRates((r) => ({ ...r, cgst: event.target.value }))} />
            </Field>
            <Field label="SGST %">
              <Input name="defaultSgstRate" inputMode="decimal" value={rates.sgst} onChange={(event) => setRates((r) => ({ ...r, sgst: event.target.value }))} />
            </Field>
            <Field label="Receipt prefix" hint="Fixed so receipt numbers stay in one series.">
              <Input value={settings.receiptPrefix} readOnly aria-readonly="true" className="opacity-70" />
            </Field>
          </div>
          {gstChanged ? (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              New GST rates apply to orders created after you save. Bills already saved keep their original tax.
            </p>
          ) : null}
          <Field label="Customer bill terms" hint="One paragraph per line, printed under “Terms” on the customer copy.">
            <Textarea name="customerTerms" defaultValue={settings.customerTerms.join("\n")} className="min-h-36" />
          </Field>
          <Field label="Store copy note" hint="Short note printed at the bottom of the store copy.">
            <Textarea name="termsAndConditions" defaultValue={settings.termsAndConditions} />
          </Field>
        </CardContent>
      </Card>

      <Card id="messages">
        <CardHeader className="grid gap-2">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-5 w-5 text-emerald-700" aria-hidden />
            <CardTitle>WhatsApp messages</CardTitle>
          </div>
          <p className="text-sm text-muted">
            These fill in automatically. Use:{" "}
            {MESSAGE_PLACEHOLDERS.map((placeholder) => (
              <code key={placeholder} className="mx-0.5 rounded-md bg-surface-sunken px-1.5 py-0.5 text-xs text-wine-ink">
                {`{${placeholder}}`}
              </code>
            ))}
          </p>
        </CardHeader>
        <CardContent className="grid gap-5">
          {TEMPLATE_FIELDS.map((field) => (
            <div key={field.key} className="grid gap-3 lg:grid-cols-2">
              <Field label={field.label} hint={field.hint}>
                <Textarea
                  name={`template.${field.key}`}
                  value={templates[field.key]}
                  onChange={(event) => setTemplates((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="min-h-32 font-mono text-xs"
                />
              </Field>
              <div className="grid content-start gap-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-label">Preview</span>
                <p className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-emerald-50 px-3 py-2.5 text-sm text-emerald-950 shadow-raised-sm">
                  {renderTemplate(templates[field.key], { ...SAMPLE_VALUES, store: settings.storeName })}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-20 flex justify-end rounded-2xl border border-white/70 bg-surface/95 px-3 py-3 shadow-raised backdrop-blur lg:bottom-3">
        <Button type="submit" disabled={pending} className="min-w-40">
          <Save className="h-4 w-4" aria-hidden />
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
