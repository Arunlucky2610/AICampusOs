import { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/10", props.className)} />;
}
