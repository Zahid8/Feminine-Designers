import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-[#d8c7b4] bg-white px-3 text-sm outline-none transition placeholder:text-[#9b8f87] focus:border-[#7d1f36] focus:ring-2 focus:ring-[#7d1f36]/15",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-[#d8c7b4] bg-white px-3 py-2 text-sm outline-none transition placeholder:text-[#9b8f87] focus:border-[#7d1f36] focus:ring-2 focus:ring-[#7d1f36]/15",
        className
      )}
      {...props}
    />
  );
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
    <label className="grid gap-1.5 text-sm font-medium text-[#3b312d]">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-[#7c6d66]">{hint}</span> : null}
    </label>
  );
}
