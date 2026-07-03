import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-gradient-to-r from-[#7d1f36] to-[#b84862] text-white shadow-[0_12px_24px_rgba(125,31,54,0.20)] hover:from-[#5d1428] hover:to-[#9f3953]",
    secondary: "border border-[#e0c3a3] bg-white/90 text-[#2c2522] shadow-sm hover:border-[#d99a62] hover:bg-[#fff5ea]",
    ghost: "text-[#5d1428] hover:bg-[#fff1df]",
    danger: "bg-gradient-to-r from-[#a83232] to-[#c24a4a] text-white shadow-[0_12px_24px_rgba(168,50,50,0.18)] hover:from-[#8c2727] hover:to-[#a83232]"
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d99a62] disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
