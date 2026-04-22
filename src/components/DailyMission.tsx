import { useMemo } from "react";
import { Label } from "./ui-brutal";

type Props = {
  current: number;
  goal: number;
  /** Hour of day to start the workday (default 9 = 09:00) */
  startHour?: number;
};

/* Map a 0..1 progress value to a heatmap step for the FILL color.
   0–30% → 2 (warm yellow), 31–60% → 3 (burnt orange),
   61–99% → 4 (deep red-brown), 100%+ → 5 (dark chocolate-red). */
function heatStep(pct: number): 2 | 3 | 4 | 5 {
  if (pct >= 1) return 5;
  if (pct > 0.6) return 4;
  if (pct > 0.3) return 3;
  return 2;
}

export function DailyMission({ current, goal, startHour = 9 }: Props) {
  const pct = goal > 0 ? Math.min(1, current / goal) : 0;
  const pctLabel = Math.round(pct * 100);
  const complete = current >= goal;
  const step = heatStep(pct);

  /* Smart suggestion — extrapolate from doors-per-elapsed-hour */
  const suggestion = useMemo(() => {
    if (complete) return "Mission complete. Push for a stretch goal?";
    if (current <= 0) return "Knock your first door to start the pace clock.";

    const now = new Date();
    const start = new Date(now);
    start.setHours(startHour, 0, 0, 0);
    const elapsedMs = Math.max(60_000, now.getTime() - start.getTime());
    const perMs = current / elapsedMs;
    const remaining = goal - current;
    const eta = new Date(now.getTime() + remaining / perMs);

    /* If pace would push past 8pm, flag it */
    const cutoff = new Date(now);
    cutoff.setHours(20, 0, 0, 0);
    if (eta.getTime() > cutoff.getTime()) {
      return `At this pace, you won't hit ${goal} today. Pick it up.`;
    }
    const time = eta.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return `At this pace, you'll hit ${goal} by ${time}.`;
  }, [current, goal, complete, startHour]);

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <Label>Daily Mission</Label>
        <span
          className={`px-2 py-0.5 border-2 border-foreground font-mono font-bold text-[10px] uppercase tracking-[0.15em] ${
            complete
              ? "bg-[var(--success)] text-[var(--success-foreground)]"
              : "bg-card text-foreground"
          }`}
        >
          {complete ? "Mission Complete" : "In Progress"}
        </span>
      </div>

      <div className="border-2 border-foreground bg-card p-3">
        <div className="flex items-baseline justify-between mb-2">
          <div className="font-mono">
            <span className="text-2xl font-bold leading-none">{current}</span>
            <span className="text-muted-foreground">
              {" "}/ <span className="font-bold text-foreground">{goal}</span> doors
            </span>
          </div>
          <span className="font-mono font-bold text-lg leading-none">
            {pctLabel}%
          </span>
        </div>

        {/* Progress track — squared, 8px tall (h-2), no radius, no shadow */}
        <div
          className="relative w-full h-2 border-2 border-foreground heatmap-0 overflow-hidden"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={goal}
        >
          <div
            className={`h-full heatmap-${step} transition-[width] duration-300`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>

        <p className="mt-3 text-xs font-mono text-muted-foreground leading-snug">
          {suggestion}
        </p>
      </div>
    </section>
  );
}
