import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const fieldControlClass =
  "w-full rounded-xl border border-transparent bg-surface-sunken px-3 text-sm text-ink shadow-pressed outline-none transition placeholder:text-muted-soft focus:border-gold focus:bg-surface-strong focus:ring-2 focus:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-60";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldControlClass, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldControlClass, "min-h-24 py-2", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldControlClass, "h-11 cursor-pointer", className)} {...props} />;
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink-soft">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-label">{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-muted">{hint}</span> : null}
    </label>
  );
}
