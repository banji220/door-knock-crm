/* =========================================================================
   Activity data — deterministic, seeded so SSR + client match.
   Calibrated so the *current* state shows: 12d streak, best 21d, momentum 72.
   Shared by ContributionHeatmap, StreakPanel, MomentumMeter.
   ========================================================================= */

export type Metric = "doors" | "convos" | "leads" | "appts" | "wins";

export type DayRecord = {
  date: Date;
  doors: number;
  convos: number;
  leads: number;
  appts: number;
  wins: number;
  inFuture: boolean;
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TARGET_CURRENT_STREAK = 12;
const TARGET_BEST_STREAK = 21;

/* Build a full year of seeded activity, then surgically force the
   current and best streaks to the targets. */
export function buildYearOfActivity(): DayRecord[] {
  const rng = mulberry32(20260415);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 364);

  const days: DayRecord[] = [];
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dow = d.getDay();
    const weekendDip = dow === 0 || dow === 6 ? 0.4 : 1;

    /* Inject "rest days" — about 18% of weekdays, 45% of weekends, are zero. */
    const restRoll = rng();
    const isRest =
      (dow === 0 || dow === 6 ? restRoll < 0.45 : restRoll < 0.18) &&
      i < 365 - TARGET_CURRENT_STREAK; // never rest within current streak window

    const shaped = Math.pow(rng(), 1.5) * weekendDip;
    const doors = isRest ? 0 : Math.max(1, Math.round(shaped * 60));
    const convos = isRest ? 0 : Math.round(doors * (0.25 + rng() * 0.2));
    const leads = isRest ? 0 : Math.round(convos * (0.3 + rng() * 0.2));
    const appts = isRest ? 0 : Math.round(leads * (0.35 + rng() * 0.25));
    const wins = isRest ? 0 : Math.round(appts * (0.4 + rng() * 0.3));

    days.push({
      date: d,
      doors,
      convos,
      leads,
      appts,
      wins,
      inFuture: false,
    });
  }

  /* Force the *current* streak: last N days are non-zero,
     and the day immediately before is zero. */
  const lastIdx = days.length - 1;
  const currentStart = lastIdx - TARGET_CURRENT_STREAK + 1;
  for (let i = currentStart; i <= lastIdx; i++) {
    if (days[i].doors === 0) {
      days[i].doors = 5 + Math.round(rng() * 25);
      days[i].convos = Math.round(days[i].doors * 0.3);
      days[i].leads = Math.round(days[i].convos * 0.35);
      days[i].appts = Math.round(days[i].leads * 0.4);
      days[i].wins = Math.round(days[i].appts * 0.5);
    }
  }
  if (currentStart > 0) {
    days[currentStart - 1].doors = 0;
    days[currentStart - 1].convos = 0;
    days[currentStart - 1].leads = 0;
    days[currentStart - 1].appts = 0;
    days[currentStart - 1].wins = 0;
  }

  /* Force a *best* streak of 21 days somewhere earlier in the year.
     Place it ~6 months back, with rest days bracketing it. */
  const bestStart = 120;
  const bestEnd = bestStart + TARGET_BEST_STREAK - 1;
  for (let i = bestStart; i <= bestEnd; i++) {
    if (days[i].doors === 0) {
      days[i].doors = 8 + Math.round(rng() * 30);
      days[i].convos = Math.round(days[i].doors * 0.3);
      days[i].leads = Math.round(days[i].convos * 0.35);
      days[i].appts = Math.round(days[i].leads * 0.4);
      days[i].wins = Math.round(days[i].appts * 0.5);
    }
  }
  if (bestStart > 0) {
    days[bestStart - 1].doors = 0;
    days[bestStart - 1].convos = 0;
    days[bestStart - 1].leads = 0;
    days[bestStart - 1].appts = 0;
    days[bestStart - 1].wins = 0;
  }
  if (bestEnd + 1 < days.length) {
    days[bestEnd + 1].doors = 0;
    days[bestEnd + 1].convos = 0;
    days[bestEnd + 1].leads = 0;
    days[bestEnd + 1].appts = 0;
    days[bestEnd + 1].wins = 0;
  }

  /* Calibrate the last 14 days so momentum lands ~72 with a 12d streak.
     Consistency 100% (no rest within streak) → V·0.4 + T·0.15 must ≈ 27.
     thisWeek total ≈ 73 (avg ≈ 10.5 → volume ≈ 42),
     prevWeek total ≈ 62 (trend +18% → trendScore ≈ 68).
     Score ≈ 100·0.45 + 42·0.4 + 68·0.15 ≈ 72. */
  const last7Start = days.length - 7;
  const targetThisWeek = [9, 12, 8, 14, 11, 7, 12]; // sum 73
  for (let i = 0; i < 7; i++) {
    const idx = last7Start + i;
    days[idx].doors = targetThisWeek[i];
    days[idx].convos = Math.round(targetThisWeek[i] * 0.3);
    days[idx].leads = Math.max(1, Math.round(days[idx].convos * 0.4));
    days[idx].appts = Math.max(1, Math.round(days[idx].leads * 0.4));
    days[idx].wins = Math.round(days[idx].appts * 0.5);
  }
  const prevTotals = [8, 10, 7, 12, 9, 5, 11]; // sum 62
  for (let i = 0; i < 7; i++) {
    const idx = last7Start - 7 + i;
    days[idx].doors = prevTotals[i];
    days[idx].convos = Math.round(prevTotals[i] * 0.3);
    days[idx].leads = Math.max(1, Math.round(days[idx].convos * 0.4));
    days[idx].appts = Math.max(1, Math.round(days[idx].leads * 0.4));
    days[idx].wins = Math.round(days[idx].appts * 0.5);
  }

  /* Re-enforce streak boundary AFTER volume calibration: zero out the day
     immediately before the 12-day window so the streak ends at exactly 12. */
  const breakIdx = days.length - 1 - TARGET_CURRENT_STREAK;
  if (breakIdx >= 0) {
    days[breakIdx].doors = 0;
    days[breakIdx].convos = 0;
    days[breakIdx].leads = 0;
    days[breakIdx].appts = 0;
    days[breakIdx].wins = 0;
  }

  return days;
}

export function metricValue(d: DayRecord, m: Metric): number {
  return d[m];
}

export const METRIC_LABELS: Record<Metric, string> = {
  doors: "Doors",
  convos: "Convos",
  leads: "Leads",
  appts: "Appts",
  wins: "Wins",
};

/* Doors thresholds — fixed buckets per spec.
   Other metrics: relative to a per-metric ceiling. */
const RELATIVE_MAX: Record<Metric, number> = {
  doors: 60,
  convos: 25,
  leads: 12,
  appts: 6,
  wins: 5,
};

export function colorStep(value: number, metric: Metric): 0 | 1 | 2 | 3 | 4 | 5 {
  if (value <= 0) return 0;
  if (metric === "doors") {
    if (value <= 7) return 1;
    if (value <= 19) return 2;
    if (value <= 34) return 3;
    if (value <= 49) return 4;
    return 5;
  }
  const pct = value / RELATIVE_MAX[metric];
  if (pct < 0.2) return 1;
  if (pct < 0.4) return 2;
  if (pct < 0.6) return 3;
  if (pct < 0.85) return 4;
  return 5;
}

/* Compute current and best streaks (consecutive days with doors > 0). */
export function computeStreaks(days: DayRecord[]) {
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].doors > 0) current++;
    else break;
  }
  let best = 0;
  let run = 0;
  for (const d of days) {
    if (d.doors > 0) {
      run++;
      if (run > best) best = run;
    } else run = 0;
  }
  return { current, best };
}

/* Composite momentum score — consistency 45 / volume 40 / trend 15 */
export function computeMomentum(days: DayRecord[]) {
  const last7 = days.slice(-7);
  const prev7 = days.slice(-14, -7);

  const activeDays = last7.filter((d) => d.doors > 0).length;
  const consistency = (activeDays / 7) * 100;

  const avgDoors = last7.reduce((s, d) => s + d.doors, 0) / 7;
  const volume = Math.min(100, (avgDoors / 25) * 100);

  const thisWeekTotal = last7.reduce((s, d) => s + d.doors, 0);
  const lastWeekTotal = prev7.reduce((s, d) => s + d.doors, 0);
  let trendPct = 0;
  if (lastWeekTotal > 0) {
    trendPct = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
  } else if (thisWeekTotal > 0) {
    trendPct = 100;
  }
  /* Map -50..+50 → 0..100, clamped */
  const trendScore = Math.max(0, Math.min(100, 50 + trendPct));

  const score = Math.round(
    consistency * 0.45 + volume * 0.4 + trendScore * 0.15,
  );
  return {
    score,
    consistency: Math.round(consistency),
    volume: Math.round(volume),
    trendPct: Math.round(trendPct),
    thisWeekTotal,
    lastWeekTotal,
    last7,
  };
}
