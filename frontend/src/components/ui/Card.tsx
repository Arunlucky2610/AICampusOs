import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[20px] border border-line bg-white shadow-[0_18px_60px_rgba(17,24,39,0.06)]", className)} {...props} />;
}
