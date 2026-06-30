import { useState } from "react";
import { cn } from "../../utils/cn";
import { getProfileUrl, getInitials } from "../../utils/profile";

type AvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<AvatarSize, { c: string; t: string }> = {
  sm: { c: "h-8 w-8", t: "text-[11px]" },
  md: { c: "h-10 w-10", t: "text-xs" },
  lg: { c: "h-20 w-20", t: "text-2xl" },
  xl: { c: "h-28 w-28", t: "text-4xl" },
};

const ROUNDED_MAP: Record<string, string> = {
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
  lg: "rounded-lg",
};

export function Avatar({
  src,
  name,
  size = "md",
  className,
  rounded = "xl",
}: {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  className?: string;
  rounded?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const dims = SIZE_MAP[size];
  const url = getProfileUrl(src);
  const roundedClass = ROUNDED_MAP[rounded] || "rounded-xl";

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name || "Profile"}
        onError={() => setImgError(true)}
        className={cn("shrink-0 object-cover", dims.c, roundedClass, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br from-[#6C4CF1] to-[#8B5CF6] font-bold text-white shadow-sm",
        dims.c,
        roundedClass,
        className,
      )}
    >
      <span className={dims.t}>{getInitials(name)}</span>
    </div>
  );
}
