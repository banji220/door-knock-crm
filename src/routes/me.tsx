import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, DesktopPageHeader } from "@/components/AppShell";
import { ContributionHeatmap } from "@/components/ContributionHeatmap";
import { StreakPanel } from "@/components/StreakPanel";
import { MomentumMeter } from "@/components/MomentumMeter";
import { BadgesPanel } from "@/components/BadgesPanel";
import { GoogleCalendarCard } from "@/components/GoogleCalendarCard";
import { WeeklyGoal } from "@/components/WeeklyGoal";
import { KpiTile } from "@/components/KpiTile";
import { DateRangeToggle, useDateRange } from "@/components/DateRangeToggle";
import { DailyMissionCard } from "@/components/DailyMissionCard";
import { QuickLogCard } from "@/components/QuickLogCard";
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
  revenue: 1240,
};

const ACTIVity = {
  data: undefined as unknown,
};

function MePage() {
  const [weeklyTarget, setWeeklyTarget] = useLocalStorage<number>(
    "giraffe.weeklyTarget",
    150,
  );
  const [range, setRange] = useDateRange("Today");

  /* Build the stats map from the seeded year used by the heatmap. Override
     today with mocked STATS.knocks so the day chart matches the dashboard. */
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

  const mobileStats = [
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
      {/* ============================================================
          DESKTOP — command center (≥1024px)
          ============================================================ */}
      <div className="hidden lg:block">
        {/* Top bar: PERFORMANCE + name on left, date range on right */}
        <DesktopPageHeader
          eyebrow="Performance"
          title="Holy Giraffe"
          action={<DateRangeToggle value={range} onChange={setRange} />}
        />

        {/* Two-column grid: data column (1fr) + action column (380px) */}
        <section className="grid grid-cols-[1fr_380px] gap-6">
          {/* === LEFT: KPI row + heatmap hero === */}
          <div className="min-w-0 flex flex-col gap-4">
            <div className="grid grid-cols-5 gap-4">
              <KpiTile value={STATS.knocks} label="Doors Today" />
              <KpiTile value={STATS.quotes} label="Quotes" />
              <KpiTile value={STATS.closes} label="Closes" />
              <KpiTile value={`${closeRate}%`} label="Close Rate" accent />
              <KpiTile value={`$${STATS.revenue.toLocaleString()}`} label="Revenue" accent />
            </div>
            <ContributionHeatmap />
          </div>

          {/* === RIGHT: action/stats column === */}
          <div className="flex flex-col gap-4">
            <DailyMissionCard
              current={14}
              target={30}
              suggestion="Hit 6 more before lunch — momentum stays alive."
            />
            <WeeklyGoal
              data={statsMap as unknown as Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>}
              weeklyTarget={weeklyTarget}
              onTargetChange={setWeeklyTarget}
            />
            <StreakPanel
              currentStreak={streaks.current}
              longestStreak={streaks.best}
            />
            <MomentumMeter />
            <QuickLogCard initialCount={STATS.knocks} />
            <BadgesPanel />
            <GoogleCalendarCard />
          </div>
        </section>

        <div className="text-center pt-8 pb-4">
          <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
            Sign out
          </button>
        </div>
      </div>

      {/* ============================================================
          MOBILE / TABLET — stacked layout (<lg)
          ============================================================ */}
      <div className="lg:hidden">
        {/* Profile identity block — hidden on mobile, visible on tablet (sm+) only.
            Mobile drops it entirely so the page leads with the stats grid. */}
        <section className="hidden sm:flex mb-6 flex-col items-center text-center">
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

        <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Today
        </div>
        <div className="grid grid-cols-2 gap-3">
          {mobileStats.map((s) => (
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

        <div className="mt-6">
          <ContributionHeatmap />
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <WeeklyGoal
            data={statsMap as unknown as Record<string, { doors: number; conversations: number; leads: number; appointments: number; wins: number }>}
            weeklyTarget={weeklyTarget}
            onTargetChange={setWeeklyTarget}
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
