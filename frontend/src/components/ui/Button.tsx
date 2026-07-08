import { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Button({ className, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button className={cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-60",
    variant === "primary" && "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
    variant === "secondary" && "border border-line bg-white text-ink hover:border-primary/30 hover:bg-soft dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:border-primary/40 dark:hover:bg-white/[0.08]",
    variant === "ghost" && "text-muted hover:bg-soft hover:text-ink dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white/80",
    className
  )} {...props} />;
}
