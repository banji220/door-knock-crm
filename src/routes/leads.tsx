import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { mockLeads, type Lead } from "@/lib/mock-data";
import { Search, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/leads")({
  component: LeadsPage,
});

const statusOrder: Lead["status"][] = ["hot", "warm", "cold", "won", "lost"];

const statusCfg: Record<Lead["status"], { bg: string; label: string }> = {
  hot: { bg: "bg-destructive text-destructive-foreground", label: "HOT" },
  warm: { bg: "bg-amber text-ink", label: "WARM" },
  cold: { bg: "bg-card text-ink", label: "COLD" },
  won: { bg: "bg-success text-success-foreground", label: "WON" },
  lost: { bg: "bg-muted text-muted-foreground", label: "LOST" },
};

function LeadsPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Lead["status"] | "all">("all");

  const filtered = useMemo(() => {
    return mockLeads
      .filter((l) => filter === "all" || l.status === filter)
      .filter(
        (l) =>
          !q ||
          l.name.toLowerCase().includes(q.toLowerCase()) ||
          l.address.toLowerCase().includes(q.toLowerCase()),
      )
      .sort(
        (a, b) =>
          statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
      );
  }, [q, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mockLeads.length };
    statusOrder.forEach((s) => {
      c[s] = mockLeads.filter((l) => l.status === s).length;
    });
    return c;
  }, []);

  return (
    <AppShell title="Leads" subtitle={`${mockLeads.length} total`}>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or address"
          className="w-full border-brutal-thick bg-card pl-11 pr-4 py-3 text-base font-mono focus:outline-none focus:bg-amber/20"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        {(["all", ...statusOrder] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 border-2 border-ink font-display uppercase text-xs press-brutal ${
              filter === s ? "bg-ink text-cream" : "bg-card"
            }`}
          >
            {s} · {counts[s] ?? 0}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((lead) => (
          <li
            key={lead.id}
            className="border-brutal-thick bg-card p-3 flex items-center gap-3"
          >
            <div className="size-12 border-2 border-ink bg-amber font-display text-lg flex items-center justify-center shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display uppercase text-base leading-none truncate">
                  {lead.name}
                </h3>
                <span
                  className={`text-[10px] font-display uppercase px-1.5 py-0.5 border-2 border-ink shrink-0 ${statusCfg[lead.status].bg}`}
                >
                  {statusCfg[lead.status].label}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs font-mono text-muted-foreground truncate">
                <MapPin className="size-3 shrink-0" />
                {lead.address}
              </div>
              {lead.notes && (
                <p className="text-xs mt-1 truncate text-ink/70">{lead.notes}</p>
              )}
            </div>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="size-10 border-2 border-ink bg-amber press-brutal flex items-center justify-center shrink-0"
              >
                <Phone className="size-4" strokeWidth={2.5} />
              </a>
            )}
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="border-brutal-thick border-dashed bg-card p-8 text-center">
            <p className="font-display uppercase">No matches</p>
          </li>
        )}
      </ul>
    </AppShell>
  );
}
