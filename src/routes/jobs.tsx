import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, SectionHeader } from "@/components/ui-brutal";
import { mockJobs, type Job } from "@/lib/mock-data";
import { MapPin, CheckCircle2, Navigation } from "lucide-react";

export const Route = createFileRoute("/jobs")({
  component: JobsPage,
});

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [day, setDay] = useState<"today" | "tomorrow">("today");

  const today = new Date().toDateString();
  const filtered = jobs.filter((j) => {
    const match = new Date(j.scheduledFor).toDateString() === today;
    return day === "today" ? match : !match;
  });

  const total = filtered.reduce((s, j) => s + j.price, 0);
  const done = filtered.filter((j) => j.status === "done" || j.status === "paid").length;

  const advance = (id: string) => {
    setJobs(
      jobs.map((j) => {
        if (j.id !== id) return j;
        const next: Job["status"] =
          j.status === "scheduled" ? "in-progress"
            : j.status === "in-progress" ? "done"
              : j.status === "done" ? "paid"
                : "paid";
        return { ...j, status: next };
      }),
    );
    if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <AppShell title="Jobs" subtitle={`${done}/${filtered.length} done · £${total} route`}>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {(["today", "tomorrow"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`press-brutal py-3 border-2 border-foreground font-mono font-bold uppercase tracking-wider text-sm ${
              day === d ? "bg-foreground text-background" : "bg-card"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <SectionHeader count={filtered.length}>Route</SectionHeader>

      <ol className="space-y-3">
        {filtered.map((job) => {
          const cfg = statusConfig[job.status];
          return (
            <Card as="li" key={job.id} className={`p-4 ${cfg.bg}`}>
              <div className="flex items-start gap-3">
                <div className="size-10 border-2 border-foreground bg-background flex items-center justify-center font-mono font-bold text-lg shrink-0">
                  {job.routeOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-mono font-bold uppercase text-base leading-none">
                      {job.customerName}
                    </h3>
                    <span className="font-mono font-bold text-2xl leading-none">£{job.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm font-mono text-foreground/80">
                    <MapPin className="size-3.5" />
                    {job.address}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge>{fmtTime(job.scheduledFor)}</Badge>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="press-brutal border-2 border-foreground bg-background py-2.5 flex items-center justify-center gap-1.5 font-mono font-bold uppercase tracking-wider text-xs"
                >
                  <Navigation className="size-4" strokeWidth={2.5} />
                  Navigate
                </a>
                <button
                  onClick={() => advance(job.id)}
                  className="press-brutal border-2 border-foreground bg-[var(--success)] text-[var(--success-foreground)] py-2.5 flex items-center justify-center gap-1.5 font-mono font-bold uppercase tracking-wider text-xs"
                >
                  <CheckCircle2 className="size-4" strokeWidth={2.5} />
                  {nextLabel(job.status)}
                </button>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card as="li" className="border-dashed p-8 text-center">
            <p className="font-mono font-bold uppercase text-base">No jobs {day}</p>
            <p className="text-sm font-mono text-muted-foreground mt-1">Go knock some doors.</p>
          </Card>
        )}
      </ol>
    </AppShell>
  );
}

const statusConfig: Record<Job["status"], { label: string; bg: string; variant: "default" | "primary" | "accent" | "destructive" | "success" }> = {
  scheduled: { label: "Scheduled", bg: "", variant: "default" },
  "in-progress": { label: "Working", bg: "bg-[var(--amber)]/40", variant: "accent" },
  done: { label: "Done", bg: "bg-[var(--success)]/15", variant: "success" },
  paid: { label: "Paid", bg: "bg-[var(--success)]/30", variant: "success" },
};

function nextLabel(s: Job["status"]) {
  return s === "scheduled" ? "Start" : s === "in-progress" ? "Done" : s === "done" ? "Paid" : "Paid";
}
