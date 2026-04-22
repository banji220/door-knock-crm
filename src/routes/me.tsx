import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { ContributionHeatmap } from "@/components/ContributionHeatmap";
import { StreakPanel } from "@/components/StreakPanel";
import { MomentumMeter } from "@/components/MomentumMeter";
import { BadgesPanel } from "@/components/BadgesPanel";
import { GoogleCalendarCard } from "@/components/GoogleCalendarCard";
import { WeeklyGoal } from "@/components/WeeklyGoal";
import { WeeklyInsights } from "@/components/WeeklyInsights";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { buildYearOfActivity, computeStreaks } from "@/lib/activity-data";
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
  /* Persisted weekly target */
  const [weeklyTarget, setWeeklyTarget] = useLocalStorage<number>(
    "giraffe.weeklyTarget",
    150,
  );

  /* ----- Build the stats map from the same seeded year used by the heatmap.
     Override TODAY's row with STATS.knocks so the 7-day chart reflects the
     current day's mocked count. ----- */
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
    map[todayKey] = { ...base, doors: STATS.knocks };
    return map;
  }, []);

  const streaks = useMemo(() => computeStreaks(buildYearOfActivity()), []);

  const closeRate =
    STATS.quotes > 0 ? Math.round((STATS.closes / STATS.quotes) * 100) : 0;

  const stats = [
    { label: "Knocks", value: STATS.knocks, accent: false },
    { label: "Quotes", value: STATS.quotes, accent: false },
    { label: "Closes", value: STATS.closes, accent: false },
    { label: "Close Rate", value: `${closeRate}%`, accent: true },
  ];

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

      {/* ===== Contribution Heatmap ===== */}
      <div className="mb-4">
        <ContributionHeatmap />
      </div>

      {/* ===== This Week stack ===== */}
      <div className="flex flex-col gap-4 mb-8">
        <WeeklyGoal
          data={statsMap as unknown as Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>}
          weeklyTarget={weeklyTarget}
          onTargetChange={setWeeklyTarget}
        />
        <WeeklyInsights
          data={statsMap as unknown as Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>}
          weeklyTarget={weeklyTarget}
        />
      </div>

      {/* ===== Streak Panel ===== */}
      <StreakPanel currentStreak={streaks.current} longestStreak={streaks.best} />

      {/* ===== Momentum Meter ===== */}
      <MomentumMeter />

      {/* ===== Badges ===== */}
      <BadgesPanel />

      {/* ===== Google Calendar Connection ===== */}
      <GoogleCalendarCard />

      <div className="text-center pt-2 pb-4">
        <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
