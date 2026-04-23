import { useState } from "react";

const INCREMENTS = [1, 5, 10, 25] as const;

/* Brutalist quick-log card — 4 increment buttons in a row.
   Tap → bumps the local count (mock) and triggers a flash animation
   on the tapped button. Used on Today + Me dashboards. */
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
    <div className="border-2 border-foreground bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em]">
          Quick Log
        </h2>
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Today:{" "}
          <span className="font-bold text-foreground tabular-nums">
            {count}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {INCREMENTS.map((n) => {
          const isFlashed = flashed === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => bump(n)}
              aria-label={`Add ${n} doors`}
              className={[
                "press-brutal border-2 border-foreground font-mono font-bold text-xl py-3 transition-colors",
                isFlashed
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground hover:bg-muted",
              ].join(" ")}
            >
              +{n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
