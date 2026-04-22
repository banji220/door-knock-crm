import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ContributionHeatmap } from "@/components/ContributionHeatmap";
import { StreakPanel } from "@/components/StreakPanel";
import { MomentumMeter } from "@/components/MomentumMeter";
import { BadgesPanel } from "@/components/BadgesPanel";
import { DailyMission } from "@/components/DailyMission";
import { WeeklyGoal } from "@/components/WeeklyGoal";
import { WeeklyInsights } from "@/components/WeeklyInsights";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { buildYearOfActivity } from "@/lib/activity-data";
import { type DayStats, isoDate } from "@/lib/day-stats";

export const Route = createFileRoute("/me")({
  component: MePage,
});

/* ---------- Mock today stats ---------- */
const STATS = {
  knocks: 24,
  quotes: 6,
  closes: 2,
};

function MePage() {
  /* Quick log — local count seeded from mock knocks */
  const [logged, setLogged] = useState(STATS.knocks);
  const [flashed, setFlashed] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  /* Persisted targets */
  const [dailyTarget, setDailyTarget] = useLocalStorage<number>(
    "giraffe.dailyTarget",
    30,
  );
  const [weeklyTarget, setWeeklyTarget] = useLocalStorage<number>(
    "giraffe.weeklyTarget",
    150,
  );

  /* ----- Build the stats map from the same seeded year used by the heatmap.
     Override TODAY's row with the live `logged` count so the Daily Mission and
     7-day chart stay in sync with the Quick Log buttons. ----- */
  const statsMap = useMemo<Record<string, DayStats>>(() => {
    const days = buildYearOfActivity();
    const map: Record<string, DayStats> = {};
    for (const d of days) {
      map[isoDate(d.date)] = {
        doors: d.doors,
        convos: d.convos,
        leads: d.leads,
        appts: d.appts,
        wins: d.wins,
      };
    }
    const todayKey = isoDate(new Date());
    const base = map[todayKey] ?? {
      doors: 0,
      convos: 0,
      leads: 0,
      appts: 0,
      wins: 0,
    };
    map[todayKey] = { ...base, doors: logged };
    return map;
  }, [logged]);

  const closeRate =
    STATS.quotes > 0 ? Math.round((STATS.closes / STATS.quotes) * 100) : 0;

  const stats = [
    { label: "Knocks", value: STATS.knocks, accent: false },
    { label: "Quotes", value: STATS.quotes, accent: false },
    { label: "Closes", value: STATS.closes, accent: false },
    { label: "Close Rate", value: `${closeRate}%`, accent: true },
  ];

  const handleLog = (n: number) => {
    setLogged((c) => c + n);
    setFlashed(n);
    setFeedback(`Logged ${n} door${n === 1 ? "" : "s"}`);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
    window.setTimeout(() => setFlashed(null), 600);
    window.setTimeout(() => setFeedback(null), 600);
  };

  /* Hour state — kept for any future client-only logic (no SSR mismatch) */
  useEffect(() => {
    /* placeholder for future client-only effects */
  }, []);

  return (
    <AppShell
      header={
        <PageHeader
          eyebrow="Me"
          title="Holy Giraffe"
          meta={
            <span className="uppercase tracking-wider">
              Window Cleaning Pro
            </span>
          }
        />
      }
    >
      {/* ===== Profile ===== */}
      <section className="mb-6 flex items-center gap-4">
        <div
          className="size-20 shrink-0 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center font-mono font-bold text-3xl"
          aria-label="Avatar"
        >
          HG
        </div>
        <div className="min-w-0">
          <div className="text-xl font-bold font-display tracking-tight leading-none">
            Holy Giraffe
          </div>
          <div className="mt-1.5 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Window Cleaning Pro
          </div>
        </div>
      </section>

      {/* ===== Today's Stats ===== */}
      <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Today
      </div>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="border-2 border-foreground bg-card p-4 text-center"
          >
            <div
              className={`text-3xl font-bold font-mono leading-none tabular-nums ${
                s.accent ? "text-primary" : "text-foreground"
              }`}
            >
              {s.value}
            </div>
            <div className="mt-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ===== Quick Log ===== */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Quick Log
          </span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 border-2 border-foreground bg-card">
            Today: {logged}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[1, 5, 10, 25].map((n) => {
            const isFlashed = flashed === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleLog(n)}
                aria-label={`Log ${n} door${n === 1 ? "" : "s"}`}
                className={`press-brutal border-2 border-foreground h-14 flex flex-col items-center justify-center gap-0.5 transition-colors duration-100 active:translate-y-[2px] ${
                  isFlashed
                    ? "bg-foreground text-background"
                    : "bg-card text-foreground"
                }`}
              >
                <span className="text-2xl font-bold font-mono leading-none">
                  +{n}
                </span>
                <span
                  className={`text-[9px] uppercase tracking-wider ${
                    isFlashed ? "text-background/70" : "text-muted-foreground"
                  }`}
                >
                  {n === 1 ? "door" : "doors"}
                </span>
              </button>
            );
          })}
        </div>

        <div
          className={`mt-2 h-4 text-[11px] font-mono uppercase tracking-wider transition-opacity duration-200 ${
            feedback ? "opacity-100 text-foreground" : "opacity-0"
          }`}
          aria-live="polite"
        >
          {feedback ?? " "}
        </div>
      </section>

      {/* ===== Goals + insights stack ===== */}
      <div className="flex flex-col gap-4 mb-8">
        <DailyMission
          todayDoors={logged}
          target={dailyTarget}
          onTargetChange={setDailyTarget}
        />
        <WeeklyGoal
          stats={statsMap}
          target={weeklyTarget}
          onTargetChange={setWeeklyTarget}
        />
        <WeeklyInsights stats={statsMap} />
      </div>

      {/* ===== Contribution Heatmap ===== */}
      <ContributionHeatmap />

      {/* ===== Streak Panel ===== */}
      <StreakPanel />

      {/* ===== Momentum Meter ===== */}
      <MomentumMeter />

      {/* ===== Badges ===== */}
      <BadgesPanel />

      <div className="text-center pt-2 pb-4">
        <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
