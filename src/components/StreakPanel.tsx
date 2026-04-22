import { useEffect, useMemo, useState } from "react";
import {
  buildYearOfActivity,
  computeStreaks,
} from "@/lib/activity-data";

/* =========================================================================
   StreakPanel — current vs best streak, with status badge + progress bar
   ========================================================================= */

function statusFor(current: number) {
  if (current === 0) return { label: "Cold", emoji: "❄️", tone: "muted" as const };
  if (current <= 2) return { label: "Active", emoji: "✓", tone: "normal" as const };
  if (current <= 4) return { label: "Warming Up", emoji: "⚡", tone: "normal" as const };
  if (current <= 9) return { label: "Hot Streak", emoji: "🔥", tone: "hot" as const };
  return { label: "On Fire", emoji: "🔥", tone: "hot" as const };
}

function fillClass(tone: "muted" | "normal" | "hot") {
  if (tone === "hot") return "heatmap-5";
  if (tone === "normal") return "heatmap-3";
  return "heatmap-1";
}

export function StreakPanel() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { current, best } = useMemo(() => {
    const days = buildYearOfActivity();
    return computeStreaks(days);
  }, []);

  const status = statusFor(current);
  const pct = best > 0 ? Math.min(1, current / best) : 0;
  const pctLabel = Math.round(pct * 100);
  const isHot = status.tone === "hot";

  const badgeClass =
    status.tone === "hot"
      ? "bg-foreground text-background border-2 border-foreground"
      : status.tone === "muted"
        ? "bg-card text-muted-foreground border-2 border-muted-foreground/40"
        : "bg-card text-foreground border-2 border-foreground";

  if (!mounted) {
    return (
      <section className="border-2 border-foreground bg-card px-4 py-4 mb-6">
        <div className="h-[180px]" aria-hidden />
      </section>
    );
  }

  return (
    <section className="border-2 border-foreground bg-card px-4 py-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold uppercase tracking-tight">Streak</h2>
        <span
          className={`px-2 py-0.5 font-mono font-bold text-[10px] uppercase tracking-wider ${badgeClass}`}
        >
          <span aria-hidden className="mr-1">{status.emoji}</span>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className={`border-2 border-foreground p-3 ${
            isHot ? "bg-foreground text-background" : "bg-card"
          }`}
        >
          <div className="text-3xl font-bold font-mono tabular-nums leading-none">
            {current}
          </div>
          <div
            className={`mt-2 text-[10px] font-mono font-bold uppercase tracking-wider ${
              isHot ? "text-background/70" : "text-muted-foreground"
            }`}
          >
            Current days
          </div>
        </div>
        <div className="border-2 border-foreground bg-muted p-3">
          <div className="text-3xl font-bold font-mono tabular-nums leading-none">
            {best}
          </div>
          <div className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Best days
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Progress to Best
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider tabular-nums">
            {pctLabel}%
          </span>
        </div>
        <div className="relative w-full h-2 border-2 border-foreground bg-muted overflow-hidden">
          <div
            className={`h-full ${fillClass(status.tone)} transition-[width] duration-300`}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
