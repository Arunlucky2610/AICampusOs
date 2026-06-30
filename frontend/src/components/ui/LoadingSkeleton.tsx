import { cn } from "../../utils/cn";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "shimmer-bg rounded-xl",
        variant === "text" && "h-4 w-full",
        variant === "circular" && "h-12 w-12 rounded-full",
        variant === "rectangular" && "h-32 w-full",
        variant === "card" && "h-48 w-full rounded-[20px]",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-[20px] border border-line bg-white p-5">
      <Skeleton variant="circular" className="mb-4 h-10 w-10" />
      <Skeleton className="mb-2 h-5 w-3/4" />
      <Skeleton className="mb-1 h-4 w-1/2" />
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-1 h-3 w-2/3" />
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" className="h-8 w-8" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
