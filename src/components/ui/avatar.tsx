"use client";

import { type ImgHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";
import { getInitials } from "@/utils/format";

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, firstName, lastName, size = "md", ...props }, ref) => {
    const sizes = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
    };

    const initials = getInitials(firstName, lastName);

    if (src) {
      return (
        <div
          ref={ref}
          className={cn("relative rounded-full overflow-hidden flex-shrink-0", sizes[size], className)}
        >
          <img
            src={src}
            alt={`${firstName} ${lastName}`}
            className="h-full w-full object-cover"
            {...(props as ImgHTMLAttributes<HTMLImageElement>)}
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-full overflow-hidden flex-shrink-0",
          "bg-violet-100 text-violet-700 font-medium",
          "dark:bg-violet-950 dark:text-violet-300",
          "flex items-center justify-center",
          sizes[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
