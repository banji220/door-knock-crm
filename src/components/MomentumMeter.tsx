import { useEffect, useMemo, useState } from "react";
import {
  buildYearOfActivity,
  computeMomentum,
} from "@/lib/activity-data";

/* =========================================================================
   MomentumMeter — composite 0-100 score with 7-day mini chart + trend line
   ========================================================================= */

const DOW_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function statusFor(score: number) {
  if (score >= 85) return { label: "Peak", emoji: "⚡", tone: "hot" as const, fill: "heatmap-5" };
  if (score >= 65) return { label: "Strong", emoji: "🔥", tone: "hot" as const, fill: "heatmap-4" };
  if (score >= 40) return { label: "Building", emoji: "📈", tone: "normal" as const, fill: "heatmap-3" };
  if (score >= 15) return { label: "Slow", emoji: "🐢", tone: "muted" as const, fill: "heatmap-2" };
  return { label: "Stalled", emoji: "💤", tone: "muted" as const, fill: "heatmap-1" };
}

export function MomentumMeter() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { score, trendPct, last7 } = useMemo(() => {
    const days = buildYearOfActivity();
    return computeMomentum(days);
  }, []);

  const status = statusFor(score);

  const badgeClass =
    status.tone === "hot"
      ? "bg-foreground text-background border-2 border-foreground"
      : status.tone === "muted"
        ? "bg-card text-muted-foreground border-2 border-muted-foreground/40"
        : "bg-card text-foreground border-2 border-foreground";

  /* Bar chart scaling — relative to the max door count in the window */
  const maxDoors = Math.max(1, ...last7.map((d) => d.doors));

  /* Trend label */
  let trendLabel: string;
  if (Math.abs(trendPct) < 5) {
    trendLabel = "→ Holding steady vs last week";
  } else if (trendPct > 0) {
    trendLabel = `↑ ${trendPct}% vs last week`;
  } else {
    trendLabel = `↓ ${Math.abs(trendPct)}% vs last week`;
  }

  /* Day letters — last bar is "Today" */
  const dayLabels = last7.map((d, i) =>
    i === last7.length - 1 ? "Today" : DOW_LETTERS[d.date.getDay()],
  );

  return (
    <section className="border-2 border-foreground bg-card px-4 py-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold uppercase tracking-tight">Momentum</h2>
        <span
          className={`px-2 py-0.5 font-mono font-bold text-[10px] uppercase tracking-wider ${badgeClass}`}
        >
          <span aria-hidden className="mr-1">{status.emoji}</span>
          {status.label}
        </span>
      </div>

      {/* Score gauge */}
      <div className="relative h-8 w-full border-2 border-foreground bg-muted overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${status.fill} transition-[width] duration-300`}
          style={{ width: `${score}%` }}
        />
        {/* Base label — ink */}
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold tabular-nums text-foreground">
          {score}/100
        </div>
        {/* Clipped overlay so label stays legible over fill */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-300"
          style={{ width: `${score}%` }}
          aria-hidden
        >
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-center text-xs font-mono font-bold tabular-nums text-background"
            style={{ width: `${100 / Math.max(score / 100, 0.0001)}%` }}
          >
            {score}/100
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Stalled
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Peak
        </span>
      </div>

      {/* 7-day mini bar chart */}
      <div className="mt-4">
        <div className="flex items-end gap-1 h-12">
          {last7.map((d, i) => {
            const h = Math.max(2, Math.round((d.doors / maxDoors) * 48));
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <div
                  className={`${status.fill} border border-foreground/25 w-full`}
                  style={{ height: `${h}px` }}
                  title={`${d.doors} doors`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="flex-1 text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Trend line */}
      <p className="mt-3 text-xs font-mono text-muted-foreground">
        {trendLabel}
      </p>
    </section>
  );
}
