import { useMemo, useState } from "react";

/* =========================================================================
   ContributionHeatmap — GitHub-style activity grid, brutalist warm.
   Range: 90d or 1y (rolling). Cells: 18×18px, 4px gap, square corners.
   Streaks of 3+ consecutive days get a ring highlight.
   ========================================================================= */

type Metric = "doors" | "convos" | "leads" | "wins";
type Range = "90d" | "1y";

const METRICS: { key: Metric; label: string }[] = [
  { key: "doors", label: "Doors" },
  { key: "convos", label: "Convos" },
  { key: "leads", label: "Leads" },
  { key: "wins", label: "Wins" },
];

const RANGES: { key: Range; label: string; days: number }[] = [
  { key: "90d", label: "90d", days: 90 },
  { key: "1y", label: "1y", days: 365 },
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

const MAX_FOR: Record<Metric, number> = {
  doors: 60,
  convos: 25,
  leads: 12,
  wins: 5,
};

type Cell = {
  date: Date;
  value: number;
  inFuture: boolean;
  streakLen: number; // length of run this cell belongs to (>=1)
};

/* Build the grid for the given range, snapped to whole weeks (Sun-Sat). */
function buildGrid(metric: Metric, range: Range) {
  const rng = mulberry32(SEEDS[metric] + (range === "90d" ? 1 : 0));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = RANGES.find((r) => r.key === range)!.days;
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  /* End = the Saturday of the week containing today */
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));

  const totalDays =
    Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  const cols = totalDays / 7;

  const max = MAX_FOR[metric];
  const grid: Cell[][] = [];
  for (let c = 0; c < cols; c++) {
    const week: Cell[] = [];
    for (let r = 0; r < 7; r++) {
      const d = new Date(start);
      d.setDate(start.getDate() + c * 7 + r);
      const inFuture = d.getTime() > today.getTime();
      const dow = d.getDay();
      const weekendDip = dow === 0 || dow === 6 ? 0.35 : 1;
      const shaped = Math.pow(rng(), 1.6) * weekendDip;
      const value = inFuture ? 0 : Math.round(shaped * max);
      week.push({ date: d, value, inFuture, streakLen: 0 });
    }
    grid.push(week);
  }

  /* Compute per-cell streak length so we can ring 3+ day runs.
     Walk chronologically across the flat array of past days. */
  const flat = grid.flat().filter((c) => !c.inFuture);
  let runStart = 0;
  for (let i = 0; i <= flat.length; i++) {
    const broke = i === flat.length || flat[i].value <= 0;
    if (broke) {
      const len = i - runStart;
      if (len > 0) {
        for (let j = runStart; j < i; j++) flat[j].streakLen = len;
      }
      runStart = i + 1;
    }
  }

  return { grid, cols };
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* Doors thresholds (per spec). Other metrics: scaled relative to their max. */
function stepForDoors(value: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (value <= 0) return 0;
  if (value <= 7) return 1;
  if (value <= 19) return 2;
  if (value <= 34) return 3;
  if (value <= 49) return 4;
  return 5;
}
function stepRelative(value: number, max: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (value <= 0) return 0;
  const pct = value / max;
  if (pct < 0.2) return 1;
  if (pct < 0.4) return 2;
  if (pct < 0.6) return 3;
  if (pct < 0.85) return 4;
  return 5;
}

const CELL = 18;  // px
const GAP = 4;    // px

export function ContributionHeatmap() {
  const [metric, setMetric] = useState<Metric>("doors");
  const [range, setRange] = useState<Range>("1y");

  const { grid, cols, total, monthLabels, currentStreak, bestStreak } =
    useMemo(() => {
      const { grid, cols } = buildGrid(metric, range);
      const flat = grid.flat();
      const total = flat.reduce((s, c) => s + c.value, 0);

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

      /* Month labels above the first column where a new month starts.
         Use the top (Sunday) cell of each column. */
      const labels: { col: number; label: string }[] = [];
      let lastMonth = -1;
      grid.forEach((week, col) => {
        const m = week[0].date.getMonth();
        if (m !== lastMonth) {
          labels.push({ col, label: MONTHS[m] });
          lastMonth = m;
        }
      });

      return {
        grid,
        cols,
        total,
        monthLabels: labels,
        currentStreak: current,
        bestStreak: best,
      };
    }, [metric, range]);

  const max = MAX_FOR[metric];
  const totalLabel = `${metric} ${metric === "wins" ? "won" : "logged"} · last ${
    range === "90d" ? "90 days" : "year"
  }`;

  /* Left day-label column width — accounts for the label text + 6px gap */
  const dayColWidth = 28;
  const gridWidthPx = cols * CELL + (cols - 1) * GAP;

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

      {/* Controls — metric switcher + range toggle */}
      <div className="flex items-stretch gap-2 mb-3">
        <div className="grid grid-cols-4 flex-1 border-2 border-foreground">
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
        <div className="grid grid-cols-2 border-2 border-foreground shrink-0">
          {RANGES.map((r, i) => {
            const active = r.key === range;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`press-brutal px-2.5 py-2 text-[10px] font-mono font-bold uppercase tracking-wider active:translate-y-[2px] ${
                  i > 0 ? "border-l-2 border-foreground" : ""
                } ${active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
                aria-pressed={active}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid — horizontally scrollable on overflow */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div
          className="inline-block"
          style={{ minWidth: `${dayColWidth + gridWidthPx}px` }}
        >
          {/* Month labels row — leave space for the day-label column */}
          <div className="flex mb-1" style={{ paddingLeft: `${dayColWidth}px` }}>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
                columnGap: `${GAP}px`,
              }}
            >
              {Array.from({ length: cols }).map((_, col) => {
                const label = monthLabels.find((m) => m.col === col)?.label;
                return (
                  <div
                    key={col}
                    className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground h-3 leading-none"
                  >
                    {label ?? ""}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day labels + cell grid */}
          <div className="flex">
            {/* Day labels column (Mon/Wed/Fri) */}
            <div
              className="grid mr-1.5"
              style={{
                width: `${dayColWidth - 6}px`,
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                rowGap: `${GAP}px`,
              }}
            >
              {["", "Mon", "", "Wed", "", "Fri", ""].map((label, r) => (
                <div
                  key={r}
                  className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground leading-none flex items-center"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Cells: cols × 7 */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gridAutoFlow: "column",
                columnGap: `${GAP}px`,
                rowGap: `${GAP}px`,
              }}
            >
              {grid.flatMap((week) =>
                week.map((cell) => {
                  const s =
                    metric === "doors"
                      ? stepForDoors(cell.value)
                      : stepRelative(cell.value, max);
                  const dateLabel = cell.date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const title = cell.inFuture
                    ? dateLabel
                    : `${cell.value} ${metric} · ${dateLabel}${
                        cell.streakLen >= 3 ? ` · ${cell.streakLen}d streak` : ""
                      }`;
                  const inStreak = cell.streakLen >= 3 && !cell.inFuture;
                  return (
                    <div
                      key={cell.date.toISOString()}
                      title={title}
                      className={
                        cell.inFuture
                          ? "bg-transparent border border-foreground/10"
                          : `heatmap-${s} border border-foreground/25`
                      }
                      style={
                        inStreak
                          ? {
                              outline: "2px solid var(--foreground)",
                              outlineOffset: "-2px",
                            }
                          : undefined
                      }
                    />
                  );
                }),
              )}
            </div>
          </div>

          {/* Legend */}
          <div
            className="flex items-center justify-end gap-1.5 mt-3"
            style={{ paddingLeft: `${dayColWidth}px` }}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mr-1">
              Less
            </span>
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`heatmap-${n} border border-foreground/25`}
                style={{ width: `${CELL}px`, height: `${CELL}px` }}
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
