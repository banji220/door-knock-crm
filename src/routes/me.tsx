import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader, DesktopPageHeader } from "@/components/AppShell";
import { Show } from "@/components/responsive";
import { ContributionHeatmap } from "@/components/ContributionHeatmap";
import { StreakPanel } from "@/components/StreakPanel";
import { MomentumMeter } from "@/components/MomentumMeter";
import { BadgesPanel } from "@/components/BadgesPanel";
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

const STATS = {
  knocks: 24,
  quotes: 6,
  closes: 2,
  revenue: 1240,
};

type WeeklyGoalData = Record<
  string,
  {
    doors: number;
    conversations: number;
    leads: number;
    appointments: number;
    wins: number;
  }
>;

function MePage() {
  const [weeklyTarget, setWeeklyTarget] = useLocalStorage<number>(
    "giraffe.weeklyTarget",
    150,
  );
  const [range, setRange] = useDateRange("Today");

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
      doors: 0, convos: 0, leads: 0, appts: 0, wins: 0,
    };
    map[todayKey] = { ...base, doors: STATS.knocks };
    return map;
  }, []);

  const streaks = useMemo(() => computeStreaks(buildYearOfActivity()), []);
  const closeRate =
    STATS.quotes > 0 ? Math.round((STATS.closes / STATS.quotes) * 100) : 0;
  const weeklyData = statsMap as unknown as WeeklyGoalData;

  /* Reusable KPI cluster — same content, different grid per tier. */
  const kpis = [
    { value: STATS.knocks, label: "Doors", accent: false },
    { value: STATS.quotes, label: "Quotes", accent: false },
    { value: STATS.closes, label: "Closes", accent: false },
    { value: `${closeRate}%`, label: "Close Rate", accent: true },
    { value: `$${STATS.revenue.toLocaleString()}`, label: "Revenue", accent: true },
  ] as const;

  const renderActionStack = () => (
    <>
      <DailyMissionCard
        current={14}
        target={30}
        suggestion="Hit 6 more before lunch — momentum stays alive."
      />
      <WeeklyGoal
        data={weeklyData}
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
    </>
  );

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
          DESKTOP (≥1025) — sidebar + 2-col dashboard.
          Left: KPI row + heatmap (hero). Right: action stack.
          ============================================================ */}
      <Show on="desktop">
        <DesktopPageHeader
          eyebrow="Performance"
          title="Holy Giraffe"
          action={<DateRangeToggle value={range} onChange={setRange} />}
        />

        <div className="grid grid-cols-[1fr_380px] gap-6">
          <div className="space-y-4 min-w-0">
            <div className="grid grid-cols-5 gap-4">
              {kpis.map((k) => (
                <KpiTile key={k.label} value={k.value} label={k.label} accent={k.accent} />
              ))}
            </div>
            <ContributionHeatmap />
          </div>
          <div className="space-y-4">{renderActionStack()}</div>
        </div>

        <div className="text-center pt-8 pb-4">
          <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
            Sign out
          </button>
        </div>
      </Show>

      {/* ============================================================
          TABLET (641-1024) — bottom-nav + 2-col hybrid.
          KPIs across the top, then heatmap full-width, then action
          stack in 2 columns to use the wider canvas.
          ============================================================ */}
      <Show on="tablet">
        <div className="space-y-5">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Today
            </div>
            <div className="grid grid-cols-5 gap-2">
              {kpis.map((k) => (
                <KpiTile key={k.label} value={k.value} label={k.label} accent={k.accent} />
              ))}
            </div>
          </div>

          <ContributionHeatmap />

          {/* 2-column action grid — denser than mobile, lighter than desktop */}
          <div className="grid grid-cols-2 gap-4">
            <DailyMissionCard
              current={14}
              target={30}
              suggestion="Hit 6 more before lunch — momentum stays alive."
            />
            <WeeklyGoal
              data={weeklyData}
              weeklyTarget={weeklyTarget}
              onTargetChange={setWeeklyTarget}
            />
            <StreakPanel
              currentStreak={streaks.current}
              longestStreak={streaks.best}
            />
            <MomentumMeter />
            <div className="col-span-2">
              <QuickLogCard initialCount={STATS.knocks} />
            </div>
            <div className="col-span-2">
              <BadgesPanel />
            </div>
          </div>

          <div className="text-center pt-2 pb-4">
            <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
              Sign out
            </button>
          </div>
        </div>
      </Show>

      {/* ============================================================
          MOBILE (≤640) — single stacked column, tight rhythm.
          ============================================================ */}
      <Show on="mobile">
        <div className="space-y-5">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Today
            </div>
            <div className="grid grid-cols-2 gap-3">
              {kpis.slice(0, 4).map((k) => (
                <div
                  key={k.label}
                  className="border-2 border-foreground bg-card p-4 text-center"
                >
                  <div
                    className={`text-3xl font-bold font-mono leading-none tabular-nums ${
                      k.accent ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {k.value}
                  </div>
                  <div className="mt-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    {k.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ContributionHeatmap />

          {renderActionStack()}

          <div className="text-center pt-2 pb-4">
            <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
              Sign out
            </button>
          </div>
        </div>
      </Show>
    </AppShell>
  );
}
