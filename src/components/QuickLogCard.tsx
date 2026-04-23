import { useState } from "react";
import { cn } from "@/lib/utils";

const INCREMENTS = [1, 5, 10, 25] as const;

/* =========================================================================
   QuickLogCard — inline pill row. Lightweight, no heavy container.

   Sits directly on the page: a single mono label + a 4-up segmented
   control. Each press flashes inverted briefly. Designed to feel as
   fast as a keyboard shortcut — the opposite of a "card with padding".
   ========================================================================= */
export function QuickLogCard({
  initialCount = 24,
}: {
  initialCount?: number;
}) {
  const [count, setCount] = useState(initialCount);
  const [flashed, setFlashed] = useState<number | null>(null);

  const bump = (n: number) => {
    setCount((c) => c + n);
    setFlashed(n);
    window.setTimeout(() => setFlashed((cur) => (cur === n ? null : cur)), 220);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(8);
    }
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="shrink-0">
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-muted-foreground leading-none">
          Quick Log
        </div>
        <div className="mt-1 text-xl font-mono font-bold tabular-nums leading-none">
          {count}
          <span className="ml-1 text-xs font-mono text-muted-foreground font-normal">
            today
          </span>
        </div>
      </div>

      {/* Segmented control — 4 pills, hairline border, share edges */}
      <div
        className="flex-1 grid grid-cols-4 border-hairline divide-x divide-[var(--hairline)] surface-raised"
        role="group"
        aria-label="Quick log doors"
      >
        {INCREMENTS.map((n) => {
          const isFlashed = flashed === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => bump(n)}
              aria-label={`Add ${n} doors`}
              className={cn(
                "press-brutal py-2.5 font-mono font-bold text-base tabular-nums transition-colors",
                isFlashed
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-muted",
              )}
            >
              +{n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
