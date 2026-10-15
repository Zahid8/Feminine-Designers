"use client";

import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type ToastTone = "success" | "error" | "info";

interface ToastInput {
  message: string;
  tone?: ToastTone;
  /** Optional action such as Undo. Runs once, then the toast closes. */
  action?: { label: string; onAction: () => void | Promise<void> };
  durationMs?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<{ show: (toast: ToastInput) => void } | null>(null);

/** Falls back to a no-op so components still render outside the app shell (e.g. in tests). */
export function useToast() {
  return useContext(ToastContext) ?? { show: () => undefined };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const show = useCallback((toast: ToastInput) => {
    const id = nextId.current++;
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="no-print pointer-events-none fixed inset-x-3 bottom-[calc(6.75rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end lg:bottom-4"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(onDismiss, toast.durationMs ?? (toast.action ? 7000 : 4000));
    return () => window.clearTimeout(timer);
  }, [paused, onDismiss, toast.durationMs, toast.action]);

  const Icon = toast.tone === "error" ? AlertTriangle : CheckCircle2;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="toast-enter pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-wine-deep px-4 py-3 text-sm text-white shadow-raised-lg"
    >
      <Icon className={cn("h-5 w-5 shrink-0", toast.tone === "error" ? "text-amber-300" : "text-emerald-300")} aria-hidden />
      <p className="min-w-0 flex-1">{toast.message}</p>
      {toast.action ? (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await toast.action?.onAction();
            } finally {
              onDismiss();
            }
          }}
          className="shrink-0 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold-soft transition hover:bg-white/25 disabled:opacity-60"
        >
          {toast.action.label}
        </button>
      ) : null}
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="shrink-0 rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
