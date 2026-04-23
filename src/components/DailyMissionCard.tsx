import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { HeroCard } from "./ui-brutal";

/* =========================================================================
   DailyMissionCard — the screen's HERO. Single anchor of focus.

   Big number, strong progress bar, status badge top-right, motivational
   subline. Designed to be visibly larger / heavier than every other block
   on the page. Do not duplicate this treatment elsewhere.
   ========================================================================= */

function fillForPct(pct: number): string {
  if (pct >= 100) return "var(--heatmap-5)";
  if (pct >= 80) return "var(--heatmap-4)";
  if (pct >= 60) return "var(--heatmap-3)";
  if (pct >= 30) return "var(--heatmap-2)";
  if (pct > 0) return "var(--heatmap-1)";
  return "var(--heatmap-0)";
}

function statusFor(pct: number): { label: string; tone: "active" | "warm" | "complete" | "idle" } {
  if (pct >= 100) return { label: "Complete", tone: "complete" };
  if (pct >= 50) return { label: "On track", tone: "active" };
  if (pct > 0) return { label: "In progress", tone: "warm" };
  return { label: "Not started", tone: "idle" };
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

  const badgeClass = cn(
    "shrink-0 px-2.5 py-1 font-mono font-bold text-[10px] uppercase tracking-[0.15em]",
    status.tone === "complete" && "bg-foreground text-background",
    status.tone === "active" && "border-2 border-foreground bg-card text-foreground",
    status.tone === "warm" && "border-2 border-foreground bg-[var(--amber)] text-foreground",
    status.tone === "idle" && "border-hairline bg-transparent text-muted-foreground",
  );

  return (
    <HeroCard className="pl-7 lg:pl-8">
      <div className="flex items-start justify-between gap-3 mb-4 lg:mb-5">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-muted-foreground">
            Daily Mission
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl lg:text-6xl font-bold font-mono tabular-nums leading-none">
              {current}
            </span>
            <span className="text-2xl lg:text-3xl font-mono text-muted-foreground tabular-nums leading-none">
              / {target}
            </span>
          </div>
          <div className="mt-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            doors today
          </div>
        </div>
        <span className={badgeClass}>{status.label}</span>
      </div>

      {/* Progress bar — chunky, dominant */}
      <div
        className="relative h-3 w-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {pct}% of goal
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground tabular-nums">
          {Math.max(0, target - current)} to go
        </span>
      </div>

      {suggestion && (
        <p className="mt-4 text-sm font-mono text-foreground/80 leading-relaxed">
          {suggestion}
        </p>
      )}
    </HeroCard>
  );
}
