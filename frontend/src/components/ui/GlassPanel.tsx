import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "strong" | "dark";
  hover?: boolean;
  gradient?: boolean;
}

export function GlassPanel({ className, variant = "light", hover = true, gradient = false, children, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] transition-all duration-300",
        variant === "light" && "glass-card",
        variant === "strong" && "glass-strong shadow-premium",
        variant === "dark" && "glass-dark",
        hover && "hover:shadow-glass-lg cursor-pointer",
        gradient && "gradient-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
