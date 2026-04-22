import { memo } from "react";

interface StreakPanelProps {
  currentStreak: number;
  longestStreak: number;
}

type Tone = "hot" | "warm" | "cold";

function getStreakStatus(current: number): {
  label: string;
  emoji: string;
  tone: Tone;
} {
  if (current >= 10) return { label: "On fire", emoji: "🔥", tone: "hot" };
  if (current >= 5) return { label: "Hot streak", emoji: "🔥", tone: "hot" };
  if (current >= 3) return { label: "Warming up", emoji: "⚡", tone: "warm" };
  if (current >= 1) return { label: "Active", emoji: "✓", tone: "warm" };
  return { label: "Cold", emoji: "❄️", tone: "cold" };
}

function fillVar(tone: Tone): string {
  if (tone === "hot") return "var(--heatmap-5)";
  if (tone === "warm") return "var(--heatmap-3)";
  return "var(--heatmap-1)";
}

function StreakPanelImpl({ currentStreak, longestStreak }: StreakPanelProps) {
  const status = getStreakStatus(currentStreak);
  const pct =
    longestStreak > 0
      ? Math.min(Math.round((currentStreak / longestStreak) * 100), 100)
      : 0;

  const pillBase =
    "px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border-2";
  const pillTone =
    status.tone === "hot"
      ? "border-foreground bg-foreground text-background"
      : status.tone === "warm"
        ? "border-foreground bg-transparent text-foreground"
        : "border-muted-foreground bg-transparent text-muted-foreground";

  const isHot = status.tone === "hot";

  return (
    <div className="border-2 border-foreground bg-card px-4 py-4 sm:px-5 sm:py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">
          Streak
        </h2>
        <span className={`${pillBase} ${pillTone}`}>
          <span aria-hidden="true" className="mr-1">
            {status.emoji}
          </span>
          {status.label}
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-2">
        {/* Current */}
        <div
          className={`px-4 py-4 ${
            isHot ? "bg-foreground text-background" : "bg-muted"
          }`}
        >
          <div
            className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
              isHot ? "opacity-70" : "text-muted-foreground"
            }`}
          >
            Current
          </div>
          <div className="mt-1 text-3xl sm:text-4xl font-mono font-bold tabular-nums leading-none">
            {currentStreak}
          </div>
          <div
            className={`mt-1 text-[10px] font-mono font-bold uppercase tracking-wider ${
              isHot ? "opacity-70" : "text-muted-foreground"
            }`}
          >
            days
          </div>
        </div>

        {/* Best */}
        <div className="bg-muted px-4 py-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Best
          </div>
          <div className="mt-1 text-3xl sm:text-4xl font-mono font-bold tabular-nums leading-none">
            {longestStreak}
          </div>
          <div className="mt-1 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            days
          </div>
        </div>
      </div>

      {/* Progress to best */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">
          <span>Progress to best</span>
          <span className="tabular-nums font-bold">{pct}%</span>
        </div>
        <div
          className="relative w-full h-2 bg-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%`, backgroundColor: fillVar(status.tone) }}
          />
        </div>
      </div>
    </div>
  );
}

export const StreakPanel = memo(StreakPanelImpl);
export default StreakPanel;
