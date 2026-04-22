import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatNumber } from "@/lib/format";
import {
  buildYearOfActivity,
  colorStep,
  computeStreaks,
  metricValue,
  METRIC_LABELS,
  type DayRecord,
  type Metric,
} from "@/lib/activity-data";

/* =========================================================================
   ContributionHeatmap
   - Mobile (<768): 90 days, 14×14 cells, gap 3
   - Desktop:       1y by default, 18×18 cells, gap 4 (toggleable to 90d)
   - 3+ day streak cells get a 2px ink ring
   - Hover tooltip on desktop, tap-to-expand detail on mobile
   ========================================================================= */

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

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DOW_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Cell = DayRecord & { streakLen: number };

/* Slice the year to the requested range and snap to weeks (Sun-Sat) */
function buildGrid(allDays: DayRecord[], range: Range) {
  const days = RANGES.find((r) => r.key === range)!.days;
  const sliced = allDays.slice(-days);

  /* Pad the front to land on a Sunday */
  const firstDow = sliced[0].date.getDay();
  const padFront: DayRecord[] = [];
  for (let i = firstDow; i > 0; i--) {
    const d = new Date(sliced[0].date);
    d.setDate(d.getDate() - i);
    padFront.push({
      date: d, doors: 0, convos: 0, leads: 0, appts: 0, wins: 0,
      inFuture: true,
    });
  }
  /* Pad the back to land on Saturday */
  const last = sliced[sliced.length - 1];
  const padBack: DayRecord[] = [];
  for (let i = 1; i <= 6 - last.date.getDay(); i++) {
    const d = new Date(last.date);
    d.setDate(d.getDate() + i);
    padBack.push({
      date: d, doors: 0, convos: 0, leads: 0, appts: 0, wins: 0,
      inFuture: true,
    });
  }

  const flat: Cell[] = [...padFront, ...sliced, ...padBack].map((d) => ({
    ...d,
    streakLen: 0,
  }));

  /* Streak length (only for non-future days) */
  let runStart = 0;
  for (let i = 0; i <= flat.length; i++) {
    const broke = i === flat.length || flat[i].inFuture || flat[i].doors <= 0;
    if (broke) {
      const len = i - runStart;
      if (len > 0) {
        for (let j = runStart; j < i; j++) flat[j].streakLen = len;
      }
      runStart = i + 1;
    }
  }

  const cols = flat.length / 7;
  const grid: Cell[][] = [];
  for (let c = 0; c < cols; c++) {
    grid.push(flat.slice(c * 7, c * 7 + 7));
  }

  return { grid, cols };
}

function formatDate(d: Date) {
  return `${DOW_FULL[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function ContributionHeatmap() {
  const isMobile = useIsMobile();
  const [metric, setMetric] = useState<Metric>("doors");
  /* Mobile defaults to 90d; user can still flip to 1y */
  const [range, setRange] = useState<Range>(isMobile ? "90d" : "1y");
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const allDays = useMemo(() => buildYearOfActivity(), []);
  const { current: currentStreak, best: bestStreak } = useMemo(
    () => computeStreaks(allDays),
    [allDays],
  );

  const { grid, cols, total, monthLabels } = useMemo(() => {
    const { grid, cols } = buildGrid(allDays, range);
    const total = grid
      .flat()
      .filter((c) => !c.inFuture)
      .reduce((s, c) => s + metricValue(c, metric), 0);

    const labels: { col: number; label: string }[] = [];
    let lastMonth = -1;
    grid.forEach((week, col) => {
      const m = week[0].date.getMonth();
      if (m !== lastMonth) {
        labels.push({ col, label: MONTHS[m] });
        lastMonth = m;
      }
    });

    return { grid, cols, total, monthLabels: labels };
  }, [allDays, range, metric]);

  const CELL = isMobile ? 14 : 18;
  const GAP = isMobile ? 3 : 4;
  const dayColWidth = isMobile ? 24 : 28;

  const totalLabel = `${metric} ${metric === "wins" ? "won" : "logged"} · last ${
    range === "90d" ? "90 days" : "year"
  }`;

  const selectedCell = selectedDate
    ? grid.flat().find((c) => c.date.toISOString() === selectedDate) ?? null
    : null;

  return (
    <section className="border-2 border-foreground bg-card px-4 py-4 mb-6 relative">
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

      {/* Controls */}
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

      {/* Grid (horizontally scrollable) */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div
          className="inline-block"
          style={{ minWidth: `${dayColWidth + cols * CELL + (cols - 1) * GAP}px` }}
        >
          {/* Month labels */}
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

          <div className="flex">
            {/* Day labels (Mon/Wed/Fri) */}
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

            {/* Cells */}
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
                  const value = metricValue(cell, metric);
                  const s = colorStep(value, metric);
                  const inStreak = cell.streakLen >= 3 && !cell.inFuture;
                  const key = cell.date.toISOString();
                  const isSelected = selectedDate === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={cell.inFuture}
                      onMouseEnter={(e) => {
                        if (cell.inFuture) return;
                        setHoverCell(cell);
                        const rect = (
                          e.currentTarget.closest("section") as HTMLElement
                        ).getBoundingClientRect();
                        const cellRect = e.currentTarget.getBoundingClientRect();
                        setHoverPos({
                          x: cellRect.left - rect.left + CELL / 2,
                          y: cellRect.top - rect.top,
                        });
                      }}
                      onMouseLeave={() => {
                        setHoverCell(null);
                        setHoverPos(null);
                      }}
                      onClick={() => {
                        if (cell.inFuture) return;
                        setSelectedDate((d) => (d === key ? null : key));
                      }}
                      className={
                        cell.inFuture
                          ? "bg-transparent border border-foreground/10 cursor-default"
                          : `heatmap-${s} border border-foreground/25 cursor-pointer`
                      }
                      style={
                        isSelected
                          ? {
                              outline: "2px solid var(--foreground)",
                              outlineOffset: "0px",
                              zIndex: 1,
                              position: "relative",
                            }
                          : inStreak
                            ? {
                                outline: "2px solid var(--foreground)",
                                outlineOffset: "-2px",
                              }
                            : undefined
                      }
                      aria-label={
                        cell.inFuture
                          ? formatDate(cell.date)
                          : `${formatDate(cell.date)} — ${value} ${metric}`
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
            <span className="text-[11px] font-mono text-muted-foreground mr-1">
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
            <span className="text-[11px] font-mono text-muted-foreground ml-1">
              More
            </span>
          </div>
        </div>
      </div>

      {/* Mobile day-detail card */}
      {isMobile && selectedCell && (
        <div className="mt-4 border-2 border-foreground bg-background p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-mono font-bold text-sm">
              {formatDate(selectedCell.date)}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
              aria-label="Close detail"
            >
              Close ✕
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {(["doors", "convos", "leads", "appts", "wins"] as Metric[]).map((m) => (
              <div
                key={m}
                className="border-2 border-foreground bg-card px-1.5 py-1.5 text-center"
              >
                <div className="text-base font-mono font-bold tabular-nums leading-none">
                  {selectedCell[m]}
                </div>
                <div className="mt-1 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  {METRIC_LABELS[m]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop hover tooltip */}
      {!isMobile && hoverCell && hoverPos && (
        <div
          className="absolute z-20 pointer-events-none border-2 border-foreground bg-background p-2"
          style={{
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y}px`,
            transform: "translate(-50%, calc(-100% - 6px))",
          }}
        >
          <div className="font-mono font-bold text-xs whitespace-nowrap mb-1.5">
            {formatDate(hoverCell.date)}
          </div>
          <div className="grid grid-cols-5 gap-1">
            {(["doors", "convos", "leads", "appts", "wins"] as Metric[]).map((m) => (
              <div key={m} className="text-center">
                <div className="text-sm font-mono font-bold tabular-nums leading-none">
                  {hoverCell[m]}
                </div>
                <div className="mt-0.5 text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                  {METRIC_LABELS[m]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
