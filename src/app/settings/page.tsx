import { Download, HardDriveDownload } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonBaseClass, buttonVariantClasses } from "@/components/ui/button";
import { GarmentManager } from "@/components/settings/garment-manager";
import { SettingsManagement } from "@/components/settings/settings-management";
import { StoreSettingsForm } from "@/components/settings/store-settings-form";
import { TailorManager } from "@/components/settings/tailor-manager";
import { cn } from "@/lib/utils/cn";
import { getStoreSettings, listGarmentTypes, listTailors } from "@/services/settings/settings-service";
import { listMeasurementTemplates } from "@/services/measurements/measurement-service";
import {
  addGarmentTypeAction,
  addMeasurementFieldAction,
  addMeasurementTemplateAction,
  addTailorAction,
  moveGarmentAction,
  moveMeasurementFieldAction,
  removeMeasurementTemplateAction,
  renameTailorAction,
  setGarmentActiveAction,
  setMeasurementFieldActiveAction,
  setTailorActiveAction,
  updateGarmentAction,
  updateMeasurementFieldAction,
  updateStoreSettingsAction
} from "@/app/settings/actions";

export const dynamic = "force-dynamic";

const SECTIONS = [
  ["store", "Store"],
  ["bill", "Bill & GST"],
  ["messages", "Messages"],
  ["garments", "Garments"],
  ["tailors", "Tailors"],
  ["measurements", "Measurements"],
  ["backup", "Backup"]
] as const;

export default async function SettingsPage() {
  const [settings, garmentTypes, measurementTemplates, tailors] = await Promise.all([
    getStoreSettings(),
    listGarmentTypes(),
    listMeasurementTemplates(),
    listTailors()
  ]);

  return (
    <AppShell>
      <PageHeading title="Settings" description="Your shop details, bills, WhatsApp wording, garment prices, tailors, and measurements." />
      <nav
        aria-label="Settings sections"
        className="sticky top-[4.25rem] z-10 mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-surface-sunken/95 p-1.5 shadow-pressed backdrop-blur md:top-[4.75rem]"
      >
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="inline-flex min-h-10 shrink-0 items-center rounded-xl px-4 text-sm font-semibold text-ink-soft transition hover:bg-surface hover:text-wine">
            {label}
          </a>
        ))}
      </nav>

      <div className="grid gap-5 [&>*]:scroll-mt-36">
        <StoreSettingsForm settings={settings} action={updateStoreSettingsAction} />
        <GarmentManager
          garmentTypes={garmentTypes}
          addAction={addGarmentTypeAction}
          updateAction={updateGarmentAction}
          moveAction={moveGarmentAction}
          setActiveAction={setGarmentActiveAction}
        />
        <TailorManager tailors={tailors} addAction={addTailorAction} renameAction={renameTailorAction} setActiveAction={setTailorActiveAction} />
        <SettingsManagement
          measurementTemplates={measurementTemplates}
          addMeasurementTemplateAction={addMeasurementTemplateAction}
          addMeasurementFieldAction={addMeasurementFieldAction}
          removeMeasurementTemplateAction={removeMeasurementTemplateAction}
          fieldActions={{ update: updateMeasurementFieldAction, move: moveMeasurementFieldAction, setActive: setMeasurementFieldActiveAction }}
        />
        <Card id="backup">
          <CardHeader className="grid gap-1">
            <div className="flex items-center gap-3">
              <HardDriveDownload className="h-5 w-5 text-section-reports" aria-hidden />
              <CardTitle>Backup</CardTitle>
            </div>
            <p className="text-sm text-muted">Download spreadsheets you can open in Excel or Google Sheets. Keep a copy somewhere safe now and then.</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <a href="/api/backup/customers" download className={cn(buttonBaseClass, buttonVariantClasses.secondary)}>
              <Download className="h-4 w-4" aria-hidden />
              All customers (CSV)
            </a>
            <a href="/api/reports/orders?range=all" download className={cn(buttonBaseClass, buttonVariantClasses.secondary)}>
              <Download className="h-4 w-4" aria-hidden />
              All orders (CSV)
            </a>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
