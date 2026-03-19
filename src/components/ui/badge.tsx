import * as React from "react";

import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "warning";

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

