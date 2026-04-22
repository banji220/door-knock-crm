import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";

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

  /* Daily mission */
  const [target, setTarget] = useState(30);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState("30");

  /* Hour state — client-only to avoid SSR hydration mismatch */
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

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

  /* Mission progress */
  const pct = target > 0 ? logged / target : 0;
  const pctClamp = Math.min(1, pct);
  const complete = logged >= target;
  const stretch = pct > 1.5;

  const status = logged === 0
    ? "Not Started"
    : complete
      ? "Mission Complete"
      : "In Progress";

  const statusEmoji = logged === 0 ? "🎯" : complete ? "🏆" : "🔥";

  const heatClass =
    pct >= 1
      ? "heatmap-5"
      : pct > 0.6
        ? "heatmap-4"
        : pct > 0.3
          ? "heatmap-3"
          : "heatmap-2";

  /* Smart suggestion — depends on client-side hour, render placeholder until hydrated */
  let suggestion = "Loading pace...";
  if (hour !== null) {
    const remaining = target - logged;
    if (stretch) {
      suggestion = "Beast mode. You've blown past the goal.";
    } else if (complete) {
      suggestion = "Mission complete. Anything extra is bonus.";
    } else if (remaining > 0 && remaining <= 5) {
      suggestion = `Just ${remaining} more. You're right there.`;
    } else if (logged === 0 && hour < 14) {
      suggestion = "Clock's ticking. First knock sets the tone.";
    } else if (logged === 0) {
      suggestion = "Day's slipping — start now, finish strong.";
    } else if (pct > 0.7) {
      suggestion = "You're on track for a strong day.";
    } else if (pct >= 0.4) {
      suggestion = "Solid pace. Keep the momentum going.";
    } else {
      suggestion = "Good start. Stay consistent and stack the numbers.";
    }
  }

  const commitTarget = () => {
    const n = parseInt(targetDraft, 10);
    if (!Number.isNaN(n) && n > 0) setTarget(n);
    setEditingTarget(false);
  };

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

      {/* ===== Daily Mission ===== */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <span aria-hidden className="mr-1">{statusEmoji}</span>
            Daily Mission
          </span>
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border-2 border-foreground ${
              complete
                ? "bg-[var(--success)] text-[var(--success-foreground)]"
                : logged === 0
                  ? "bg-card text-muted-foreground"
                  : "bg-[var(--amber)] text-foreground"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="border-2 border-foreground bg-card p-3">
          {/* Progress bar */}
          <div
            className="relative h-6 w-full bg-muted border-2 border-foreground overflow-hidden"
            role="progressbar"
            aria-valuenow={logged}
            aria-valuemin={0}
            aria-valuemax={target}
          >
            <div
              className={`h-full ${heatClass} transition-[width] duration-300`}
              style={{ width: `${pctClamp * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold tabular-nums text-foreground mix-blend-difference">
              <span className="text-background">
                {logged} / {target} doors
              </span>
            </div>
          </div>

          {/* Editable target */}
          <div className="mt-3 flex items-center justify-between">
            {editingTarget ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={targetDraft}
                  onChange={(e) => setTargetDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTarget();
                    if (e.key === "Escape") setEditingTarget(false);
                  }}
                  autoFocus
                  className="w-20 border-2 border-foreground bg-background font-mono font-bold text-sm px-2 py-1 focus:outline-none focus:bg-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={commitTarget}
                  className="press-brutal border-2 border-foreground bg-foreground text-background font-mono font-bold text-[11px] uppercase tracking-wider px-3 py-1 active:translate-y-[2px]"
                >
                  Save
                </button>
              </div>
            ) : (
              <span className="text-xs font-mono text-muted-foreground">
                Target:{" "}
                <span className="font-bold text-foreground">{target}</span>{" "}
                doors
              </span>
            )}
            {!editingTarget && (
              <button
                type="button"
                onClick={() => {
                  setTargetDraft(String(target));
                  setEditingTarget(true);
                }}
                className="press-brutal border-2 border-foreground bg-card font-mono font-bold text-[11px] uppercase tracking-wider px-3 py-1 active:translate-y-[2px]"
              >
                Edit
              </button>
            )}
          </div>

          <p className="mt-3 text-sm font-mono text-muted-foreground leading-snug">
            {suggestion}
          </p>
        </div>
      </section>

      {/* ===== Sign out ===== */}
      <div className="text-center pt-2 pb-4">
        <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
