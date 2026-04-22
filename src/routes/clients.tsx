import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, Input, SectionHeader } from "@/components/ui-brutal";
import { mockLeads, type Lead } from "@/lib/mock-data";
import { Search, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/clients")({
  component: ClientsPage,
});

const statusOrder: Lead["status"][] = ["hot", "warm", "cold", "won", "lost"];

const statusVariant: Record<Lead["status"], "destructive" | "accent" | "default" | "success" | "primary"> = {
  hot: "destructive",
  warm: "accent",
  cold: "default",
  won: "success",
  lost: "default",
};

function ClientsPage() {
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
      .sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
  }, [q, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: mockLeads.length };
    statusOrder.forEach((s) => {
      c[s] = mockLeads.filter((l) => l.status === s).length;
    });
    return c;
  }, []);

  return (
    <AppShell title="Clients" subtitle={`${mockLeads.length} total`}>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none z-10" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or address"
          className="pl-11"
        />
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
        {(["all", ...statusOrder] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`press-brutal shrink-0 px-3 py-1.5 border-2 border-foreground font-mono font-bold uppercase tracking-wider text-xs ${
              filter === s ? "bg-foreground text-background" : "bg-card"
            }`}
          >
            {s} · {counts[s] ?? 0}
          </button>
        ))}
      </div>

      <SectionHeader count={filtered.length}>Results</SectionHeader>

      <ul className="space-y-2">
        {filtered.map((lead) => (
          <Card as="li" key={lead.id} className="p-3 flex items-center gap-3">
            <div className="size-12 border-2 border-foreground bg-[var(--amber)] font-mono font-bold text-lg flex items-center justify-center shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-mono font-bold uppercase text-sm leading-none truncate">
                  {lead.name}
                </h3>
                <Badge variant={statusVariant[lead.status]}>{lead.status}</Badge>
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs font-mono text-muted-foreground truncate">
                <MapPin className="size-3 shrink-0" />
                {lead.address}
              </div>
              {lead.notes && (
                <p className="text-xs font-mono mt-1 truncate text-foreground/70">{lead.notes}</p>
              )}
            </div>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="press-brutal size-10 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center shrink-0"
              >
                <Phone className="size-4" strokeWidth={2.5} />
              </a>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card as="li" className="border-dashed p-8 text-center">
            <p className="font-mono font-bold uppercase">No matches</p>
          </Card>
        )}
      </ul>
    </AppShell>
  );
}
