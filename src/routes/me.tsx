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

  /* ===== Desktop layout (≥1024px) =====
     Hero strip (profile + today stats) → wide heatmap → 3-col modules.
     Mobile/tablet keeps the existing single-column stack. */
  return (
    <AppShell
      wide
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
      {/* ============================================================
          DESKTOP — wide dashboard (lg+)
          ============================================================ */}
      <div className="hidden lg:block max-w-[1400px] mx-auto w-full">
        {/* Hero strip — profile + today's stats */}
        <section className="grid grid-cols-12 gap-4 mb-6">
          {/* Profile */}
          <div className="col-span-4 border-2 border-foreground bg-card p-6 flex items-center gap-5">
            <div
              className="size-24 shrink-0 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center font-mono font-bold text-4xl"
              aria-label="Avatar"
            >
              HG
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold font-display tracking-tight leading-none">
                Holy Giraffe
              </div>
              <div className="mt-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Window Cleaning Pro
              </div>
              <div className="mt-3 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Streak{" "}
                <span className="font-bold text-foreground tabular-nums">
                  {streaks.current}d
                </span>{" "}
                · Best{" "}
                <span className="font-bold text-foreground tabular-nums">
                  {streaks.best}d
                </span>
              </div>
            </div>
          </div>

          {/* Today's Stats */}
          <div className="col-span-8">
            <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Today
            </div>
            <div className="grid grid-cols-4 gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="border-2 border-foreground bg-card p-5 text-center"
                >
                  <div
                    className={`text-4xl font-bold font-mono leading-none tabular-nums ${
                      s.accent ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {s.value}
                  </div>
                  <div className="mt-2 text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Wide heatmap — full focal point */}
        <section className="mb-6">
          <ContributionHeatmap />
        </section>

        {/* Weekly row — goal + insights side by side */}
        <section className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-5">
            <WeeklyGoal
              data={statsMap as unknown as Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>}
              weeklyTarget={weeklyTarget}
              onTargetChange={setWeeklyTarget}
            />
          </div>
          <div className="col-span-7">
            <WeeklyInsights
              data={statsMap as unknown as Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>}
              weeklyTarget={weeklyTarget}
            />
          </div>
        </section>

        {/* Modules row — streak / momentum / calendar */}
        <section className="grid grid-cols-12 gap-4 mb-6">
          <div className="col-span-4">
            <StreakPanel
              currentStreak={streaks.current}
              longestStreak={streaks.best}
            />
          </div>
          <div className="col-span-5">
            <MomentumMeter />
          </div>
          <div className="col-span-3">
            <GoogleCalendarCard />
          </div>
        </section>

        {/* Badges — full width */}
        <section className="mb-6">
          <BadgesPanel />
        </section>

        <div className="text-center pt-2 pb-6">
          <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
            Sign out
          </button>
        </div>
      </div>

      {/* ============================================================
          MOBILE / TABLET — stacked layout (<lg)
          Everything sits in normal document flow. No absolute
          positioning, no overlapping elements — clean top-to-bottom
          stack with explicit vertical rhythm.
          ============================================================ */}
      <div className="lg:hidden">
        {/* Profile header — centered, vertically stacked */}
        <section className="mb-6 flex flex-col items-center text-center">
          <div
            className="size-20 shrink-0 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center font-mono font-bold text-3xl"
            aria-label="Avatar"
          >
            HG
          </div>
          <div className="mt-3 text-xl font-bold font-display tracking-tight leading-none">
            Holy Giraffe
          </div>
          <div className="mt-2 text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
            Window Cleaning Pro
          </div>
        </section>

        {/* Today's stats — 2x2 grid */}
        <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Today
        </div>
        <div className="grid grid-cols-2 gap-3">
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
              <div className="mt-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Streak summary — single row beneath the stats grid */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
          <span>
            Streak{" "}
            <span className="font-bold text-foreground tabular-nums">
              {streaks.current}d
            </span>
          </span>
          <span aria-hidden>·</span>
          <span>
            Best{" "}
            <span className="font-bold text-foreground tabular-nums">
              {streaks.best}d
            </span>
          </span>
        </div>

        {/* Sections below — each separated by mt-6 */}
        <div className="mt-6">
          <ContributionHeatmap />
        </div>

        <div className="mt-6 flex flex-col gap-4">
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

        <div className="mt-6">
          <StreakPanel currentStreak={streaks.current} longestStreak={streaks.best} />
        </div>

        <div className="mt-6">
          <MomentumMeter />
        </div>

        <div className="mt-6">
          <BadgesPanel />
        </div>

        <div className="mt-6">
          <GoogleCalendarCard />
        </div>

        <div className="text-center pt-6 pb-4">
          <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
            Sign out
          </button>
        </div>
      </div>
    </AppShell>
  );
}
