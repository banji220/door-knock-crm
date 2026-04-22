import { useMemo, useState } from "react";

/* =========================================================================
   ContributionHeatmap — GitHub-style yearly grid, brutalist warm.
   53 cols × 7 rows, ending today. Cells use heatmap-0..5 utilities.
   ========================================================================= */

type Metric = "doors" | "convos" | "leads" | "wins";

const METRICS: { key: Metric; label: string }[] = [
  { key: "doors", label: "Doors" },
  { key: "convos", label: "Convos" },
  { key: "leads", label: "Leads" },
  { key: "wins", label: "Wins" },
];

/* Deterministic pseudo-random — stable across SSR + client renders */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEEDS: Record<Metric, number> = {
  doors: 42,
  convos: 1337,
  leads: 7,
  wins: 99,
};

/* Shape activity around weekdays + weekend dips, deterministic */
function buildYear(metric: Metric) {
  const rng = mulberry32(SEEDS[metric]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* Anchor: 52 weeks back, then snap to that week's Sunday */
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  /* Always 53 columns */
  const cols: { date: Date; value: number; inFuture: boolean }[][] = [];
  for (let c = 0; c < 53; c++) {
    const week: { date: Date; value: number; inFuture: boolean }[] = [];
    for (let r = 0; r < 7; r++) {
      const d = new Date(start);
      d.setDate(start.getDate() + c * 7 + r);
      const inFuture = d.getTime() > today.getTime();
      const dow = d.getDay();
      const weekendDip = dow === 0 || dow === 6 ? 0.35 : 1;
      const base = rng();
      /* Skew distribution so most days have low activity */
      const shaped = Math.pow(base, 1.6) * weekendDip;
      const max =
        metric === "doors" ? 60 : metric === "convos" ? 25 : metric === "leads" ? 12 : 5;
      const value = inFuture ? 0 : Math.round(shaped * max);
      week.push({ date: d, value, inFuture });
    }
    cols.push(week);
  }
  return cols;
}

/* Map a value to a heatmap step relative to the metric's max */
function step(value: number, max: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (value <= 0) return 0;
  const pct = value / max;
  if (pct < 0.2) return 1;
  if (pct < 0.4) return 2;
  if (pct < 0.6) return 3;
  if (pct < 0.85) return 4;
  return 5;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ContributionHeatmap() {
  const [metric, setMetric] = useState<Metric>("doors");

  const { weeks, total, monthLabels, currentStreak, bestStreak } = useMemo(() => {
    const weeks = buildYear(metric);
    const flat = weeks.flat();
    const total = flat.reduce((s, c) => s + c.value, 0);

    /* Streaks — count consecutive non-future days with value > 0,
       walking backwards from today for current; scan all for best. */
    const past = flat.filter((c) => !c.inFuture);
    let current = 0;
    for (let i = past.length - 1; i >= 0; i--) {
      if (past[i].value > 0) current++;
      else break;
    }
    let best = 0;
    let run = 0;
    for (const c of past) {
      if (c.value > 0) {
        run++;
        if (run > best) best = run;
      } else run = 0;
    }

    /* Month labels — show the month name above the first column where
       a new month begins (using the top row / Sunday of that column). */
    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
      const m = week[0].date.getMonth();
      if (m !== lastMonth) {
        labels.push({ col, label: MONTHS[m] });
        lastMonth = m;
      }
    });

    return {
      weeks,
      total,
      monthLabels: labels,
      currentStreak: current,
      bestStreak: best,
    };
  }, [metric]);

  const max =
    metric === "doors" ? 60 : metric === "convos" ? 25 : metric === "leads" ? 12 : 5;

  const totalLabel = `${metric} ${metric === "wins" ? "won" : "logged"} this year`;

  return (
    <section className="border-2 border-foreground bg-card px-4 py-4 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-3xl font-bold font-mono tabular-nums leading-none">
            {total.toLocaleString()}
          </div>
          <div className="mt-1.5 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            {totalLabel}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="block w-2 h-2 bg-primary" aria-hidden />
            <span className="text-xs font-mono font-bold tabular-nums">
              {currentStreak}d streak
            </span>
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground tabular-nums">
            best {bestStreak}d
          </div>
        </div>
      </div>

      {/* Metric switcher */}
      <div className="grid grid-cols-4 mb-3 border-2 border-foreground">
        {METRICS.map((m, i) => {
          const active = m.key === metric;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={`press-brutal py-2 text-xs font-mono font-bold uppercase tracking-wider active:translate-y-[2px] ${
                i > 0 ? "border-l-2 border-foreground" : ""
              } ${active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
              aria-pressed={active}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Grid — horizontal scroll on narrow screens */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="inline-block">
          {/* Month labels row */}
          <div
            className="grid mb-1"
            style={{
              gridTemplateColumns: `repeat(53, 12px)`,
              columnGap: "2px",
            }}
          >
            {Array.from({ length: 53 }).map((_, col) => {
              const label = monthLabels.find((m) => m.col === col)?.label;
              return (
                <div
                  key={col}
                  className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground h-3 leading-none"
                >
                  {label ?? ""}
                </div>
              );
            })}
          </div>

          {/* Cells: 53 columns × 7 rows */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(53, 12px)`,
              gridTemplateRows: `repeat(7, 12px)`,
              gridAutoFlow: "column",
              columnGap: "2px",
              rowGap: "2px",
            }}
          >
            {weeks.flatMap((week) =>
              week.map((cell) => {
                const s = step(cell.value, max);
                const dateLabel = cell.date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const title = cell.inFuture
                  ? dateLabel
                  : `${cell.value} ${metric} · ${dateLabel}`;
                return (
                  <div
                    key={cell.date.toISOString()}
                    title={title}
                    className={`w-3 h-3 border border-foreground/20 ${
                      cell.inFuture ? "bg-transparent border-foreground/10" : `heatmap-${s}`
                    }`}
                  />
                );
              }),
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
              Less
            </span>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`w-3 h-3 border border-foreground/20 heatmap-${n}`}
                aria-hidden
              />
            ))}
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground ml-1">
              More
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
