import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, SectionHeader } from "@/components/ui-brutal";
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

const priorityVariant: Record<FollowUp["priority"], "destructive" | "accent" | "default"> = {
  high: "destructive",
  med: "accent",
  low: "default",
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
    <AppShell title="Chase" subtitle={`${overdue} overdue · ${todayCount} today`}>
      <SectionHeader count={items.length}>Queue</SectionHeader>
      <ul className="space-y-3">
        {items.map((f) => {
          const rel = relTime(f.dueDate);
          const isOverdue = rel.includes("overdue");
          return (
            <Card as="li" key={f.id} className={`p-4 ${isOverdue ? "bg-[var(--destructive)]/10" : ""}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-mono font-bold uppercase text-base leading-tight">
                    {f.leadName}
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {f.address}
                  </p>
                </div>
                <Badge variant={priorityVariant[f.priority]}>{f.priority}</Badge>
              </div>
              <p className="text-sm font-mono mb-3">{f.reason}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] flex items-center gap-1 ${
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  <Clock className="size-3" />
                  {rel}
                </span>
                <div className="flex gap-2">
                  <button className="press-brutal size-10 border-2 border-foreground bg-background flex items-center justify-center">
                    <MessageSquare className="size-4" strokeWidth={2.5} />
                  </button>
                  <button className="press-brutal size-10 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center">
                    <Phone className="size-4" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => dismiss(f.id)}
                    className="press-brutal size-10 border-2 border-foreground bg-[var(--success)] text-[var(--success-foreground)] flex items-center justify-center"
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
        {items.length === 0 && (
          <Card as="li" className="border-dashed p-8 text-center">
            <p className="font-mono font-bold uppercase text-base">All clear</p>
            <p className="text-sm font-mono text-muted-foreground mt-1">Nobody to chase. Go knock.</p>
          </Card>
        )}
      </ul>
    </AppShell>
  );
}
