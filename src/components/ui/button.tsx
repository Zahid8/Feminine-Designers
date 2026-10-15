import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export const buttonBaseClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-br from-wine to-rose text-white shadow-brand hover:from-wine-hover hover:to-wine hover:shadow-lg active:shadow-md",
  secondary: "border border-white/70 bg-surface text-ink shadow-raised-sm hover:text-wine active:shadow-pressed",
  ghost: "text-wine-hover hover:bg-peach active:shadow-pressed",
  danger: "bg-gradient-to-br from-danger to-[#c24a4a] text-white shadow-danger hover:from-[#8c2727] hover:to-danger"
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={cn(buttonBaseClass, buttonVariantClasses[variant], className)} {...props} />;
}

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link className={cn(buttonBaseClass, buttonVariantClasses[variant], className)} {...props} />;
}
