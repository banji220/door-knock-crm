import { useState } from "react";

const RANGES = ["Today", "This Week", "This Month", "This Year"] as const;
export type DateRange = (typeof RANGES)[number];

/* Brutalist date-range toggle. Active = inverted (bg-foreground text-background).
   Inactive = bg-card with 2px ink border. NO border-radius. */
export function DateRangeToggle({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
}) {
  return (
    <div className="flex gap-2" role="group" aria-label="Date range">
      {RANGES.map((r) => {
        const active = r === value;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(r)}
            aria-pressed={active}
            className={[
              "press-brutal text-xs font-mono font-bold uppercase tracking-wider px-3 py-1.5 border-2 border-foreground transition-colors",
              active
                ? "bg-foreground text-background"
                : "bg-card text-foreground hover:bg-muted",
            ].join(" ")}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

export function useDateRange(initial: DateRange = "Today") {
  return useState<DateRange>(initial);
}
