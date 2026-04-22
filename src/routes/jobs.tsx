import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
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
          j.status === "scheduled"
            ? "in-progress"
            : j.status === "in-progress"
              ? "done"
              : j.status === "done"
                ? "paid"
                : "paid";
        return { ...j, status: next };
      }),
    );
    if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <AppShell
      title="Jobs"
      subtitle={`${done}/${filtered.length} done · £${total} route`}
    >
      <div className="grid grid-cols-2 gap-2 mb-5">
        {(["today", "tomorrow"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`py-3 border-brutal-thick font-display uppercase text-sm press-brutal ${
              day === d ? "bg-ink text-cream" : "bg-card"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      <ol className="space-y-3">
        {filtered.map((job) => {
          const cfg = statusConfig[job.status];
          return (
            <li
              key={job.id}
              className={`border-brutal-thick p-4 ${cfg.bg}`}
            >
              <div className="flex items-start gap-3">
                <div className="size-10 border-2 border-ink bg-cream flex items-center justify-center font-display text-lg shrink-0">
                  {job.routeOrder}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display uppercase text-lg leading-none">
                      {job.customerName}
                    </h3>
                    <span className="font-display text-2xl leading-none">
                      £{job.price}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm font-mono text-ink/80">
                    <MapPin className="size-3.5" />
                    {job.address}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border-2 border-ink bg-cream">
                      {fmtTime(job.scheduledFor)}
                    </span>
                    <span
                      className={`text-[10px] font-display uppercase px-2 py-0.5 border-2 border-ink ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    job.address,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="border-2 border-ink bg-cream press-brutal py-2.5 flex items-center justify-center gap-1.5 font-display uppercase text-xs"
                >
                  <Navigation className="size-4" strokeWidth={2.5} />
                  Navigate
                </a>
                <button
                  onClick={() => advance(job.id)}
                  className="border-2 border-ink bg-success text-success-foreground press-brutal py-2.5 flex items-center justify-center gap-1.5 font-display uppercase text-xs"
                >
                  <CheckCircle2 className="size-4" strokeWidth={2.5} />
                  {nextLabel(job.status)}
                </button>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="border-brutal-thick border-dashed bg-card p-8 text-center">
            <p className="font-display uppercase text-lg">No jobs {day}</p>
            <p className="text-sm font-mono text-muted-foreground mt-1">
              Go knock some doors.
            </p>
          </li>
        )}
      </ol>
    </AppShell>
  );
}

const statusConfig: Record<Job["status"], { label: string; bg: string; badge: string }> = {
  scheduled: { label: "Scheduled", bg: "bg-card", badge: "bg-cream" },
  "in-progress": { label: "Working", bg: "bg-amber/40", badge: "bg-amber" },
  done: { label: "Done", bg: "bg-success/15", badge: "bg-success text-success-foreground" },
  paid: { label: "Paid", bg: "bg-success/30", badge: "bg-success text-success-foreground" },
};

function nextLabel(s: Job["status"]) {
  return s === "scheduled" ? "Start" : s === "in-progress" ? "Done" : s === "done" ? "Paid" : "Paid";
}
