import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-breakpoint";
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
   ContributionHeatmap — fluid responsive grid, single source of truth.

   Per-tier defaults (user can override via the range button):
     mobile  → 90 days
     tablet  → 180 days
     desktop → 365 days

   Cells are 100%-fluid (1fr columns) so the grid ALWAYS fills the card.
   No fixed pixel widths, no horizontal scroll, no centered empty space.
   Tabs never wrap — they scroll horizontally on mobile if pressed.
   Tooltip uses a stacked grid layout on touch tiers; multi-column on desktop.
   ========================================================================= */

type Range = "90d" | "180d" | "1y";

const METRICS: { key: Metric; label: string }[] = [
  { key: "doors", label: "Doors" },
  { key: "convos", label: "Convos" },
  { key: "leads", label: "Leads" },
  { key: "wins", label: "Wins" },
];

const RANGES: { key: Range; label: string; days: number }[] = [
  { key: "90d", label: "90d", days: 90 },
  { key: "180d", label: "180d", days: 180 },
  { key: "1y", label: "1y", days: 365 },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DOW_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Cell = DayRecord & { streakLen: number };

/* Slice the year to the requested range, snapped to weeks (Sun-Sat). */
function buildGrid(allDays: DayRecord[], range: Range) {
  const days = RANGES.find((r) => r.key === range)!.days;
  const sliced = allDays.slice(-days);

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "mobile";
  const isTablet = breakpoint === "tablet";
  const isDesktop = breakpoint === "desktop";

  const [metric, setMetric] = useState<Metric>("doors");
  const [range, setRange] = useState<Range>("1y"); // desktop default for SSR
  const [hoverCell, setHoverCell] = useState<Cell | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);
  const rangeMenuRef = useRef<HTMLDivElement>(null);

  /* Auto-select range by tier on first mount + on tier change, until user
     manually picks a range (then their choice sticks). */
  const [rangeUserSet, setRangeUserSet] = useState(false);
  useEffect(() => {
    if (!mounted || rangeUserSet) return;
    setRange(isMobile ? "90d" : isTablet ? "180d" : "1y");
  }, [mounted, isMobile, isTablet, rangeUserSet]);
  const setRangeManual = (r: Range) => {
    setRangeUserSet(true);
    setRange(r);
    setRangeMenuOpen(false);
  };

  useEffect(() => {
    if (!rangeMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!rangeMenuRef.current?.contains(e.target as Node)) {
        setRangeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [rangeMenuOpen]);

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

  /* Spacing per tier — gap and day-label width. Cell SIZE itself is fluid
     (1fr) so the grid always fills 100% of available width. */
  const GAP = isMobile ? 2 : isTablet ? 3 : 3;
  const DAY_LABEL_W = isMobile ? 18 : isTablet ? 22 : 26;
  const LEGEND_CELL = isMobile ? 12 : isTablet ? 14 : 16;

  const totalLabel = `${metric} ${metric === "wins" ? "won" : "logged"} · last ${
    range === "90d" ? "90 days" : range === "180d" ? "180 days" : "year"
  }`;

  const selectedCell = selectedDate
    ? grid.flat().find((c) => c.date.toISOString() === selectedDate) ?? null
    : null;

  /* SSR-safe placeholder */
  if (!mounted) {
    return (
      <section className="border-2 border-foreground bg-card px-4 py-4 lg:px-5 lg:py-5 relative">
        <div className="h-[280px] sm:h-[340px] lg:h-[420px]" aria-hidden />
      </section>
    );
  }

  return (
    <section className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5 relative">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums leading-none">
            {formatNumber(total)}
          </div>
          <div className="mt-1.5 text-[10px] sm:text-xs font-mono text-muted-foreground uppercase tracking-wider">
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

      {/* Controls — tabs + single timeframe button */}
      <div className="flex items-stretch gap-2 mb-3">
        <div
          className="flex-1 min-w-0 flex border-2 border-foreground overflow-x-auto scrollbar-none"
          role="tablist"
          aria-label="Metric"
        >
          {METRICS.map((m, i) => {
            const active = m.key === metric;
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                onClick={() => setMetric(m.key)}
                className={[
                  "press-brutal flex-1 px-2 sm:px-3 lg:px-4 py-2 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap active:translate-y-[2px]",
                  i > 0 ? "border-l-2 border-foreground" : "",
                  active ? "bg-foreground text-background" : "bg-muted text-muted-foreground",
                ].join(" ")}
                aria-pressed={active}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="relative shrink-0" ref={rangeMenuRef}>
          <button
            type="button"
            onClick={() => setRangeMenuOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={rangeMenuOpen}
            className="press-brutal h-full flex items-center gap-1.5 px-3 py-2 border-2 border-foreground bg-card text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider active:translate-y-[2px]"
          >
            <span className="tabular-nums">
              {RANGES.find((r) => r.key === range)?.label.toUpperCase()}
            </span>
            <ChevronDown
              className={`size-3.5 transition-transform ${rangeMenuOpen ? "rotate-180" : ""}`}
              strokeWidth={2.75}
            />
          </button>
          {rangeMenuOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[7rem] border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--foreground)]"
            >
              {RANGES.map((r) => {
                const active = r.key === range;
                return (
                  <button
                    key={r.key}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => setRangeManual(r.key)}
                    className={`block w-full text-left px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 border-foreground last:border-b-0 ${
                      active
                        ? "bg-foreground text-background"
                        : "bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fluid grid — fills 100% width at every tier */}
      <div className="w-full">
        {/* Month labels */}
        <div className="flex mb-1" style={{ paddingLeft: `${DAY_LABEL_W}px` }}>
          <div
            className="grid flex-1 min-w-0"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              columnGap: `${GAP}px`,
            }}
          >
            {Array.from({ length: cols }).map((_, col) => {
              const label = monthLabels.find((m) => m.col === col)?.label;
              return (
                <div
                  key={col}
                  className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-muted-foreground h-3 leading-none"
                >
                  {label ?? ""}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex w-full">
          {/* Day labels (Mon/Wed/Fri) */}
          <div
            className="grid mr-1.5 shrink-0"
            style={{
              width: `${DAY_LABEL_W - 6}px`,
              gridTemplateRows: `repeat(7, minmax(0, 1fr))`,
              rowGap: `${GAP}px`,
            }}
          >
            {["", "Mon", "", "Wed", "", "Fri", ""].map((label, r) => (
              <div
                key={r}
                className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-muted-foreground leading-none flex items-center"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div
            className="grid flex-1 min-w-0"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(7, auto)`,
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
                      if (cell.inFuture || !isDesktop) return;
                      setHoverCell(cell);
                      const rect = (
                        e.currentTarget.closest("section") as HTMLElement
                      ).getBoundingClientRect();
                      const cellRect = e.currentTarget.getBoundingClientRect();
                      setHoverPos({
                        x: cellRect.left - rect.left + cellRect.width / 2,
                        y: cellRect.top - rect.top,
                      });
                    }}
                    onMouseLeave={() => {
                      if (!isDesktop) return;
                      setHoverCell(null);
                      setHoverPos(null);
                    }}
                    onClick={() => {
                      if (cell.inFuture) return;
                      setSelectedDate((d) => (d === key ? null : key));
                    }}
                    style={
                      isSelected
                        ? {
                            aspectRatio: "1 / 1",
                            outline: "2px solid var(--foreground)",
                            outlineOffset: "0px",
                            zIndex: 1,
                            position: "relative",
                          }
                        : inStreak
                          ? {
                              aspectRatio: "1 / 1",
                              outline: "2px solid var(--foreground)",
                              outlineOffset: "-2px",
                            }
                          : { aspectRatio: "1 / 1" }
                    }
                    className={
                      cell.inFuture
                        ? "w-full bg-transparent border border-foreground/10 cursor-default"
                        : `w-full heatmap-${s} border border-foreground/25 cursor-pointer`
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
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 mt-3">
          <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground mr-1">
            Less
          </span>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              className={`heatmap-${n} border border-foreground/25`}
              style={{ width: `${LEGEND_CELL}px`, height: `${LEGEND_CELL}px` }}
              aria-hidden
            />
          ))}
          <span className="text-[10px] sm:text-[11px] font-mono text-muted-foreground ml-1">
            More
          </span>
        </div>
      </div>

      {/* Touch-tier day-detail card — stacked rows, never compressed */}
      {!isDesktop && selectedCell && (
        <div className="mt-4 border-2 border-foreground bg-background p-4 shadow-[4px_4px_0_0_var(--foreground)]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-foreground">
            <div className="font-mono font-bold text-sm whitespace-nowrap">
              {formatDate(selectedCell.date)}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground shrink-0 ml-3"
              aria-label="Close detail"
            >
              Close ✕
            </button>
          </div>
          <dl className="flex flex-col gap-1.5">
            {(["doors", "convos", "leads", "appts", "wins"] as Metric[]).map((m) => (
              <div
                key={m}
                className="flex items-baseline justify-between gap-4"
              >
                <dt className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  {METRIC_LABELS[m]}
                </dt>
                <dd className="text-base font-mono font-bold tabular-nums leading-none">
                  {selectedCell[m]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Desktop hover tooltip — multi-column, edge-clamped */}
      {isDesktop && hoverCell && hoverPos && (
        <DesktopTooltip cell={hoverCell} pos={hoverPos} />
      )}
    </section>
  );
}

/* Desktop tooltip — 5-column grid, never compresses below 280px wide. */
function DesktopTooltip({
  cell,
  pos,
}: {
  cell: Cell;
  pos: { x: number; y: number };
}) {
  const TOOLTIP_W = 300;
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(pos.x - TOOLTIP_W / 2);

  useEffect(() => {
    const section = ref.current?.parentElement as HTMLElement | null;
    const sectionWidth = section?.clientWidth ?? Infinity;
    const PAD = 8;
    let nextLeft = pos.x - TOOLTIP_W / 2;
    if (nextLeft < PAD) nextLeft = PAD;
    if (nextLeft + TOOLTIP_W > sectionWidth - PAD) {
      nextLeft = sectionWidth - PAD - TOOLTIP_W;
    }
    setLeft(nextLeft);
  }, [pos.x]);

  return (
    <div
      ref={ref}
      className="absolute z-20 pointer-events-none border-2 border-foreground bg-background shadow-[4px_4px_0_0_var(--foreground)]"
      style={{
        left: `${left}px`,
        top: `${pos.y}px`,
        width: `${TOOLTIP_W}px`,
        transform: "translateY(calc(-100% - 8px))",
      }}
    >
      <div className="px-3 py-2 border-b-2 border-foreground font-mono font-bold text-xs whitespace-nowrap">
        {formatDate(cell.date)}
      </div>
      <div className="grid grid-cols-5 px-1 py-3">
        {(["doors", "convos", "leads", "appts", "wins"] as Metric[]).map(
          (m, i) => (
            <div
              key={m}
              className={`flex flex-col items-center justify-center px-1 ${
                i > 0 ? "border-l border-foreground/20" : ""
              }`}
            >
              <div className="text-base font-mono font-bold tabular-nums leading-none">
                {cell[m]}
              </div>
              <div className="mt-1.5 text-[9px] font-mono font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {METRIC_LABELS[m]}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
