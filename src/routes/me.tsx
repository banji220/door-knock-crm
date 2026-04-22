import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { mockKnocks } from "@/lib/mock-data";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  /* Today only — derived from knock outcomes */
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayKnocks = mockKnocks.filter(
    (k) => new Date(k.timestamp) >= today,
  );
  const knocks = todayKnocks.length;
  const quotes = todayKnocks.filter(
    (k) => k.outcome === "quoted" || k.outcome === "booked",
  ).length;
  const closes = todayKnocks.filter((k) => k.outcome === "booked").length;
  const closeRate = quotes > 0 ? Math.round((closes / quotes) * 100) : 0;

  const stats = [
    { label: "Knocks", value: knocks, accent: "bg-card" },
    { label: "Quotes", value: quotes, accent: "bg-card" },
    { label: "Closes", value: closes, accent: "bg-[var(--amber)]" },
    {
      label: "Close Rate",
      value: `${closeRate}%`,
      accent: "bg-foreground text-background",
    },
  ];

  return (
    <AppShell title="Me" subtitle="Profile · Today">
      {/* Profile */}
      <div className="border-2 border-foreground bg-card p-4 mb-6 flex items-center gap-4">
        <div className="size-16 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center font-mono font-bold text-2xl shrink-0">
          HG
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-bold uppercase text-2xl tracking-tight leading-none">
            Holy Giraffe
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-1.5">
            Field Agent
          </p>
        </div>
      </div>

      {/* Today's stats */}
      <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Today
      </div>
      <div className="grid grid-cols-2 gap-2 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`border-2 border-foreground p-4 ${s.accent}`}
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] opacity-70">
              {s.label}
            </div>
            <div className="text-5xl font-mono font-bold mt-2 leading-none tabular-nums">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sign out — small, muted */}
      <div className="text-center pt-4">
        <button className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive">
          Sign out
        </button>
      </div>
    </AppShell>
  );
}
