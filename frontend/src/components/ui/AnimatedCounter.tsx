import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  duration?: number;
}

export function AnimatedCounter({ value, suffix = "", prefix = "", decimals = 0, className, duration = 1500 }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    started.current = true;

    const startTime = performance.now();
    const startVal = 0;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (value - startVal) * eased;
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, [value, duration]);

  useEffect(() => {
    started.current = false;
  }, [value]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
