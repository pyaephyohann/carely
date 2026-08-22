import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "success" | "warning" | "error" | "info";
  size?: "sm" | "md";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "sm", ...props }, ref) => {
    const variants = {
      default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
      primary: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
      success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      error: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
      info: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    };

    const sizes = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
