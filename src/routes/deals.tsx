import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui-brutal";
import { mockLeads, mockQuotes, mockJobs, type Lead } from "@/lib/mock-data";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

const MS_PER_DAY = 86_400_000;

type DealCardData = {
  id: string;
  address: string;
  name: string;
  price?: number;
  daysSince: number;
  freq?: string;
};

function daysAgo(iso: string) {
  return Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / MS_PER_DAY),
  );
}

function DealsPage() {
  const navigate = useNavigate();

  const lanes = useMemo(() => {
    const quoteByAddr = new Map(mockQuotes.map((q) => [q.address, q]));
    const jobByAddr = new Map(mockJobs.map((j) => [j.address, j]));

    const toCard = (l: Lead): DealCardData => {
      const q = quoteByAddr.get(l.address);
      const j = jobByAddr.get(l.address);
      return {
        id: l.id,
        address: l.address,
        name: l.name,
        price: j?.price ?? q?.price,
        daysSince: daysAgo(l.lastContact),
        freq: q?.frequency,
      };
    };

    const leads = mockLeads
      .filter((l) => l.status === "cold" || l.status === "hot")
      .map(toCard);
    const quoted = mockLeads
      .filter((l) => l.status === "warm")
      .map(toCard);
    const won = mockLeads
      .filter((l) => l.status === "won")
      .map(toCard);

    return [
      {
        key: "leads", title: "Leads", desc: "Knocked, no quote yet",
        accent: "bg-card", items: leads,
      },
      {
        key: "quoted", title: "Quoted", desc: "Awaiting decision",
        accent: "bg-[var(--amber)]", items: quoted,
      },
      {
        key: "won", title: "Won", desc: "Customers",
        accent: "bg-foreground text-background", items: won,
      },
    ] as const;
  }, []);

  const totalPipeline = lanes
    .find((l) => l.key === "quoted")!
    .items.reduce((s, c) => s + (c.price ?? 0), 0);
  const totalWon = lanes
    .find((l) => l.key === "won")!
    .items.reduce((s, c) => s + (c.price ?? 0), 0);

  const openHouse = (address: string) => {
    navigate({ to: "/quote", search: { address, mode: "quote" } });
  };

  return (
    <AppShell title="Deals" subtitle={`Pipeline £${totalPipeline} · Won £${totalWon}`}>
      <div className="space-y-5">
        {lanes.map((lane) => (
          <section key={lane.key}>
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-foreground">
                  {lane.title}
                </h2>
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 border-2 border-foreground bg-card">
                  {lane.items.length}
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                {lane.desc}
              </span>
            </div>

            {lane.items.length === 0 ? (
              <Card className="border-dashed p-6 text-center">
                <p className="font-mono font-bold uppercase text-xs text-muted-foreground">
                  No {lane.title.toLowerCase()}
                </p>
              </Card>
            ) : (
              <div className="-mx-4 overflow-x-auto px-4 pb-1">
                <ul className="flex gap-2 snap-x snap-mandatory">
                  {lane.items.map((c) => (
                    <li
                      key={c.id}
                      className="snap-start shrink-0 w-[78%] max-w-[300px]"
                    >
                      <button
                        onClick={() => openHouse(c.address)}
                        className={`press-brutal w-full text-left border-2 border-foreground p-3 ${lane.accent}`}
                      >
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <h3 className="font-mono font-bold uppercase text-sm leading-none truncate">
                            {c.address}
                          </h3>
                          {c.price !== undefined && (
                            <span className="font-mono font-bold text-lg leading-none tabular-nums">
                              £{c.price}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono opacity-80 truncate">
                          {c.name}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.15em]">
                          <span className="opacity-70">
                            {c.freq ?? "—"}
                          </span>
                          <span
                            className={
                              c.daysSince >= 5
                                ? "text-destructive font-bold"
                                : "opacity-70"
                            }
                          >
                            {c.daysSince === 0
                              ? "Today"
                              : `${c.daysSince}d ago`}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </AppShell>
  );
}
