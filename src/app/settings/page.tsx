import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { getStoreSettings } from "@/services/settings/settings-service";
import { listGarmentTypes } from "@/services/settings/settings-service";
import { listMeasurementTemplates } from "@/services/measurements/measurement-service";
import { SettingsManagement } from "@/components/settings/settings-management";
import {
  addGarmentTypeAction,
  addMeasurementFieldAction,
  addMeasurementTemplateAction
} from "@/app/settings/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, garmentTypes, measurementTemplates] = await Promise.all([
    getStoreSettings(),
    listGarmentTypes(),
    listMeasurementTemplates()
  ]);
  return (
    <AppShell>
      <PageHeading
        title="Settings"
        description="Admin-only configuration for store profile, GST, receipt numbering, measurement labels, and garment presets."
      />
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Store Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Store name">
              <Input defaultValue={settings.storeName} />
            </Field>
            <Field label="GSTIN">
              <Input defaultValue={settings.gstin} />
            </Field>
            <Field label="Primary phone">
              <Input defaultValue={settings.phonePrimary} />
            </Field>
            <Field label="Secondary phone">
              <Input defaultValue={settings.phoneSecondary} />
            </Field>
            <Field label="Email">
              <Input defaultValue={settings.email} />
            </Field>
            <Field label="Logo path" hint="The app looks for public/Logo.PNG and falls back to text if unavailable.">
              <Input defaultValue={settings.logoPath} />
            </Field>
            <label className="grid gap-1 text-sm font-medium md:col-span-2">
              <span>Address</span>
              <Textarea defaultValue={settings.addressLines.join("\n")} />
            </label>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Receipt Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <Field label="Prefix">
              <Input defaultValue={settings.receiptPrefix} />
            </Field>
            <Field label="CGST">
              <Input defaultValue={settings.defaultCgstRate} />
            </Field>
            <Field label="SGST">
              <Input defaultValue={settings.defaultSgstRate} />
            </Field>
            <Field label="Reset">
              <Input defaultValue={settings.receiptResetFrequency} />
            </Field>
          </CardContent>
        </Card>
        <SettingsManagement
          garmentTypes={garmentTypes}
          measurementTemplates={measurementTemplates}
          addGarmentTypeAction={addGarmentTypeAction}
          addMeasurementTemplateAction={addMeasurementTemplateAction}
          addMeasurementFieldAction={addMeasurementFieldAction}
        />
      </div>
    </AppShell>
  );
}
