import { useEffect, useMemo, useRef, useState } from "react";
import {
  type DayStats,
  addDays,
  getDay,
  isSameDate,
  startOfWeek,
} from "@/lib/day-stats";

type Props = {
  stats: Record<string, DayStats>;
  target: number;
  onTargetChange: (n: number) => void;
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;

export function WeeklyGoal({ stats, target, onTargetChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(target));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(String(target));
  }, [target]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= 1 && n <= 9999) onTargetChange(n);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(String(target));
    setEditing(false);
  };

  /* ---- Build the 7-day window: Monday → Sunday ---- */
  const week = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = startOfWeek(today);

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const isToday = isSameDate(date, today);
      const isFuture = date.getTime() > today.getTime();
      return {
        date,
        dow: i,
        doors: getDay(stats, date).doors,
        isToday,
        isFuture,
      };
    });
  }, [stats]);

  const weekTotal = week.reduce((s, d) => s + d.doors, 0);
  const maxDay = Math.max(1, ...week.map((d) => d.doors));
  const goalHit = weekTotal >= target;
  const pct = target > 0 ? Math.min(100, (weekTotal / target) * 100) : 0;

  /* Days remaining including today (Mon..Sun → 7..1). */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIdx = (today.getDay() + 6) % 7; // Mon=0..Sun=6
  const daysRemaining = 7 - todayIdx;
  const weekEnded = daysRemaining <= 0;
  const remainingTotal = Math.max(0, target - weekTotal);
  const dailyAvgNeeded =
    daysRemaining > 0 ? Math.max(0, Math.ceil(remainingTotal / daysRemaining)) : 0;

  let footer: string;
  if (goalHit) {
    footer = "✓ WEEKLY GOAL CRUSHED";
  } else if (weekEnded) {
    footer = `GOAL MISSED — ${target - weekTotal} SHORT`;
  } else {
    footer = `NEED ${dailyAvgNeeded}/DAY TO HIT GOAL`;
  }

  return (
    <section className="border-2 border-foreground bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Weekly Goal
        </span>

        {editing ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={9999}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") cancel();
              }}
              className="w-20 border-2 border-foreground bg-background font-mono font-bold text-xs px-2 py-1 focus:outline-none focus:bg-[var(--accent)] tabular-nums"
            />
            <button
              type="button"
              onClick={commit}
              className="press-brutal text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-foreground text-background hover:opacity-80"
            >
              Save
            </button>
            <button
              type="button"
              onClick={cancel}
              className="press-brutal text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-muted text-muted-foreground hover:opacity-80"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="press-brutal text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 bg-foreground text-background hover:opacity-80"
          >
            Edit
          </button>
        )}
      </div>

      {/* Big stat */}
      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span
          className={`text-4xl font-bold tabular-nums tracking-tight leading-none ${
            goalHit ? "text-primary" : "text-foreground"
          }`}
        >
          {weekTotal}
        </span>
        <span className="text-lg font-mono text-muted-foreground">
          / {target} this week
        </span>
      </div>

      {/* Progress */}
      <div
        className="mt-4 h-1.5 w-full bg-muted border-2 border-foreground overflow-hidden"
        role="progressbar"
        aria-valuenow={weekTotal}
        aria-valuemin={0}
        aria-valuemax={target}
      >
        <div
          className={`h-full transition-all duration-500 ${
            goalHit ? "bg-primary" : "bg-foreground"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 7-day mini chart */}
      <div className="mt-4 grid grid-cols-7 gap-1">
        {week.map((d, i) => {
          const ratio = d.doors / maxDay;
          const heightPx = d.doors > 0 ? Math.max(2, Math.round(ratio * 64)) : 2;
          const barClass = d.isFuture
            ? "bg-muted opacity-30"
            : d.isToday
              ? "bg-primary"
              : d.doors > 0
                ? "bg-foreground"
                : "bg-muted";
          return (
            <div key={i} className="flex flex-col items-center">
              <div className="h-16 w-full flex items-end">
                <div
                  className={`w-full transition-all duration-500 ${barClass}`}
                  style={{ height: `${heightPx}px` }}
                  aria-label={`${d.doors} doors`}
                />
              </div>
              <span
                className={`mt-1 text-[9px] font-mono uppercase tabular-nums ${
                  d.isToday
                    ? "text-primary font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {DAY_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="mt-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {footer}
      </p>
    </section>
  );
}
