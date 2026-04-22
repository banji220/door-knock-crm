import { useEffect, useRef, useState } from "react";

type Props = {
  todayDoors: number;
  target: number;
  onTargetChange: (n: number) => void;
};

export function DailyMission({ todayDoors, target, onTargetChange }: Props) {
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

  const complete = todayDoors >= target;
  const pct = target > 0 ? Math.min(100, (todayDoors / target) * 100) : 0;

  const status = complete
    ? `🎯 MISSION COMPLETE — ${todayDoors - target} OVER`
    : `${target - todayDoors} DOORS TO GO`;

  return (
    <section className="border-2 border-foreground bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Daily Mission
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
              className="w-16 border-2 border-foreground bg-background font-mono font-bold text-xs px-2 py-1 focus:outline-none focus:bg-[var(--accent)] tabular-nums"
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

      {/* Big number */}
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-5xl font-bold tabular-nums tracking-tight leading-none ${
            complete ? "text-primary" : "text-foreground"
          }`}
        >
          {todayDoors}
        </span>
        <span className="text-xl font-mono text-muted-foreground">
          / {target}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="mt-4 h-2 w-full bg-muted border-2 border-foreground overflow-hidden"
        role="progressbar"
        aria-valuenow={todayDoors}
        aria-valuemin={0}
        aria-valuemax={target}
      >
        <div
          className={`h-full transition-all duration-500 ${
            complete ? "bg-primary" : "bg-foreground"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Status */}
      <p className="mt-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {status}
      </p>
    </section>
  );
}
