import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Input, SectionHeader } from "@/components/ui-brutal";
import { mockCustomers, type Customer } from "@/lib/mock-data";
import { Search, Phone, Star, Clock } from "lucide-react";
import { HouseDetail } from "@/components/HouseDetail";

export const Route = createFileRoute("/clients")({
  component: ClientsPage,
});

const MS_PER_DAY = 86_400_000;
const RECLEAN_WINDOW_DAYS = 7; // "approaching" = within 7 days OR overdue

function daysFromNow(iso: string) {
  return Math.round((new Date(iso).getTime() - Date.now()) / MS_PER_DAY);
}
function daysAgo(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / MS_PER_DAY));
}

function ClientsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const totals = useMemo(() => {
    const ltv = mockCustomers.reduce((s, c) => s + c.ltv, 0);
    return { ltv, count: mockCustomers.length };
  }, []);

  const filter = (cs: Customer[]) =>
    cs.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.address.toLowerCase().includes(q.toLowerCase()),
    );

  const dueForReclean = useMemo(
    () =>
      filter(
        mockCustomers
          .filter((c) => daysFromNow(c.recleanDueAt) <= RECLEAN_WINDOW_DAYS)
          .sort((a, b) => daysFromNow(a.recleanDueAt) - daysFromNow(b.recleanDueAt)),
      ),
    [q],
  );

  const reviewNotAsked = useMemo(
    () => filter(mockCustomers.filter((c) => !c.reviewAsked)),
    [q],
  );

  const all = useMemo(
    () => filter([...mockCustomers].sort((a, b) => b.ltv - a.ltv)),
    [q],
  );

  // Tap a customer row → open the read-only detail sheet (NOT the capture form).
  const openCustomer = (c: Customer) => setSelected(c);

  return (
    <AppShell title="Clients" subtitle={`${totals.count} customers`}>
      {/* Hero — total LTV */}
      <div className="border-2 border-foreground bg-card p-5 mb-5">
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Lifetime Revenue
        </div>
        <div
          className="text-6xl font-mono font-bold leading-none tabular-nums"
          style={{ color: "var(--success)" }}
        >
          ${totals.ltv.toLocaleString()}
        </div>
        <div className="mt-2 text-xs font-mono text-muted-foreground">
          across <span className="font-bold text-foreground">{totals.count}</span> customers
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none z-10" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value.slice(0, 100))}
          placeholder="Search name or address"
          maxLength={100}
          className="pl-11 text-base"
        />
      </div>

      {/* Due for reclean */}
      <SectionHeader count={dueForReclean.length}>Due for Reclean</SectionHeader>
      <ul className="space-y-2 mb-5">
        {dueForReclean.length === 0 ? (
          <Card as="li" className="border-dashed p-5 text-center">
            <p className="font-mono font-bold uppercase text-xs text-muted-foreground">
              Nothing due. Great work.
            </p>
          </Card>
        ) : (
          dueForReclean.map((c) => (
            <CustomerRow
              key={c.id}
              c={c}
              accent={
                <DueChip days={daysFromNow(c.recleanDueAt)} icon={<Clock className="size-3" strokeWidth={3} />} />
              }
              onClick={() => openCustomer(c)}
            />
          ))
        )}
      </ul>

      {/* Review not asked */}
      <SectionHeader count={reviewNotAsked.length}>Review Not Asked</SectionHeader>
      <ul className="space-y-2 mb-5">
        {reviewNotAsked.length === 0 ? (
          <Card as="li" className="border-dashed p-5 text-center">
            <p className="font-mono font-bold uppercase text-xs text-muted-foreground">
              All caught up.
            </p>
          </Card>
        ) : (
          reviewNotAsked.map((c) => (
            <CustomerRow
              key={c.id}
              c={c}
              accent={
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border-2 border-foreground bg-[var(--amber)] font-mono font-bold text-[10px] uppercase tracking-wider">
                  <Star className="size-3" strokeWidth={3} />
                  Ask
                </span>
              }
              onClick={() => openCustomer(c)}
            />
          ))
        )}
      </ul>

      {/* All customers */}
      <SectionHeader count={all.length}>All Customers</SectionHeader>
      <ul className="space-y-2">
        {all.length === 0 ? (
          <Card as="li" className="border-dashed p-5 text-center">
            <p className="font-mono font-bold uppercase">No matches</p>
          </Card>
        ) : (
          all.map((c) => (
            <CustomerRow key={c.id} c={c} onClick={() => openCustomer(c)} />
          ))
        )}
      </ul>

      {selected && (
        <HouseDetail
          address={selected.address}
          initialName={selected.name}
          initialPhone={selected.phone}
          status="CUSTOMER"
          onClose={() => setSelected(null)}
          onEditQuote={() => {
            const c = selected;
            setSelected(null);
            navigate({ to: "/quote", search: { address: c.address, mode: "quote" } });
          }}
        />
      )}
    </AppShell>
  );
}

function CustomerRow({
  c, accent, onClick,
}: { c: Customer; accent?: React.ReactNode; onClick: () => void }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="press-brutal w-full text-left border-2 border-foreground bg-card p-3 flex items-stretch gap-3"
      >
        <div className="size-12 border-2 border-foreground bg-[var(--amber)] font-mono font-bold text-lg flex items-center justify-center shrink-0">
          {c.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-mono font-bold uppercase text-sm leading-none truncate">
              {c.name}
            </h3>
            <span className="font-mono font-bold text-base leading-none tabular-nums">
              ${c.ltv}
            </span>
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-1 truncate">
            {c.address}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
            <span>
              <span className="text-foreground font-bold">{c.jobsDone}</span> jobs
              <span className="mx-1">·</span>
              last {daysAgo(c.lastJobAt)}d ago
            </span>
            {accent}
          </div>
        </div>
        {c.phone && (
          <a
            href={`tel:${c.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="press-brutal size-10 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center shrink-0 self-center"
            aria-label={`Call ${c.name}`}
          >
            <Phone className="size-4" strokeWidth={2.5} />
          </a>
        )}
      </button>
    </li>
  );
}

function DueChip({ days, icon }: { days: number; icon: React.ReactNode }) {
  const overdue = days < 0;
  const today = days === 0;
  const label = overdue
    ? `${Math.abs(days)}d overdue`
    : today
    ? "Today"
    : `In ${days}d`;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 border-2 border-foreground font-mono font-bold text-[10px] uppercase tracking-wider ${
        overdue
          ? "bg-destructive text-destructive-foreground"
          : today
          ? "bg-foreground text-background"
          : "bg-card"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}
