import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";

import { ActionSection } from "@/components/ActionSection";
import { ActionItem } from "@/components/ActionItem";
import {
  mockKnocks, mockFollowUps, mockJobs, mockQuotes, mockAppointments,
  mockLeads, todayStats, type Knock,
} from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: TodayPage,
});

const DAILY_GOAL = 30;
const MS_PER_DAY = 86_400_000;

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function daysAgo(iso: string): number {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - d.getTime()) / MS_PER_DAY);
}

function fmtDueLabel(iso: string): { label: string; overdue: boolean } {
  const d = daysAgo(iso);
  if (d < 0) return { label: `In ${Math.abs(d)}d`, overdue: false };
  if (d === 0) return { label: "Today", overdue: false };
  return { label: `${d}d overdue`, overdue: true };
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function TodayPage() {
  const [knocks, setKnocks] = useState<Knock[]>(mockKnocks);

  /* Sectioned data */
  const appointmentsToday = useMemo(
    () => mockAppointments.filter((a) => isToday(a.time)),
    [],
  );

  const jobsToday = useMemo(
    () => mockJobs.filter((j) => isToday(j.scheduledFor)),
    [],
  );

  const followUpsDue = useMemo(
    () => mockFollowUps.filter((f) => daysAgo(f.dueDate) >= 0),
    [],
  );

  const expiringQuotes = useMemo(
    () =>
      mockQuotes.filter(
        (q) => q.status === "sent" && daysAgo(q.createdAt) >= 5,
      ),
    [],
  );

  const phoneFor = (address: string) =>
    mockLeads.find((l) => l.address === address)?.phone;

  const [fullDate, setFullDate] = useState("");
  useEffect(() => {
    setFullDate(
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);
  const pendingActions =
    appointmentsToday.length +
    jobsToday.filter((j) => j.status === "scheduled").length +
    followUpsDue.length +
    expiringQuotes.length;

  return (
    <AppShell
      header={
        <PageHeader
          eyebrow="Today"
          title={fullDate}
          meta={
            <>
              <span className="font-bold text-foreground">{knocks.length}</span> doors knocked ·{" "}
              <span className="font-bold text-foreground">{pendingActions}</span> actions pending
            </>
          }
          action={
            <div className="text-right border-2 border-foreground bg-[var(--amber)] px-3 py-1.5">
              <div className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-foreground/70 leading-none">
                Booked
              </div>
              <div className="text-2xl font-mono font-bold leading-none mt-1">
                {todayStats.booked}
              </div>
            </div>
          }
        />
      }
    >
      <ActionSection label="Appointments Today" count={appointmentsToday.length}>
        {appointmentsToday.map((a) => (
          <li key={a.id}>
            <ActionItem
              dueLabel={fmtTime(a.time)}
              name={a.name}
              address={a.address}
              phone={a.phone}
              price={a.price}
            />
          </li>
        ))}
      </ActionSection>

      {/* JOBS TODAY */}
      <ActionSection label="Jobs Today" count={jobsToday.length}>
        {jobsToday.map((j) => (
          <li key={j.id}>
            <ActionItem
              dueLabel={fmtTime(j.scheduledFor)}
              name={j.customerName}
              address={j.address}
              phone={phoneFor(j.address)}
              price={j.price}
            />
          </li>
        ))}
      </ActionSection>

      {/* FOLLOW-UPS DUE */}
      <ActionSection label="Follow-Ups Due" count={followUpsDue.length}>
        {followUpsDue.map((f) => {
          const due = fmtDueLabel(f.dueDate);
          return (
            <li key={f.id}>
              <ActionItem
                dueLabel={due.label}
                overdue={due.overdue}
                name={f.leadName}
                address={f.address}
                phone={phoneFor(f.address)}
              />
            </li>
          );
        })}
      </ActionSection>

      {/* EXPIRING QUOTES */}
      <ActionSection label="Expiring Quotes" count={expiringQuotes.length}>
        {expiringQuotes.map((q) => {
          const days = daysAgo(q.createdAt);
          return (
            <li key={q.id}>
              <ActionItem
                dueLabel={`${days}d old`}
                overdue={days >= 7}
                name={q.leadName}
                address={q.address}
                phone={phoneFor(q.address)}
                price={q.price}
              />
            </li>
          );
        })}
      </ActionSection>

      {/* Quote shortcut */}
      <Link
        to="/quote"
        className="press-brutal block w-full border-2 border-foreground bg-foreground text-background py-4 text-center font-mono font-bold uppercase tracking-wider"
      >
        <Plus className="inline size-5 mr-2 -mt-1" strokeWidth={3} />
        New Quote
      </Link>
      {/* Spacer so the floating bottom nav doesn't clip last button */}
      <div className="h-2" aria-hidden />
    </AppShell>
  );
}
