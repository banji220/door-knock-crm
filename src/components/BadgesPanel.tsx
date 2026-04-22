import { useEffect, useMemo, useState } from "react";
import {
  buildYearOfActivity,
  computeStreaks,
} from "@/lib/activity-data";

/* =========================================================================
   BadgesPanel — 20 unlockable badges. Funny, mean, brutalist.
   Sorted: unlocked (in earn order) → locked (closest to next first).
   ========================================================================= */

type BadgeCategory = "daily" | "streak" | "weekly" | "closes" | "special";

type Badge = {
  id: number;
  emoji: string;
  name: string;
  target: number;
  /** human-readable target label e.g. "30 doors today" */
  unit: string;
  category: BadgeCategory;
};

const BADGES: Badge[] = [
  /* Daily door */
  { id: 1,  emoji: "🚪", name: "Finally Off Your Ass",            target: 1,   unit: "doors today",    category: "daily" },
  { id: 2,  emoji: "🔟", name: "Warm Body",                        target: 10,  unit: "doors today",    category: "daily" },
  { id: 3,  emoji: "🎯", name: "Not Completely Useless",           target: 30,  unit: "doors today",    category: "daily" },
  { id: 4,  emoji: "🥩", name: "Door Slut",                        target: 50,  unit: "doors today",    category: "daily" },
  { id: 5,  emoji: "😈", name: "Unhinged",                         target: 75,  unit: "doors today",    category: "daily" },
  { id: 6,  emoji: "💀", name: "What The Fuck Is Wrong With You",  target: 100, unit: "doors today",    category: "daily" },
  /* Streak */
  { id: 7,  emoji: "🩹", name: "Didn't Bitch Out",                 target: 3,   unit: "day streak",     category: "streak" },
  { id: 8,  emoji: "🔥", name: "No Life Confirmed",                target: 7,   unit: "day streak",     category: "streak" },
  { id: 9,  emoji: "🧟", name: "Homeless Or Hustling?",            target: 14,  unit: "day streak",     category: "streak" },
  { id: 10, emoji: "🐐", name: "Bazuka",                           target: 30,  unit: "day streak",     category: "streak" },
  { id: 11, emoji: "☠️", name: "Restraining Order Pending",        target: 60,  unit: "day streak",     category: "streak" },
  /* Weekly */
  { id: 12, emoji: "💯", name: "Touched 100 Doors (Pause)",        target: 100, unit: "doors / week",   category: "weekly" },
  { id: 13, emoji: "🦍", name: "Feral",                            target: 150, unit: "doors / week",   category: "weekly" },
  { id: 14, emoji: "🌋", name: "The Whole Block Hates You",        target: 200, unit: "doors / week",   category: "weekly" },
  /* Closes */
  { id: 15, emoji: "💵", name: "Broke The Seal",                   target: 1,   unit: "closes",         category: "closes" },
  { id: 16, emoji: "💸", name: "Landlord Can Unclench",            target: 5,   unit: "closes",         category: "closes" },
  { id: 17, emoji: "🤑", name: "Dangerously Cocky",                target: 20,  unit: "closes",         category: "closes" },
  { id: 18, emoji: "👑", name: "Owns Your Street",                 target: 50,  unit: "closes",         category: "closes" },
  /* Special / rare — binary triggers */
  { id: 19, emoji: "🌅", name: "Psychopath Hours",                 target: 1,   unit: "knock pre-8am",  category: "special" },
  { id: 20, emoji: "🌙", name: "No Fuckin' Boundaries",            target: 1,   unit: "knock post-7pm", category: "special" },
];

/* Mock progress — realistic for a player on a 12-day streak.
   First 8 badges should unlock with these stats. */
const MOCK_STATS = {
  doorsToday: 35,
  doorsThisWeek: 73,    // matches activity-data calibration
  closes: 8,
  preDawnKnocks: 0,
  lateNightKnocks: 0,
};

function progressFor(badge: Badge, currentStreak: number): number {
  switch (badge.category) {
    case "daily":   return MOCK_STATS.doorsToday;
    case "streak":  return currentStreak;
    case "weekly":  return MOCK_STATS.doorsThisWeek;
    case "closes":  return MOCK_STATS.closes;
    case "special":
      return badge.id === 19 ? MOCK_STATS.preDawnKnocks : MOCK_STATS.lateNightKnocks;
  }
}

/* The badge id that we treat as "just unlocked" — drives pop + toast.
   Badge #8 (No Life Confirmed, 7d streak) is the most recent unlock
   for our 12d-streak field agent. */
const JUST_UNLOCKED_ID = 8;

export function BadgesPanel() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentStreak = useMemo(() => {
    const days = buildYearOfActivity();
    return computeStreaks(days).current;
  }, []);

  /* Compute unlock state */
  const enriched = useMemo(() => {
    const list = BADGES.map((b) => {
      const value = progressFor(b, currentStreak);
      const unlocked = value >= b.target;
      return { ...b, value, unlocked };
    });
    /* Sort: unlocked (in id order ≈ earn order) → locked (closest first) */
    return list.sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
      if (a.unlocked) return a.id - b.id;
      const aPct = a.target > 0 ? a.value / a.target : 0;
      const bPct = b.target > 0 ? b.value / b.target : 0;
      return bPct - aPct;
    });
  }, [currentStreak]);

  const unlockedCount = enriched.filter((b) => b.unlocked).length;

  /* Toast — auto-dismiss after 2.5s, dismissable by tap */
  const [toastVisible, setToastVisible] = useState(false);
  useEffect(() => {
    if (!mounted) return;
    setToastVisible(true);
    const t = window.setTimeout(() => setToastVisible(false), 2500);
    return () => window.clearTimeout(t);
  }, [mounted]);

  const justUnlocked = enriched.find((b) => b.id === JUST_UNLOCKED_ID);

  if (!mounted) {
    return (
      <section className="border-2 border-foreground bg-card px-4 py-4 mb-6">
        <div className="h-[280px]" aria-hidden />
      </section>
    );
  }

  return (
    <>
      {/* Toast */}
      {toastVisible && justUnlocked && (
        <button
          type="button"
          onClick={() => setToastVisible(false)}
          aria-label="Dismiss notification"
          className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 border-2 border-foreground bg-foreground text-background px-5 py-3 flex items-center gap-3 toast-slide-in press-brutal max-w-[calc(100vw-2rem)]"
        >
          <span className="text-2xl badge-bounce" aria-hidden>
            {justUnlocked.emoji}
          </span>
          <span className="text-left">
            <span className="block text-[10px] font-mono uppercase tracking-wider opacity-70">
              Badge Unlocked
            </span>
            <span className="block text-sm font-bold font-mono uppercase">
              {justUnlocked.name}
            </span>
          </span>
        </button>
      )}

      <section className="border-2 border-foreground bg-card px-4 py-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold uppercase tracking-tight">Badges</h2>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {unlockedCount}/{BADGES.length}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {enriched.map((b) => {
            const pct = b.target > 0 ? Math.min(1, b.value / b.target) : 0;
            const isJustUnlocked = b.id === JUST_UNLOCKED_ID && b.unlocked;
            if (b.unlocked) {
              return (
                <div
                  key={b.id}
                  className={`bg-muted py-3 px-1 min-h-[80px] flex flex-col items-center justify-center text-center ${
                    isJustUnlocked ? "animate-achievement-pop" : ""
                  }`}
                  title={`${b.name} — unlocked`}
                >
                  <span className="text-xl leading-none" aria-hidden>
                    {b.emoji}
                  </span>
                  <span className="mt-1.5 text-[9px] font-mono font-bold uppercase leading-tight px-0.5">
                    {b.name}
                  </span>
                </div>
              );
            }
            /* Locked */
            return (
              <div
                key={b.id}
                className="bg-muted/50 border border-border/50 py-3 px-1 min-h-[80px] flex flex-col items-center justify-between text-center"
                title={`${b.name} — ${b.value}/${b.target} ${b.unit}`}
              >
                <span
                  className="text-xl leading-none grayscale opacity-40"
                  aria-hidden
                >
                  {b.emoji}
                </span>
                <span className="mt-1 text-[9px] font-mono font-bold uppercase leading-tight px-0.5 text-muted-foreground">
                  {b.name}
                </span>
                <div className="w-full flex flex-col items-center mt-1">
                  <div className="w-4/5 h-1 bg-muted-foreground/15 overflow-hidden">
                    <div
                      className="h-full bg-primary/60"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <span className="mt-1 text-[8px] font-mono text-muted-foreground/70 tabular-nums">
                    {b.value}/{b.target} {b.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
