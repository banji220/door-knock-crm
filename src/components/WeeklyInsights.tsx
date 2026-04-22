import { useMemo } from "react";
import {
  type DayStats,
  addDays,
  getDay,
  startOfWeek,
} from "@/lib/day-stats";

type Props = {
  stats: Record<string, DayStats>;
};

type Totals = {
  doors: number;
  convos: number;
  leads: number;
  appts: number;
  wins: number;
};

const ZERO: Totals = { doors: 0, convos: 0, leads: 0, appts: 0, wins: 0 };

function aggregate(stats: Record<string, DayStats>, weekStart: Date): Totals {
  const out: Totals = { ...ZERO };
  for (let i = 0; i < 7; i++) {
    const d = getDay(stats, addDays(weekStart, i));
    out.doors += d.doors;
    out.convos += d.convos;
    out.leads += d.leads;
    out.appts += d.appts;
    out.wins += d.wins;
  }
  return out;
}

function fmtMonthDay(d: Date): string {
  const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${d.getDate()}`;
}

function ratePct(num: number, denom: number): { label: string; raw: number | null } {
  if (denom <= 0) return { label: "—", raw: null };
  const v = (num / denom) * 100;
  return { label: `${Math.round(v)}%`, raw: v };
}

function deltaPct(thisWeek: number, lastWeek: number): {
  label: string;
  dir: "up" | "down" | "flat";
} {
  if (lastWeek <= 0) return { label: "—", dir: "flat" };
  const pct = ((thisWeek - lastWeek) / lastWeek) * 100;
  if (pct > 0) return { label: `▲ ${Math.round(pct)}%`, dir: "up" };
  if (pct < 0) return { label: `▼ ${Math.round(Math.abs(pct))}%`, dir: "down" };
  return { label: "0%", dir: "flat" };
}

const METRICS: { key: keyof Totals; label: string }[] = [
  { key: "doors", label: "Doors" },
  { key: "convos", label: "Convos" },
  { key: "leads", label: "Leads" },
  { key: "appts", label: "Appts" },
  { key: "wins", label: "Wins" },
];

export function WeeklyInsights({ stats }: Props) {
  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMon = startOfWeek(today);
    const lastMon = addDays(thisMon, -7);
    const thisSun = addDays(thisMon, 6);

    const thisWeek = aggregate(stats, thisMon);
    const lastWeek = aggregate(stats, lastMon);

    const conv = ratePct(thisWeek.convos, thisWeek.doors);
    const lead = ratePct(thisWeek.leads, thisWeek.convos);
    const win = ratePct(thisWeek.wins, thisWeek.leads);

    const lastWin = ratePct(lastWeek.wins, lastWeek.leads);

    const range = `${fmtMonthDay(thisMon)} – ${fmtMonthDay(thisSun)}`;

    return { thisWeek, lastWeek, conv, lead, win, lastWin, range };
  }, [stats]);

  /* Insight line — highest priority wins */
  const insight = useMemo(() => {
    const doorsDelta =
      data.lastWeek.doors > 0
        ? ((data.thisWeek.doors - data.lastWeek.doors) / data.lastWeek.doors) * 100
        : 0;

    if (doorsDelta > 20) {
      return `🔥 KNOCKING ${Math.round(doorsDelta)}% MORE DOORS`;
    }
    if (
      data.win.raw !== null &&
      data.lastWin.raw !== null &&
      data.win.raw > data.lastWin.raw
    ) {
      return `📈 CLOSING BETTER — ${Math.round(data.win.raw)}% WIN RATE`;
    }
    return "STEADY WEEK — KEEP PUSHING";
  }, [data]);

  return (
    <section className="border-2 border-foreground bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
          This Week
        </span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground">
          {data.range}
        </span>
      </div>

      {/* Metric grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {METRICS.map((m) => {
          const value = data.thisWeek[m.key];
          const last = data.lastWeek[m.key];
          const d = deltaPct(value, last);
          const deltaClass =
            d.dir === "up"
              ? "text-primary"
              : d.dir === "down"
                ? "text-muted-foreground"
                : "text-muted-foreground";
          return (
            <div key={m.key} className="border-t-2 border-foreground pt-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                {m.label}
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums leading-none text-foreground">
                {value}
              </div>
              <div
                className={`mt-1 text-[10px] font-mono font-bold uppercase tracking-wider ${deltaClass}`}
              >
                {d.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion funnel */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2">
        {[
          { label: "Doors → Convos", val: data.conv.label },
          { label: "Convos → Leads", val: data.lead.label },
          { label: "Leads → Wins", val: data.win.label },
        ].map((f) => (
          <div key={f.label} className="text-center">
            <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground leading-tight">
              {f.label}
            </div>
            <div className="mt-1 text-xl font-bold tabular-nums leading-none text-foreground">
              {f.val}
            </div>
          </div>
        ))}
      </div>

      {/* Insight */}
      <p className="mt-4 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {insight}
      </p>
    </section>
  );
}
