import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(
    "rounded-[20px] border border-line bg-white shadow-[0_18px_60px_rgba(17,24,39,0.06)]",
    "dark:border-white/[0.08] dark:bg-[#111] dark:shadow-[0_18px_60px_rgba(0,0,0,0.3)]",
    className
  )} {...props} />;
}
