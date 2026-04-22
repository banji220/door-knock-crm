import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type DayActivity = {
  doors: number;
  conversations: number;
  leads: number;
  appointments: number;
  wins: number;
};

interface WeeklyGoalProps {
  data: Record<string, Partial<DayActivity>>;
  weeklyTarget?: number;
  onTargetChange?: (target: number) => void;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function WeeklyGoalImpl({
  data,
  weeklyTarget = 150,
  onTargetChange,
}: WeeklyGoalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(weeklyTarget));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    setDraft(String(weeklyTarget));
    setEditing(true);
  }, [weeklyTarget]);

  const commitEdit = useCallback(() => {
    const parsed = parseInt(draft, 10);
    const next = isNaN(parsed)
      ? weeklyTarget
      : Math.min(9999, Math.max(1, parsed));
    onTargetChange?.(next);
    setEditing(false);
  }, [draft, weeklyTarget, onTargetChange]);

  const { total, percent, daysLeft, paceNeeded } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay(); // 0 = Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dow);

    const daysIncluded = dow + 1; // Sun→today inclusive
    let sum = 0;
    for (let i = 0; i < daysIncluded; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      sum += data[isoDate(d)]?.doors ?? 0;
    }

    const pct = Math.min(
      Math.round((sum / Math.max(1, weeklyTarget)) * 100),
      100,
    );
    const left = 7 - daysIncluded;
    const pace =
      left > 0 ? Math.max(Math.ceil((weeklyTarget - sum) / left), 0) : 0;

    return { total: sum, percent: pct, daysLeft: left, paceNeeded: pace };
  }, [data, weeklyTarget]);

  const done = percent >= 100;

  return (
    <div
      className={`border-2 border-foreground px-4 py-4 sm:px-5 sm:py-5 transition-colors duration-300 ${
        done ? "bg-foreground text-background" : "bg-card"
      }`}
    >
          {/* Row 1 — Header */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">
              Weekly Goal
            </h2>
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider ${
                done ? "opacity-80" : "text-muted-foreground"
              }`}
            >
              {done ? "✓ Complete" : `${daysLeft}d left`}
            </span>
          </div>

          {/* Row 2 — Big number */}
          <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
            <span className="text-3xl sm:text-5xl font-bold font-mono tabular-nums">
              {total}
            </span>
            <span
              className={`text-sm font-mono flex items-baseline gap-1 ${
                done ? "opacity-60" : "text-muted-foreground"
              }`}
            >
              <span>/</span>
              {editing ? (
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={9999}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="w-16 bg-transparent border-b-2 border-current text-sm font-mono font-bold tabular-nums outline-none text-inherit px-0 py-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={startEdit}
                  className={`font-bold border-b border-dashed border-current cursor-pointer hover:opacity-70 transition-opacity ${
                    done ? "text-background" : "text-foreground"
                  }`}
                >
                  {weeklyTarget}
                </button>
              )}
              <span>doors</span>
            </span>
            <span
              className={`ml-auto text-2xl font-bold font-mono tabular-nums ${
                done ? "opacity-80" : ""
              }`}
            >
              {percent}%
            </span>
          </div>

          {/* Row 3 — Progress bar */}
          <div
            className={`relative h-3 w-full overflow-hidden ${
              done ? "bg-background/20" : "bg-muted"
            }`}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full transition-[width] duration-300 ease-out"
              style={{
                width: `${percent}%`,
                backgroundColor: done
                  ? "var(--background)"
                  : percent > 60
                    ? "var(--heatmap-4)"
                    : percent > 30
                      ? "var(--heatmap-3)"
                      : "var(--heatmap-2)",
              }}
            />
          </div>

          {/* Row 4 — Footer */}
          <p
            className={`text-xs font-mono mt-2 ${
              done ? "opacity-60" : "text-muted-foreground"
            }`}
          >
            {done
              ? "Goal reached. Keep stacking."
              : daysLeft > 0
                ? `Need ${paceNeeded}/day to hit target`
                : null}
          </p>
        </div>
      </div>
    </section>
  );
}

export const WeeklyGoal = memo(WeeklyGoalImpl);
export default WeeklyGoal;
