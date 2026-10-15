"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils/date";

// The time is only rendered after mount: rendering it on the server produced a
// different string than the client's first render and caused hydration errors.
export function IndiaClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold tabular-nums text-wine-ink">
      <Clock className="h-4 w-4" />
      <span className="min-w-[10.5rem]">{now ? formatDateTime(now) : " "}</span>
      <span className="text-xs text-muted">IST</span>
    </span>
  );
}
