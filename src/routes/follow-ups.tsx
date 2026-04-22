import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { mockFollowUps, type FollowUp } from "@/lib/mock-data";
import { Phone, MessageSquare, Check, Clock } from "lucide-react";

export const Route = createFileRoute("/follow-ups")({
  component: FollowUpsPage,
});

function relTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round(
    (d.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `In ${diff}d`;
}

const priorityCfg: Record<FollowUp["priority"], string> = {
  high: "bg-destructive text-destructive-foreground",
  med: "bg-amber text-ink",
  low: "bg-card text-ink",
};

function FollowUpsPage() {
  const [items, setItems] = useState<FollowUp[]>(mockFollowUps);

  const dismiss = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const overdue = items.filter((i) => relTime(i.dueDate).includes("overdue")).length;
  const todayCount = items.filter((i) => relTime(i.dueDate) === "Today").length;

  return (
    <AppShell
      title="Chase"
      subtitle={`${overdue} overdue · ${todayCount} today`}
    >
      <ul className="space-y-3">
        {items.map((f) => {
          const rel = relTime(f.dueDate);
          const isOverdue = rel.includes("overdue");
          return (
            <li
              key={f.id}
              className={`border-brutal-thick bg-card p-4 ${
                isOverdue ? "bg-destructive/10" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-display uppercase text-lg leading-tight">
                    {f.leadName}
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {f.address}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-display uppercase px-2 py-0.5 border-2 border-ink shrink-0 ${priorityCfg[f.priority]}`}
                >
                  {f.priority}
                </span>
              </div>
              <p className="text-sm font-mono mb-3">{f.reason}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 ${
                    isOverdue ? "text-destructive font-bold" : "text-muted-foreground"
                  }`}
                >
                  <Clock className="size-3" />
                  {rel}
                </span>
                <div className="flex gap-2">
                  <button className="size-10 border-2 border-ink bg-cream press-brutal flex items-center justify-center">
                    <MessageSquare className="size-4" strokeWidth={2.5} />
                  </button>
                  <button className="size-10 border-2 border-ink bg-amber press-brutal flex items-center justify-center">
                    <Phone className="size-4" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => dismiss(f.id)}
                    className="size-10 border-2 border-ink bg-success text-success-foreground press-brutal flex items-center justify-center"
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="border-brutal-thick border-dashed bg-card p-8 text-center">
            <p className="font-display uppercase text-lg">All clear</p>
            <p className="text-sm font-mono text-muted-foreground mt-1">
              Nobody to chase. Go knock.
            </p>
          </li>
        )}
      </ul>
    </AppShell>
  );
}
