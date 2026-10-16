"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { formatINR } from "@/lib/utils/money";
import type { ReportBucket } from "@/lib/reports/report-model";

const MARK = "#7d1f36"; // wine, contrast-checked against the card surface
const GRID = "#eadfce";

function compactRupees(paise: number) {
  const rupees = paise / 100;
  if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(rupees >= 1_000_000 ? 0 : 1)}L`;
  if (rupees >= 1_000) return `₹${(rupees / 1_000).toFixed(rupees >= 10_000 ? 0 : 1)}K`;
  return `₹${Math.round(rupees)}`;
}

function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10;
  return step * magnitude;
}

/** Single-series column chart of money collected per day or month, with per-column tooltips. */
export function CollectionsChart({ buckets, grouping }: { buckets: ReportBucket[]; grouping: "day" | "month" }) {
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const max = niceMax(Math.max(0, ...buckets.map((bucket) => bucket.amountPaise)));
  const peakIndex = buckets.reduce((best, bucket, index) => (bucket.amountPaise > (buckets[best]?.amountPaise ?? 0) ? index : best), 0);
  const ticks = [0, 0.5, 1].map((fraction) => fraction * max);
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 10));

  return (
    <figure className="grid gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <figcaption className="font-serif text-xl font-medium text-wine-deep">Money collected per {grouping}</figcaption>
        <button type="button" onClick={() => setShowTable((current) => !current)} className="text-sm font-semibold text-wine underline-offset-2 hover:underline">
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>
      {showTable ? (
        <BucketTable buckets={buckets} valueLabel="Collected" />
      ) : (
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div className="flex h-48 flex-col-reverse justify-between pb-6 text-right text-[11px] tabular-nums text-muted">
            {ticks.map((tick) => (
              <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0">
                {compactRupees(tick)}
              </span>
            ))}
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-42">
              {ticks.map((tick) => (
                <div key={tick} className="absolute inset-x-0 h-px" style={{ bottom: `${(tick / max) * 100}%`, backgroundColor: GRID }} />
              ))}
            </div>
            <div className="flex h-42 items-end gap-0.5" role="list" aria-label="Collections">
              {buckets.map((bucket, index) => {
                const height = bucket.amountPaise > 0 ? Math.max(2, (bucket.amountPaise / max) * 100) : 0;
                return (
                  <div
                    key={bucket.key}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${bucket.label}: ${formatINR(bucket.amountPaise)} from ${bucket.count} payments`}
                    onPointerEnter={() => setActive(index)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                    className="relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
                  >
                    <div
                      className={cn("w-full max-w-6 rounded-t-[4px] transition", active === index ? "opacity-80" : "opacity-100")}
                      style={{ height: `${height}%`, backgroundColor: MARK }}
                    />
                    {index === peakIndex && bucket.amountPaise > 0 && active === null ? (
                      <span className="absolute -translate-y-1 whitespace-nowrap text-[11px] font-semibold text-ink" style={{ bottom: `${height}%` }}>
                        {compactRupees(bucket.amountPaise)}
                      </span>
                    ) : null}
                    {active === index ? (
                      <span
                        role="tooltip"
                        className="absolute z-10 -translate-y-2 whitespace-nowrap rounded-lg bg-wine-deep px-2.5 py-1.5 text-xs text-white shadow-raised"
                        style={{ bottom: `${height}%` }}
                      >
                        <strong className="block text-sm">{formatINR(bucket.amountPaise)}</strong>
                        <span className="text-white/75">
                          {bucket.label} · {bucket.count} {bucket.count === 1 ? "payment" : "payments"}
                        </span>
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex gap-0.5 text-[10px] text-muted">
              {buckets.map((bucket, index) => (
                <span key={bucket.key} className="min-w-0 flex-1 truncate text-center">
                  {index % labelEvery === 0 ? bucket.label : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </figure>
  );
}

/** Horizontal bars: pieces ordered per garment type, value at the tip. */
export function GarmentMixChart({ buckets }: { buckets: ReportBucket[] }) {
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return (
    <figure className="grid gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <figcaption className="font-serif text-xl font-medium text-wine-deep">Garments ordered</figcaption>
        <button type="button" onClick={() => setShowTable((current) => !current)} className="text-sm font-semibold text-wine underline-offset-2 hover:underline">
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>
      {buckets.length === 0 ? (
        <p className="text-sm text-muted">No garments in this period.</p>
      ) : showTable ? (
        <BucketTable buckets={buckets} valueLabel="Billed" showCount />
      ) : (
        <ul className="grid gap-2">
          {buckets.slice(0, 10).map((bucket) => (
            <li key={bucket.key} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-sm" title={`${bucket.label}: ${bucket.count} pieces, ${formatINR(bucket.amountPaise)} billed`}>
              <span className="truncate text-ink-soft">{bucket.label}</span>
              <span className="flex items-center gap-2">
                <span className="h-4 rounded-r-[4px]" style={{ width: `${Math.max(2, (bucket.count / max) * 85)}%`, backgroundColor: MARK }} />
                <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-ink">{bucket.count}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

function BucketTable({ buckets, valueLabel, showCount = false }: { buckets: ReportBucket[]; valueLabel: string; showCount?: boolean }) {
  return (
    <div className="max-h-64 overflow-y-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-peach text-left text-xs uppercase text-muted-strong">
          <tr>
            <th className="px-3 py-2 font-semibold">Period / item</th>
            {showCount ? <th className="px-3 py-2 text-right font-semibold">Pieces</th> : <th className="px-3 py-2 text-right font-semibold">Payments</th>}
            <th className="px-3 py-2 text-right font-semibold">{valueLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-soft">
          {buckets.map((bucket) => (
            <tr key={bucket.key}>
              <td className="px-3 py-1.5">{bucket.label}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{bucket.count}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatINR(bucket.amountPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
