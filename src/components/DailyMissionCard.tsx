import { useMemo } from "react";

/* Pick a heatmap CSS var based on percentage 0-100. */
function fillForPct(pct: number): string {
  if (pct >= 100) return "var(--heatmap-5)";
  if (pct >= 80) return "var(--heatmap-4)";
  if (pct >= 60) return "var(--heatmap-3)";
  if (pct >= 30) return "var(--heatmap-2)";
  if (pct > 0) return "var(--heatmap-1)";
  return "var(--heatmap-0)";
}

function statusFor(pct: number) {
  if (pct >= 100) return { emoji: "🏆", label: "Crushed it" };
  if (pct >= 50) return { emoji: "🔥", label: "On track" };
  if (pct > 0) return { emoji: "🎯", label: "In progress" };
  return { emoji: "💤", label: "Not started" };
}

export function DailyMissionCard({
  current,
  target,
  suggestion,
}: {
  current: number;
  target: number;
  suggestion?: string;
}) {
  const pct = useMemo(
    () => Math.min(100, Math.round((current / Math.max(1, target)) * 100)),
    [current, target],
  );
  const status = statusFor(pct);
  const fill = fillForPct(pct);

  return (
    <div className="border-2 border-foreground bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none" aria-hidden>
            {status.emoji}
          </span>
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em]">
            Daily Mission
          </h2>
        </div>
        <span className="px-2 py-0.5 border-2 border-foreground bg-background font-mono font-bold text-[10px] uppercase tracking-wider">
          {status.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-6 w-full bg-muted border-2 border-foreground overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%`, background: fill }}
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs tabular-nums text-foreground mix-blend-difference">
          <span className="text-background">
            {current} / {target} doors
          </span>
        </div>
      </div>

      {suggestion && (
        <p className="mt-3 text-xs font-mono text-muted-foreground">
          {suggestion}
        </p>
      )}
    </div>
  );
}
