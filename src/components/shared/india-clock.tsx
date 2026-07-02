"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/utils/date";

export function IndiaClock({ initialIso }: { initialIso: string }) {
  const initialMs = useRef(new Date(initialIso).getTime());
  const startedAt = useRef<number | null>(null);
  const [now, setNow] = useState(() => new Date(initialIso));

  useEffect(() => {
    startedAt.current = performance.now();
    const tick = () => {
      const elapsed = startedAt.current === null ? 0 : performance.now() - startedAt.current;
      setNow(new Date(initialMs.current + elapsed));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-[#4c1525]">
      <Clock className="h-4 w-4" />
      <span>{formatDateTime(now)}</span>
      <span className="text-xs text-[#7c6d66]">IST</span>
    </span>
  );
}
