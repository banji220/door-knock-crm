/* Shared per-day stats shape used by WeeklyGoal + WeeklyInsights.
   Keyed by ISO date string YYYY-MM-DD. */

export type DayStats = {
  doors: number;
  convos: number;
  leads: number;
  appts: number;
  wins: number;
};

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* Monday of the week containing d (local time, Mon=0..Sun=6 internally). */
export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = (out.getDay() + 6) % 7; // Mon=0
  out.setDate(out.getDate() - dow);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

export function isSameDate(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

const EMPTY: DayStats = { doors: 0, convos: 0, leads: 0, appts: 0, wins: 0 };

export function getDay(stats: Record<string, DayStats>, d: Date): DayStats {
  return stats[isoDate(d)] ?? EMPTY;
}
