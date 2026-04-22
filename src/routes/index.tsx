import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { mockKnocks, todayStats, type KnockOutcome } from "@/lib/mock-data";
import { Check, X, Phone, FileText, HelpCircle, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: KnockPage,
});

const outcomes: { key: KnockOutcome; label: string; icon: typeof Check; cls: string }[] = [
  { key: "booked", label: "Booked", icon: Check, cls: "bg-success text-success-foreground" },
  { key: "quoted", label: "Quoted", icon: FileText, cls: "bg-amber text-ink" },
  { key: "callback", label: "Callback", icon: Phone, cls: "bg-warning text-ink" },
  { key: "no-answer", label: "No Answer", icon: HelpCircle, cls: "bg-card text-ink" },
  { key: "not-interested", label: "Pass", icon: X, cls: "bg-destructive text-destructive-foreground" },
];

function outcomeBadge(o: KnockOutcome) {
  const map: Record<KnockOutcome, string> = {
    booked: "bg-success text-success-foreground",
    quoted: "bg-amber text-ink",
    callback: "bg-warning text-ink",
    "no-answer": "bg-muted text-ink",
    "not-interested": "bg-destructive text-destructive-foreground",
  };
  const labels: Record<KnockOutcome, string> = {
    booked: "BOOKED",
    quoted: "QUOTED",
    callback: "CALLBACK",
    "no-answer": "NO ANSWER",
    "not-interested": "PASS",
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-display uppercase border-2 border-ink ${map[o]}`}>
      {labels[o]}
    </span>
  );
}

function KnockPage() {
  const [address, setAddress] = useState("");
  const [knocks, setKnocks] = useState(mockKnocks);
  const [streetMode, setStreetMode] = useState("Oak Street");

  const logKnock = (outcome: KnockOutcome) => {
    const addr = address.trim() || `Door ${knocks.length + 1}, ${streetMode}`;
    setKnocks([
      { id: crypto.randomUUID(), address: addr, outcome, timestamp: new Date().toISOString() },
      ...knocks,
    ]);
    setAddress("");
    if (navigator.vibrate) navigator.vibrate(20);
  };

  return (
    <AppShell
      title="Knock"
      subtitle={`Today · ${streetMode}`}
      right={
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase opacity-70">Knocks</div>
          <div className="text-3xl font-display leading-none">{knocks.length}</div>
        </div>
      }
    >
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <StatTile label="Quoted" value={todayStats.quoted} />
        <StatTile label="Booked" value={todayStats.booked} accent />
        <StatTile label="Pipeline" value={`£${todayStats.pipeline}`} />
      </div>

      {/* Address input */}
      <div className="mb-3">
        <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Door / Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={`e.g. 24 ${streetMode}`}
          className="w-full mt-1 border-brutal-thick bg-card px-4 py-3 text-lg font-mono placeholder:text-muted-foreground focus:outline-none focus:bg-amber/20"
        />
      </div>

      {/* Outcome buttons — thumb zone */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {outcomes.slice(0, 4).map(({ key, label, icon: Icon, cls }) => (
          <button
            key={key}
            onClick={() => logKnock(key)}
            className={`press-brutal border-brutal-thick shadow-brutal py-5 flex flex-col items-center gap-2 ${cls}`}
          >
            <Icon className="size-7" strokeWidth={2.5} />
            <span className="font-display uppercase text-base">{label}</span>
          </button>
        ))}
        <button
          onClick={() => logKnock("not-interested")}
          className="press-brutal border-brutal-thick shadow-brutal py-4 flex items-center justify-center gap-3 col-span-2 bg-destructive text-destructive-foreground"
        >
          <X className="size-6" strokeWidth={3} />
          <span className="font-display uppercase text-base">Not Interested</span>
        </button>
      </div>

      {/* Recent knocks */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-display uppercase">Recent</h2>
        <Link
          to="/quote"
          className="text-xs font-display uppercase tracking-wider px-2 py-1 border-2 border-ink bg-amber press-brutal flex items-center gap-1"
        >
          <Plus className="size-3" strokeWidth={3} />
          Quote
        </Link>
      </div>
      <ul className="space-y-2">
        {knocks.slice(0, 12).map((k) => (
          <li
            key={k.id}
            className="border-brutal bg-card px-3 py-2.5 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="font-mono text-sm font-medium truncate">{k.address}</div>
              {k.notes && (
                <div className="text-xs text-muted-foreground truncate">{k.notes}</div>
              )}
            </div>
            {outcomeBadge(k.outcome)}
          </li>
        ))}
      </ul>

      {/* Street switch */}
      <div className="mt-6 border-brutal bg-card p-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Current street
        </div>
        <input
          value={streetMode}
          onChange={(e) => setStreetMode(e.target.value)}
          className="w-full mt-1 bg-transparent text-lg font-display uppercase focus:outline-none"
        />
      </div>
    </AppShell>
  );
}
