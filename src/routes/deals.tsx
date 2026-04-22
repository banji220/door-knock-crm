import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, SectionHeader } from "@/components/ui-brutal";
import { mockLeads, mockQuotes, type Lead } from "@/lib/mock-data";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

const stages = [
  { key: "hot", label: "Hot", desc: "Ready to close" },
  { key: "warm", label: "Warm", desc: "Quoted, deciding" },
  { key: "cold", label: "Cold", desc: "Initial contact" },
  { key: "won", label: "Won", desc: "Booked" },
  { key: "lost", label: "Lost", desc: "Declined" },
] as const;

type Stage = (typeof stages)[number]["key"];

const stageVariant: Record<Stage, "destructive" | "accent" | "default" | "success" | "primary"> = {
  hot: "destructive",
  warm: "accent",
  cold: "default",
  won: "success",
  lost: "default",
};

function DealsPage() {
  const [active, setActive] = useState<Stage>("hot");

  const grouped = useMemo(() => {
    const g: Record<Stage, Lead[]> = { hot: [], warm: [], cold: [], won: [], lost: [] };
    mockLeads.forEach((l) => g[l.status].push(l));
    return g;
  }, []);

  const quoteFor = (address: string) =>
    mockQuotes.find((q) => q.address === address);

  const pipelineTotal = mockQuotes
    .filter((q) => q.status === "sent")
    .reduce((s, q) => s + q.price, 0);
  const wonTotal = mockQuotes
    .filter((q) => q.status === "accepted")
    .reduce((s, q) => s + q.price, 0);

  const list = grouped[active];

  return (
    <AppShell title="Deals" subtitle="Pipeline">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <Card className="p-3 bg-[var(--amber)]">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] opacity-70">Pipeline</div>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">£{pipelineTotal}</div>
        </Card>
        <Card className="p-3 bg-foreground text-background">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] opacity-70">Won</div>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">£{wonTotal}</div>
        </Card>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto -mx-4 px-4 pb-1">
        {stages.map((s) => {
          const count = grouped[s.key].length;
          const isActive = s.key === active;
          return (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`press-brutal shrink-0 border-2 border-foreground px-3 py-2 font-mono font-bold uppercase tracking-wider text-xs flex items-center gap-2 ${
                isActive ? "bg-foreground text-background" : "bg-card"
              }`}
            >
              {s.label}
              <span
                className={`min-w-[20px] h-[18px] px-1 border-2 border-foreground font-mono font-bold text-[10px] flex items-center justify-center leading-none ${
                  isActive ? "bg-background text-foreground" : "bg-card"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage description */}
      <SectionHeader count={list.length}>
        {stages.find((s) => s.key === active)!.desc}
      </SectionHeader>

      <ul className="space-y-2">
        {list.map((lead) => {
          const q = quoteFor(lead.address);
          return (
            <Link
              key={lead.id}
              to="/clients"
              className="block press-brutal"
            >
              <Card className="p-3 flex items-center gap-3">
                <div className="size-12 border-2 border-foreground bg-[var(--amber)] font-mono font-bold text-lg flex items-center justify-center shrink-0">
                  {lead.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-mono font-bold uppercase text-sm leading-none truncate">
                      {lead.name}
                    </h3>
                    <Badge variant={stageVariant[lead.status]}>{lead.status}</Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-1 truncate">
                    {lead.address}
                  </p>
                  {q && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-mono font-bold text-base">£{q.price}</span>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                        {q.frequency}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight className="size-5 shrink-0" strokeWidth={2.5} />
              </Card>
            </Link>
          );
        })}
        {list.length === 0 && (
          <Card as="li" className="border-dashed p-8 text-center">
            <p className="font-mono font-bold uppercase text-sm">No {active} deals</p>
          </Card>
        )}
      </ul>
    </AppShell>
  );
}
