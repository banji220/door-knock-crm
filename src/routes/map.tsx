import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Badge, Input, SectionHeader, Button } from "@/components/ui-brutal";
import { mockKnocks, type KnockOutcome } from "@/lib/mock-data";
import { Locate, Plus, Layers } from "lucide-react";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

/* House on the street grid */
type House = {
  number: number;
  side: "left" | "right";
  outcome?: KnockOutcome | "untouched";
};

const heatFor = (o: House["outcome"]): string => {
  switch (o) {
    case "booked": return "heatmap-5 text-background";
    case "quoted": return "heatmap-4 text-background";
    case "callback": return "heatmap-3";
    case "no-answer": return "heatmap-1";
    case "not-interested": return "bg-card";
    default: return "heatmap-0";
  }
};

const labelFor = (o: House["outcome"]): string => {
  switch (o) {
    case "booked": return "B";
    case "quoted": return "Q";
    case "callback": return "C";
    case "no-answer": return "·";
    case "not-interested": return "✕";
    default: return "";
  }
};

function MapPage() {
  const [street, setStreet] = useState("Oak Street");
  const [start] = useState(2);
  const [count] = useState(28);
  const [selected, setSelected] = useState<House | null>(null);

  // Build the street as a 2-column grid, evens left, odds right
  const houses: House[] = useMemo(() => {
    const knockMap = new Map<string, KnockOutcome>();
    mockKnocks.forEach((k) => {
      const m = k.address.match(/^(\d+)/);
      if (m) knockMap.set(m[1], k.outcome);
    });
    const arr: House[] = [];
    for (let i = 0; i < count; i++) {
      const number = start + i;
      const side = number % 2 === 0 ? "left" : "right";
      arr.push({
        number,
        side,
        outcome: knockMap.get(String(number)) ?? "untouched",
      });
    }
    return arr;
  }, [start, count]);

  const left = houses.filter((h) => h.side === "left");
  const right = houses.filter((h) => h.side === "right");

  const stats = useMemo(() => {
    let knocked = 0, booked = 0, quoted = 0;
    houses.forEach((h) => {
      if (h.outcome && h.outcome !== "untouched") knocked++;
      if (h.outcome === "booked") booked++;
      if (h.outcome === "quoted") quoted++;
    });
    return { knocked, booked, quoted, total: houses.length };
  }, [houses]);

  return (
    <AppShell
      title="Map"
      subtitle={`${street} · ${stats.knocked}/${stats.total} knocked`}
      right={
        <button className="press-brutal size-10 border-2 border-foreground bg-card flex items-center justify-center">
          <Layers className="size-5" strokeWidth={2.5} />
        </button>
      }
    >
      {/* Street selector */}
      <div className="mb-3 flex gap-2">
        <Input
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className="flex-1 text-base"
        />
        <button className="press-brutal size-[52px] border-2 border-foreground bg-foreground text-background flex items-center justify-center shrink-0">
          <Locate className="size-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="p-2.5">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground">Knocked</div>
          <div className="text-2xl font-mono font-bold mt-0.5 leading-none">{stats.knocked}</div>
        </Card>
        <Card className="p-2.5">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground">Quoted</div>
          <div className="text-2xl font-mono font-bold mt-0.5 leading-none">{stats.quoted}</div>
        </Card>
        <Card className="p-2.5 bg-foreground text-background">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] opacity-70">Booked</div>
          <div className="text-2xl font-mono font-bold mt-0.5 leading-none">{stats.booked}</div>
        </Card>
      </div>

      {/* Street grid: two columns of houses with road in middle */}
      <div className="border-2 border-foreground bg-card p-3 mb-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 px-2 bg-card border-2 border-foreground">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">{street} ↑</span>
        </div>
        <div className="grid grid-cols-[1fr_24px_1fr] gap-1.5 pt-2">
          {/* left col (evens) */}
          <div className="space-y-1.5">
            {left.map((h) => (
              <HouseCell key={h.number} house={h} onClick={() => setSelected(h)} />
            ))}
          </div>
          {/* road */}
          <div
            className="border-x-2 border-foreground bg-[repeating-linear-gradient(0deg,transparent_0_8px,var(--foreground)_8px_14px)]"
            aria-hidden
          />
          {/* right col (odds) */}
          <div className="space-y-1.5">
            {right.map((h) => (
              <HouseCell key={h.number} house={h} onClick={() => setSelected(h)} />
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap legend */}
      <SectionHeader>Density</SectionHeader>
      <div className="border-2 border-foreground bg-card p-3 mb-4">
        <div className="heatmap-bar h-3 border-2 border-foreground" />
        <div className="flex justify-between mt-2 text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground">
          <span>None</span>
          <span>Low</span>
          <span>Quoted</span>
          <span>Booked</span>
          <span>Hot</span>
        </div>
      </div>

      {/* Selected house — bottom panel */}
      {selected && (
        <Card className="p-4 mb-4 bg-[var(--amber)]/30">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <h3 className="font-mono font-bold uppercase text-base">
              {selected.number} {street}
            </h3>
            <Badge
              variant={
                selected.outcome === "booked" ? "success"
                  : selected.outcome === "quoted" ? "accent"
                    : selected.outcome === "not-interested" ? "destructive"
                      : "default"
              }
            >
              {selected.outcome === "untouched" ? "New" : selected.outcome}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/quote"
              className="press-brutal border-2 border-foreground bg-foreground text-background py-3 text-center font-mono font-bold uppercase tracking-wider text-xs"
            >
              <Plus className="inline size-4 mr-1 -mt-0.5" strokeWidth={3} />
              Quote
            </Link>
            <Link
              to="/"
              className="press-brutal border-2 border-foreground bg-card py-3 text-center font-mono font-bold uppercase tracking-wider text-xs"
            >
              Log Knock
            </Link>
          </div>
        </Card>
      )}

      <Button variant="primary" block className="py-4">
        <Plus className="size-5" strokeWidth={3} />
        Add Street
      </Button>
    </AppShell>
  );
}

function HouseCell({ house, onClick }: { house: House; onClick: () => void }) {
  const heat = heatFor(house.outcome);
  const isStrong = house.outcome === "booked" || house.outcome === "quoted";
  return (
    <button
      onClick={onClick}
      className={`press-brutal w-full border-2 border-foreground py-2 px-1 flex items-center justify-between font-mono font-bold ${heat}`}
    >
      <span className="text-sm leading-none">{house.number}</span>
      {labelFor(house.outcome) && (
        <span className={`text-xs leading-none ${isStrong ? "" : "text-foreground/70"}`}>
          {labelFor(house.outcome)}
        </span>
      )}
    </button>
  );
}
