import * as React from "react";

import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none ring-offset-white placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-600",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

