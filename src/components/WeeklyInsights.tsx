import React, { memo, useMemo } from "react";

interface DayStats {
  doors: number;
  conversations: number;
  leads: number;
  appointments: number;
  wins: number;
}

interface WeeklyInsightsProps {
  data: Record<string, Partial<DayStats>>;
  weeklyTarget?: number;
}

const ZERO: DayStats = {
  doors: 0,
  conversations: 0,
  leads: 0,
  appointments: 0,
  wins: 0,
};

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayName(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const local = new Date(y, (m ?? 1) - 1, d ?? 1);
  return local.toLocaleDateString("en-US", { weekday: "short" });
}

type DayEntry = { date: string; stats: DayStats };

function WeeklyInsightsImpl({
  data,
  weeklyTarget = 150,
}: WeeklyInsightsProps) {
  const insights = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay(); // 0 = Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dow);

    const daysIncluded = dow + 1;
    const weekDays: DayEntry[] = [];
    for (let i = 0; i < daysIncluded; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const key = isoDate(d);
      const raw = data[key] ?? {};
      weekDays.push({
        date: key,
        stats: { ...ZERO, ...raw },
      });
    }

    const totalDays = weekDays.length;
    if (totalDays === 0) {
      return null;
    }

    let total = 0;
    let totalConvos = 0;
    let totalLeads = 0;
    let totalWins = 0;
    let activeDays = 0;
    let best: DayEntry | null = null;
    let worst: DayEntry | null = null;

    for (const entry of weekDays) {
      const s = entry.stats;
      total += s.doors;
      totalConvos += s.conversations;
      totalLeads += s.leads;
      totalWins += s.wins;
      if (s.doors > 0) activeDays++;
      if (!best || s.doors > best.stats.doors) best = entry;
      if (!worst || s.doors < worst.stats.doors) worst = entry;
    }

    const avg = totalDays > 0 ? Math.round(total / totalDays) : 0;
    const convToLeadPct =
      totalConvos > 0 ? Math.round((totalLeads / totalConvos) * 100) : 0;
    const leadToWinPct =
      totalLeads > 0 ? Math.round((totalWins / totalLeads) * 100) : 0;

    return {
      total,
      avg,
      best,
      worst,
      activeDays,
      totalDays,
      totalConvos,
      totalLeads,
      totalWins,
      convToLeadPct,
      leadToWinPct,
    };
  }, [data]);

  if (!insights) return null;

  const done = insights.total >= weeklyTarget;

  const tileBase = done ? "bg-background/15" : "bg-muted";
  const convTileBase = done ? "bg-background/10" : "bg-muted/60";
  const trackClass = done ? "bg-background/20" : "bg-muted-foreground/15";
  const fillClass = done ? "bg-background" : "bg-primary/70";

  return (
    <div
      className={`border-2 border-foreground px-4 py-4 sm:px-5 sm:py-5 transition-colors duration-300 ${
        done ? "bg-foreground text-background" : "bg-card"
      }`}
    >
          {/* Row 1 — Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold tracking-tight uppercase">
              This Week
            </h2>
            <span
              className={`text-xs font-mono ${
                done
                  ? "opacity-80 font-bold uppercase tracking-wider"
                  : "text-muted-foreground"
              }`}
            >
              {done
                ? "✓ Goal Hit"
                : `${insights.activeDays}/${insights.totalDays} active days`}
            </span>
          </div>

          {/* Row 2 — Stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                icon: "🚪",
                label: "Total Doors",
                value: insights.total.toLocaleString(),
              },
              {
                icon: "📊",
                label: "Daily Avg",
                value: String(insights.avg),
              },
              {
                icon: "⬆",
                label: "Best Day",
                value: insights.best
                  ? `${dayName(insights.best.date)} · ${insights.best.stats.doors}`
                  : "—",
              },
              {
                icon: "⬇",
                label: "Weakest Day",
                value: insights.worst
                  ? `${dayName(insights.worst.date)} · ${insights.worst.stats.doors}`
                  : "—",
              },
            ].map((t) => (
              <div key={t.label} className={`px-3 py-3 ${tileBase}`}>
                <div
                  className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${
                    done ? "opacity-70" : "text-muted-foreground"
                  }`}
                >
                  <span aria-hidden="true">{t.icon}</span>
                  <span>{t.label}</span>
                </div>
                <div className="mt-1 text-lg sm:text-xl font-mono tabular-nums font-bold">
                  {t.value}
                </div>
              </div>
            ))}
          </div>

          {/* Row 3 — Conversion tiles */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              {
                icon: "🗣",
                label: "Convos → Leads",
                pct: insights.convToLeadPct,
                numerator: insights.totalLeads,
                denominator: insights.totalConvos,
              },
              {
                icon: "🎯",
                label: "Leads → Wins",
                pct: insights.leadToWinPct,
                numerator: insights.totalWins,
                denominator: insights.totalLeads,
              },
            ].map((c) => (
              <div key={c.label} className={`px-3 py-2.5 ${convTileBase}`}>
                <div
                  className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${
                    done ? "opacity-70" : "text-muted-foreground"
                  }`}
                >
                  <span aria-hidden="true">{c.icon}</span>
                  <span>{c.label}</span>
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-mono tabular-nums font-bold">
                    {c.pct}%
                  </span>
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      done ? "opacity-60" : "text-muted-foreground"
                    }`}
                  >
                    {c.numerator}/{c.denominator}
                  </span>
                </div>
                <div
                  className={`w-full h-1 rounded-full overflow-hidden mt-1.5 ${trackClass}`}
                  role="progressbar"
                  aria-valuenow={c.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full rounded-full transition-all ${fillClass}`}
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export const WeeklyInsights = memo(WeeklyInsightsImpl);
export default WeeklyInsights;
