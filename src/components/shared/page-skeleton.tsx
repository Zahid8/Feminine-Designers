import { AppShell } from "@/components/layout/app-shell";

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-sunken shadow-pressed ${className}`} />;
}

export function PageSkeleton({ cards = 4, rows = 5 }: { cards?: number; rows?: number }) {
  return (
    <AppShell>
      <div role="status" aria-live="polite" aria-label="Loading">
        <div className="mb-6 grid gap-2 px-1">
          <Block className="h-3 w-32" />
          <Block className="h-9 w-64" />
          <Block className="h-4 w-96 max-w-full" />
        </div>
        {cards > 0 ? (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: cards }, (_, index) => (
              <div key={index} className="rounded-2xl border border-white/70 bg-surface p-4 shadow-raised">
                <Block className="h-3 w-24" />
                <Block className="mt-3 h-8 w-20" />
                <Block className="mt-4 h-3 w-40" />
              </div>
            ))}
          </div>
        ) : null}
        <div className="grid gap-3 rounded-2xl border border-white/70 bg-surface p-4 shadow-raised">
          {Array.from({ length: rows }, (_, index) => (
            <Block key={index} className="h-14 w-full" />
          ))}
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    </AppShell>
  );
}
