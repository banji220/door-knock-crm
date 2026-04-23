import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, PageHeader, DesktopPageHeader } from "@/components/AppShell";
import { Show } from "@/components/responsive";
import { SectionLabel } from "@/components/ui-brutal";
import { DailyMissionCard } from "@/components/DailyMissionCard";
import { QuickLogCard } from "@/components/QuickLogCard";
import { RowItem, RowList, EmptyState, type RowAccent } from "@/components/RowItem";
import {
  mockKnocks, mockFollowUps, mockJobs, mockQuotes, mockAppointments,
  mockLeads, todayStats,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  component: TodayPage,
});

const MS_PER_DAY = 86_400_000;

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}
function daysAgo(iso: string): number {
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - d.getTime()) / MS_PER_DAY);
}
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
function fmtDueLabel(iso: string): { label: string; overdue: boolean } {
  const d = daysAgo(iso);
  if (d < 0) return { label: `IN ${Math.abs(d)}D`, overdue: false };
  if (d === 0) return { label: "TODAY", overdue: false };
  return { label: `${d}D LATE`, overdue: true };
}

function TodayPage() {
  /* Date label — gated behind mount to avoid SSR/client locale drift */
  const [fullDate, setFullDate] = useState("Today");
  useEffect(() => {
    setFullDate(
      new Date().toLocaleDateString(undefined, {
        weekday: "long", month: "long", day: "numeric",
      }),
    );
  }, []);

  const knocks = mockKnocks;
  const phoneFor = (address: string) =>
    mockLeads.find((l) => l.address === address)?.phone;

  const appointmentsToday = useMemo(
    () => mockAppointments.filter((a) => isToday(a.time)), [],
  );
  const jobsToday = useMemo(
    () => mockJobs.filter((j) => isToday(j.scheduledFor)), [],
  );
  const followUpsDue = useMemo(
    () => mockFollowUps.filter((f) => daysAgo(f.dueDate) >= 0)
      .sort((a, b) => daysAgo(b.dueDate) - daysAgo(a.dueDate)),
    [],
  );
  const expiringQuotes = useMemo(
    () =>
      mockQuotes
        .filter((q) => q.status === "sent" && daysAgo(q.createdAt) >= 5)
        .sort((a, b) => daysAgo(b.createdAt) - daysAgo(a.createdAt)),
    [],
  );

  const pendingActions =
    appointmentsToday.length +
    jobsToday.filter((j) => j.status === "scheduled").length +
    followUpsDue.length +
    expiringQuotes.length;

  /* ===== Reusable row groups ===== */
  const AppointmentRows = () =>
    appointmentsToday.length === 0 ? (
      <EmptyState title="No appointments today" hint="A clean slate." />
    ) : (
      <RowList>
        {appointmentsToday.map((a) => (
          <RowItem
            key={a.id}
            timeLabel={fmtTime(a.time)}
            name={a.name}
            address={a.address}
            phone={a.phone}
            price={a.price}
          />
        ))}
      </RowList>
    );

  const JobRows = () =>
    jobsToday.length === 0 ? (
      <EmptyState title="No jobs today" hint="Hit the map." />
    ) : (
      <RowList>
        {jobsToday.map((j) => (
          <RowItem
            key={j.id}
            timeLabel={fmtTime(j.scheduledFor)}
            name={j.customerName}
            address={j.address}
            phone={phoneFor(j.address)}
            price={j.price}
          />
        ))}
      </RowList>
    );

  const FollowUpRows = () =>
    followUpsDue.length === 0 ? (
      <EmptyState title="No follow-ups due" hint="Inbox zero." />
    ) : (
      <RowList>
        {followUpsDue.map((f) => {
          const due = fmtDueLabel(f.dueDate);
          const accent: RowAccent = due.overdue ? "destructive" : "warning";
          return (
            <RowItem
              key={f.id}
              timeLabel={due.label}
              overdue={due.overdue}
              name={f.leadName}
              address={f.address}
              phone={phoneFor(f.address)}
              accent={accent}
            />
          );
        })}
      </RowList>
    );

  const ExpiringRows = () =>
    expiringQuotes.length === 0 ? (
      <EmptyState title="No expiring quotes" hint="Pipeline is fresh." />
    ) : (
      <RowList>
        {expiringQuotes.map((q) => {
          const days = daysAgo(q.createdAt);
          const overdue = days >= 7;
          return (
            <RowItem
              key={q.id}
              timeLabel={`${days}D OLD`}
              overdue={overdue}
              name={q.leadName}
              address={q.address}
              phone={phoneFor(q.address)}
              price={q.price}
              accent={overdue ? "destructive" : "warning"}
            />
          );
        })}
      </RowList>
    );

  const NewQuoteCTA = ({ block = false }: { block?: boolean }) => (
    <Link
      to="/quote"
      className={`press-brutal inline-flex items-center justify-center gap-2 border-2 border-foreground bg-foreground text-background font-mono font-bold uppercase tracking-wider ${
        block ? "w-full py-4 text-sm" : "px-4 py-2 text-xs"
      }`}
    >
      <Plus className={block ? "size-5" : "size-4"} strokeWidth={3} />
      New Quote
    </Link>
  );

  return (
    <AppShell
      header={
        <PageHeader
          eyebrow="Today"
          title={fullDate}
          meta={
            <>
              <span className="font-bold text-foreground tabular-nums">
                {knocks.length}
              </span>{" "}
              doors knocked ·{" "}
              <span className="font-bold text-foreground tabular-nums">
                {pendingActions}
              </span>{" "}
              actions pending
            </>
          }
          action={
            <div className="text-right border-2 border-foreground bg-[var(--amber)] px-3 py-1.5">
              <div className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-foreground/70 leading-none">
                Booked
              </div>
              <div className="text-2xl font-mono font-bold leading-none mt-1 tabular-nums">
                {todayStats.booked}
              </div>
            </div>
          }
        />
      }
    >
      {/* ============================================================
          DESKTOP (≥1025) — 3-zone command center.
          LEFT: Action (Mission hero + Quick Log inline)
          CENTER: Execution (Appointments + Jobs)
          RIGHT: Urgency (Follow-ups + Expiring)
          ============================================================ */}
      <Show on="desktop">
        <DesktopPageHeader
          eyebrow="Today"
          title={fullDate}
          action={<NewQuoteCTA />}
        />

        <div className="grid grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,360px)] gap-8">
          {/* === ACTION === */}
          <div className="space-y-8 min-w-0">
            <DailyMissionCard
              current={14}
              target={30}
              suggestion="Hit 6 more before lunch — momentum stays alive."
            />
            <div>
              <QuickLogCard initialCount={knocks.length} />
            </div>
          </div>

          {/* === EXECUTION === */}
          <div className="space-y-8 min-w-0">
            <section>
              <SectionLabel count={appointmentsToday.length}>
                Appointments
              </SectionLabel>
              <AppointmentRows />
            </section>
            <section>
              <SectionLabel count={jobsToday.length}>Jobs</SectionLabel>
              <JobRows />
            </section>
          </div>

          {/* === URGENCY === */}
          <div className="space-y-8 min-w-0">
            <section>
              <SectionLabel
                count={followUpsDue.length}
                action={
                  followUpsDue.some((f) => daysAgo(f.dueDate) > 0) ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-destructive">
                      ● Overdue
                    </span>
                  ) : null
                }
              >
                Follow-ups
              </SectionLabel>
              <FollowUpRows />
            </section>
            <section>
              <SectionLabel count={expiringQuotes.length}>
                Expiring Quotes
              </SectionLabel>
              <ExpiringRows />
            </section>
          </div>
        </div>
      </Show>

      {/* ============================================================
          TABLET (641-1024) — 2-zone hybrid.
          TOP: Mission hero (full width) + Quick Log
          BOTTOM: 2-col grid — execution (left) | urgency (right)
          ============================================================ */}
      <Show on="tablet">
        <div className="space-y-6">
          <DailyMissionCard
            current={14}
            target={30}
            suggestion="Hit 6 more before lunch — momentum stays alive."
          />
          <QuickLogCard initialCount={knocks.length} />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-6 min-w-0">
              <section>
                <SectionLabel count={appointmentsToday.length}>
                  Appointments
                </SectionLabel>
                <AppointmentRows />
              </section>
              <section>
                <SectionLabel count={jobsToday.length}>Jobs</SectionLabel>
                <JobRows />
              </section>
            </div>
            <div className="space-y-6 min-w-0">
              <section>
                <SectionLabel count={followUpsDue.length}>
                  Follow-ups
                </SectionLabel>
                <FollowUpRows />
              </section>
              <section>
                <SectionLabel count={expiringQuotes.length}>
                  Expiring Quotes
                </SectionLabel>
                <ExpiringRows />
              </section>
            </div>
          </div>

          <NewQuoteCTA block />
        </div>
      </Show>

      {/* ============================================================
          MOBILE (≤640) — single column, prioritized order.
          1. Mission (anchor)
          2. Quick Log (frequent action)
          3. Urgency (follow-ups, expiring) — most actionable first
          4. Execution (appointments, jobs) — the schedule
          ============================================================ */}
      <Show on="mobile">
        <div className="space-y-6">
          <DailyMissionCard
            current={14}
            target={30}
            suggestion="Hit 6 more before lunch — momentum stays alive."
          />
          <QuickLogCard initialCount={knocks.length} />

          <section>
            <SectionLabel count={followUpsDue.length}>Follow-ups</SectionLabel>
            <FollowUpRows />
          </section>
          <section>
            <SectionLabel count={expiringQuotes.length}>
              Expiring Quotes
            </SectionLabel>
            <ExpiringRows />
          </section>
          <section>
            <SectionLabel count={appointmentsToday.length}>
              Appointments
            </SectionLabel>
            <AppointmentRows />
          </section>
          <section>
            <SectionLabel count={jobsToday.length}>Jobs</SectionLabel>
            <JobRows />
          </section>

          <NewQuoteCTA block />
          <div className="h-2" aria-hidden />
        </div>
      </Show>
    </AppShell>
  );
}
