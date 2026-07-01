import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-[#7d1f36] text-white hover:bg-[#5d1428]",
    secondary: "border border-[#d8c7b4] bg-white text-[#2c2522] hover:bg-[#f7efe2]",
    ghost: "text-[#5d1428] hover:bg-[#f4e7da]",
    danger: "bg-[#a83232] text-white hover:bg-[#8c2727]"
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
