import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { AppShell, PageHeader, DesktopPageHeader } from "@/components/AppShell";

import { ActionSection } from "@/components/ActionSection";
import { ActionItem } from "@/components/ActionItem";
import { DailyMissionCard } from "@/components/DailyMissionCard";
import { QuickLogCard } from "@/components/QuickLogCard";
import {
  mockKnocks, mockFollowUps, mockJobs, mockQuotes, mockAppointments,
  mockLeads, todayStats,
} from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: TodayPage,
});

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
  // Use UTC to keep SSR and client output identical (avoids hydration mismatch).
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function TodayPage() {
  const knocks = mockKnocks;

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

  /* ===== Sub-renderers shared between mobile + desktop ===== */
  const renderAppointments = () => (
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
  );

  const renderJobs = () => (
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
  );

  const renderFollowUps = () => (
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
  );

  const renderExpiring = () => (
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
  );

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
      {/* ============================================================
          DESKTOP — two-column command center (≥1024px)
          ============================================================ */}
      <div className="hidden lg:block">
        <DesktopPageHeader
          eyebrow="Today"
          title={fullDate || "Today"}
          action={
            <Link
              to="/quote"
              className="press-brutal inline-flex items-center gap-2 border-2 border-foreground bg-foreground text-background px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider"
            >
              <Plus className="size-4" strokeWidth={3} />
              New Quote
            </Link>
          }
        />

        <section className="grid grid-cols-[1fr_380px] gap-6">
          {/* === LEFT: focus column === */}
          <div className="min-w-0 flex flex-col gap-4">
            <QuickLogCard initialCount={knocks.length} />
            <DailyMissionCard
              current={14}
              target={30}
              suggestion="Hit 6 more before lunch — momentum stays alive."
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-foreground bg-card p-5">
                {renderAppointments()}
              </div>
              <div className="border-2 border-foreground bg-card p-5">
                {renderJobs()}
              </div>
            </div>
          </div>

          {/* === RIGHT: urgency column === */}
          <div className="flex flex-col gap-4">
            <div className="border-2 border-foreground bg-card p-5">
              {renderFollowUps()}
            </div>
            <div className="border-2 border-foreground bg-card p-5">
              {renderExpiring()}
            </div>
          </div>
        </section>
      </div>

      {/* ============================================================
          MOBILE / TABLET — single stacked column (<lg)
          ============================================================ */}
      <div className="lg:hidden">
        <div className="space-y-5">
          {renderAppointments()}
          {renderJobs()}
          {renderFollowUps()}
          {renderExpiring()}
        </div>

        <Link
          to="/quote"
          className="press-brutal block w-full border-2 border-foreground bg-foreground text-background py-4 mt-4 text-center font-mono font-bold uppercase tracking-wider"
        >
          <Plus className="inline size-5 mr-2 -mt-1" strokeWidth={3} />
          New Quote
        </Link>
        <div className="h-2" aria-hidden />
      </div>
    </AppShell>
  );
}
