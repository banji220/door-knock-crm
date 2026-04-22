import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Phone, Navigation, ChevronDown, ChevronUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui-brutal";
import { HouseDetail, type DetailStatus } from "@/components/HouseDetail";
import { formatMoney } from "@/lib/format";
import {
  mockLeads,
  mockQuotes,
  mockJobs,
  mockFollowUps,
  type Lead,
} from "@/lib/mock-data";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

const MS_PER_DAY = 86_400_000;

type Stage = "LEAD" | "QUOTED" | "WON";
type StripeTone = "destructive" | "warning" | "primary" | "won";

type DealCard = {
  id: string;
  address: string;
  name: string;
  phone?: string;
  price: number;
  stage: Stage;
  daysSince: number;
  urgent: boolean;
  reason?: string;
  stripe: StripeTone;
  sortKey: number;
};

function daysAgo(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / MS_PER_DAY));
}

function timeAgoLabel(d: number) {
  if (d === 0) return "today";
  if (d === 1) return "1d ago";
  return `${d}d ago`;
}

const STRIPE_BG: Record<StripeTone, string> = {
  destructive: "bg-destructive",
  warning: "bg-[var(--heatmap-2)]",
  primary: "bg-foreground",
  won: "bg-[var(--heatmap-5)]",
};

function DealsPage() {
  const navigate = useNavigate();
  const [wonOpen, setWonOpen] = useState(false);
  const [selected, setSelected] = useState<DealCard | null>(null);

  const { hottest, pipeline, won, totals } = useMemo(() => {
    const quoteByAddr = new Map(mockQuotes.map((q) => [q.address, q]));
    const jobByAddr = new Map(mockJobs.map((j) => [j.address, j]));
    const followByAddr = new Map(mockFollowUps.map((f) => [f.address, f]));

    const buildLead = (l: Lead): DealCard => {
      const q = quoteByAddr.get(l.address);
      const j = jobByAddr.get(l.address);
      const follow = followByAddr.get(l.address);
      const days = daysAgo(l.lastContact);
      const isQuoted = l.status === "warm";
      const isWon = l.status === "won";
      const stage: Stage = isWon ? "WON" : isQuoted ? "QUOTED" : "LEAD";
      const price = j?.price ?? q?.price ?? 0;

      // urgency
      const followDays = follow ? daysAgo(follow.dueDate) : 0;
      const overdue = follow && new Date(follow.dueDate).getTime() < Date.now();
      const expiring = isQuoted && days >= 5;
      const freshQuoteToday = isQuoted && days === 0;

      let urgent = false;
      let reason: string | undefined;
      let stripe: StripeTone = "primary";
      let sortKey = 999;

      if (!isWon && overdue) {
        urgent = true;
        stripe = "destructive";
        reason = `${followDays}d overdue${follow?.reason ? ` — ${follow.reason.split("—")[0].trim()}` : ""}`;
        sortKey = 0 - followDays;
      } else if (expiring) {
        urgent = true;
        stripe = "warning";
        reason = `Quote dying — ${days}d old`;
        sortKey = 100 - days;
      } else if (freshQuoteToday) {
        urgent = true;
        stripe = "primary";
        reason = "Follow up today";
        sortKey = 200;
      } else if (!isWon && follow && followDays === 0) {
        urgent = true;
        stripe = "destructive";
        reason = "Follow up today";
        sortKey = 50;
      }

      if (isWon) stripe = "won";

      return {
        id: l.id,
        address: l.address,
        name: l.name,
        phone: l.phone,
        price,
        stage,
        daysSince: days,
        urgent,
        reason,
        stripe,
        sortKey,
      };
    };

    const all = mockLeads
      .filter((l) => l.status !== "lost")
      .map(buildLead);

    const hottest = all
      .filter((c) => c.urgent && c.stage !== "WON")
      .sort((a, b) => a.sortKey - b.sortKey);

    const pipeline = all
      .filter((c) => !c.urgent && c.stage !== "WON")
      .sort((a, b) => a.daysSince - b.daysSince)
      .map((c) => ({ ...c, stripe: "warning" as StripeTone }));

    const won = all
      .filter((c) => c.stage === "WON" && c.daysSince <= 30)
      .sort((a, b) => a.daysSince - b.daysSince);

    const sum = (arr: DealCard[]) => arr.reduce((s, c) => s + c.price, 0);

    const leadsTotal = sum(all.filter((c) => c.stage === "LEAD"));
    const quotedTotal = sum(all.filter((c) => c.stage === "QUOTED"));
    const wonTotal = sum(won);

    return {
      hottest,
      pipeline,
      won,
      totals: { leadsTotal, quotedTotal, wonTotal },
    };
  }, []);

  const grandTotal =
    totals.leadsTotal + totals.quotedTotal + totals.wonTotal || 1;
  const segs = [
    { label: "LEADS", value: totals.leadsTotal, color: "var(--heatmap-1)" },
    { label: "QUOTED", value: totals.quotedTotal, color: "var(--heatmap-3)" },
    { label: "WON", value: totals.wonTotal, color: "var(--heatmap-5)" },
  ];

  // Tap a deal card → open the read-only detail sheet (NOT the capture form).
  const openHouse = (card: DealCard) => setSelected(card);

  const callPhone = (e: React.MouseEvent, phone?: string) => {
    e.stopPropagation();
    if (phone) window.location.href = `tel:${phone.replace(/\s/g, "")}`;
  };
  const navigateMaps = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`,
      "_blank",
    );
  };

  return (
    <AppShell title="Deals" subtitle={`Pipeline ${formatMoney(totals.quotedTotal)} · Won ${formatMoney(totals.wonTotal)}`}>
      <div className="space-y-5">
        {/* Money Bar */}
        <section>
          <div className="flex w-full h-10 border-2 border-foreground overflow-hidden">
            {segs.map((s, i) => {
              const pct = (s.value / grandTotal) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={s.label}
                  style={{ width: `${pct}%`, background: s.color }}
                  className={i > 0 ? "border-l-2 border-foreground" : ""}
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            {segs.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 text-xs font-mono font-bold"
              >
                <span
                  className="inline-block w-3 h-3 border-2 border-foreground"
                  style={{ background: s.color }}
                />
                <span className="uppercase tracking-wider">
                  {s.label} {formatMoney(s.value)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* HOTTEST */}
        <Section
          label="Hottest"
          count={hottest.length}
          total={hottest.reduce((s, c) => s + c.price, 0)}
        >
          {hottest.length === 0 ? (
            <Card className="border-dashed p-6 text-center">
              <p className="font-mono font-bold uppercase text-xs text-muted-foreground">
                Pipeline is clean. Go knock.
              </p>
            </Card>
          ) : (
            <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {hottest.map((c) => (
                <DealRow
                  key={c.id}
                  card={c}
                  onOpen={() => openHouse(c)}
                  onCall={(e) => callPhone(e, c.phone)}
                  onNav={(e) => navigateMaps(e, c.address)}
                />
              ))}
            </ul>
          )}
        </Section>

        {/* PIPELINE */}
        <Section
          label="Pipeline"
          count={pipeline.length}
          total={pipeline.reduce((s, c) => s + c.price, 0)}
        >
          {pipeline.length === 0 ? (
            <Card className="border-dashed p-6 text-center">
              <p className="font-mono font-bold uppercase text-xs text-muted-foreground">
                No working deals
              </p>
            </Card>
          ) : (
            <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {pipeline.map((c) => (
                <DealRow
                  key={c.id}
                  card={c}
                  subLabel={
                    c.stage === "QUOTED"
                      ? `Quoted ${timeAgoLabel(c.daysSince)}`
                      : `Lead captured ${timeAgoLabel(c.daysSince)}`
                  }
                  onOpen={() => openHouse(c)}
                  onCall={(e) => callPhone(e, c.phone)}
                  onNav={(e) => navigateMaps(e, c.address)}
                />
              ))}
            </ul>
          )}
        </Section>

        {/* WON — collapsible */}
        <section>
          <button
            type="button"
            onClick={() => setWonOpen((v) => !v)}
            className="press-brutal w-full flex items-center justify-between border-2 border-foreground bg-card px-3 py-2"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.2em]">
                Won
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 border-2 border-foreground bg-background">
                {won.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tabular-nums">
                {formatMoney(won.reduce((s, c) => s + c.price, 0))}
              </span>
              {wonOpen ? (
                <ChevronUp className="w-4 h-4" strokeWidth={3} />
              ) : (
                <ChevronDown className="w-4 h-4" strokeWidth={3} />
              )}
            </div>
          </button>

          {wonOpen && (
            <ul className="space-y-2 mt-2">
              {won.length === 0 ? (
                <Card className="border-dashed p-6 text-center">
                  <p className="font-mono font-bold uppercase text-xs text-muted-foreground">
                    No recent closes
                  </p>
                </Card>
              ) : (
                won.map((c) => (
                  <DealRow
                    key={c.id}
                    card={c}
                    subLabel={`Won ${timeAgoLabel(c.daysSince)}`}
                    onOpen={() => openHouse(c)}
                    onCall={(e) => callPhone(e, c.phone)}
                    onNav={(e) => navigateMaps(e, c.address)}
                  />
                ))
              )}
            </ul>
          )}
        </section>
      </div>

      {selected && (
        <HouseDetail
          address={selected.address}
          initialName={selected.name}
          initialPhone={selected.phone}
          status={(selected.stage === "WON" ? "CUSTOMER" : selected.stage) as DetailStatus}
          onClose={() => setSelected(null)}
          onEditQuote={() => {
            const s = selected;
            setSelected(null);
            navigate({ to: "/quote", search: { address: s.address, mode: "quote" } });
          }}
        />
      )}
    </AppShell>
  );
}

/* ---------- Section header ---------- */
function Section({
  label,
  count,
  total,
  children,
}: {
  label: string;
  count: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em]">
            {label}
          </h2>
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 border-2 border-foreground bg-card">
            {count}
          </span>
        </div>
        <span className="font-mono font-bold text-sm tabular-nums">
          {formatMoney(total)}
        </span>
      </div>
      {children}
    </section>
  );
}

/* ---------- Deal row ---------- */
function DealRow({
  card,
  subLabel,
  onOpen,
  onCall,
  onNav,
}: {
  card: DealCard;
  subLabel?: string;
  onOpen: () => void;
  onCall: (e: React.MouseEvent) => void;
  onNav: (e: React.MouseEvent) => void;
}) {
  return (
    <li>
      <div className="flex items-stretch gap-2">
        {/* Card body */}
        <button
          type="button"
          onClick={onOpen}
          className="press-brutal flex-1 text-left border-2 border-foreground bg-card flex min-h-[72px]"
        >
          {/* Urgency stripe */}
          <span
            aria-hidden
            className={`w-1 shrink-0 border-r-2 border-foreground ${STRIPE_BG[card.stripe]}`}
          />
          <div className="flex-1 px-3 py-2 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-bold text-sm leading-tight truncate">
                {card.address}
              </h3>
              {card.price > 0 && (
                <span
                  className={`font-mono font-bold text-base leading-none tabular-nums shrink-0 ${
                    card.stage === "WON" ? "text-foreground" : ""
                  }`}
                >
                  {formatMoney(card.price)}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono opacity-80 truncate">
                {card.name}
              </span>
              <span className="shrink-0 px-1.5 py-px border-2 border-foreground font-mono font-bold text-[10px] uppercase tracking-wider bg-background">
                {card.stage}
              </span>
            </div>
            {(card.reason || subLabel) && (
              <p
                className={`mt-1 text-xs font-mono truncate ${
                  card.reason
                    ? "text-destructive font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {card.reason ?? subLabel}
              </p>
            )}
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onCall}
            disabled={!card.phone}
            aria-label="Call"
            className="press-brutal w-9 h-9 border-2 border-foreground bg-card flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
          >
            <Phone className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={onNav}
            aria-label="Navigate"
            className="press-brutal w-9 h-9 border-2 border-foreground bg-card flex items-center justify-center"
          >
            <Navigation className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </li>
  );
}
