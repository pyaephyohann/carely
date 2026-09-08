"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/utils/cn";
import { useTheme, type Theme } from "./theme-provider";

const themeOptions: {
  value: Theme;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  {
    value: "light",
    label: "Light",
    description: "Always use light mode",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use dark mode",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Match your device settings",
    icon: Monitor,
  },
];

interface ThemePreferenceSelectorProps {
  className?: string;
  showDescriptions?: boolean;
}

export function ThemePreferenceSelector({
  className,
  showDescriptions = true,
}: ThemePreferenceSelectorProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="radiogroup"
        aria-label="Appearance"
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(option.value)}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                isSelected
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40"
                  : "border-border bg-card hover:border-violet-200 dark:hover:border-violet-800",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isSelected
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-muted-foreground",
                )}
              />
              <div>
                <p className="font-medium text-sm text-foreground">{option.label}</p>
                {showDescriptions && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {theme === "system" && (
        <p className="text-xs text-muted-foreground">
          Currently using <span className="font-medium capitalize">{resolvedTheme}</span>{" "}
          mode based on your system preference.
        </p>
      )}
    </div>
  );
}
