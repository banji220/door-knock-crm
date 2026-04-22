import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Label, SectionHeader, Input, Badge } from "@/components/ui-brutal";
import { mockKnocks, todayStats, type KnockOutcome } from "@/lib/mock-data";
import { Check, X, Phone, FileText, HelpCircle, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: KnockPage,
});

const outcomes: { key: KnockOutcome; label: string; icon: typeof Check; cls: string }[] = [
  { key: "booked", label: "Booked", icon: Check, cls: "bg-[var(--success)] text-[var(--success-foreground)]" },
  { key: "quoted", label: "Quoted", icon: FileText, cls: "bg-[var(--amber)] text-foreground" },
  { key: "callback", label: "Callback", icon: Phone, cls: "bg-[var(--warning)] text-foreground" },
  { key: "no-answer", label: "No Answer", icon: HelpCircle, cls: "bg-card text-foreground" },
];

const badgeVariantMap: Record<KnockOutcome, "default" | "primary" | "accent" | "destructive" | "success"> = {
  booked: "success",
  quoted: "accent",
  callback: "accent",
  "no-answer": "default",
  "not-interested": "destructive",
};
const badgeLabel: Record<KnockOutcome, string> = {
  booked: "Booked",
  quoted: "Quoted",
  callback: "Callback",
  "no-answer": "No Ans",
  "not-interested": "Pass",
};

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
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-foreground/70">
            Knocks
          </div>
          <div className="text-3xl font-mono font-bold leading-none mt-0.5">
            {knocks.length}
          </div>
        </div>
      }
    >
      {/* Stats — 3 cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Card className="p-3">
          <Label className="text-[10px] tracking-[0.15em]">Quoted</Label>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">{todayStats.quoted}</div>
        </Card>
        <Card className="p-3 bg-foreground text-background">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] opacity-70">Booked</div>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">{todayStats.booked}</div>
        </Card>
        <Card className="p-3">
          <Label className="text-[10px] tracking-[0.15em]">Pipeline</Label>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">£{todayStats.pipeline}</div>
        </Card>
      </div>

      {/* Address input */}
      <div className="mb-3">
        <Label htmlFor="addr" className="mb-1">Door / Address</Label>
        <Input
          id="addr"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={`24 ${streetMode}`}
        />
      </div>

      {/* Outcome buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {outcomes.map(({ key, label, icon: Icon, cls }) => (
          <button
            key={key}
            onClick={() => logKnock(key)}
            className={`press-brutal border-2 border-foreground py-5 flex flex-col items-center gap-2 font-mono font-bold uppercase tracking-wider text-sm ${cls}`}
          >
            <Icon className="size-7" strokeWidth={2.5} />
            {label}
          </button>
        ))}
      </div>
      <Button
        variant="destructive"
        block
        onClick={() => logKnock("not-interested")}
        className="mb-6 py-4"
      >
        <X className="size-5" strokeWidth={3} />
        Not Interested
      </Button>

      {/* Recent knocks */}
      <SectionHeader
        count={knocks.length}
        action={
          <Link
            to="/quote"
            className="press-brutal inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-wider px-2 py-1 border-2 border-foreground bg-[var(--amber)] text-foreground"
          >
            <Plus className="size-3" strokeWidth={3} />
            Quote
          </Link>
        }
      >
        Recent
      </SectionHeader>

      <ul className="space-y-2">
        {knocks.slice(0, 12).map((k) => (
          <Card as="li" key={k.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-mono text-sm font-bold truncate">{k.address}</div>
              {k.notes && (
                <div className="text-xs font-mono text-muted-foreground truncate">{k.notes}</div>
              )}
            </div>
            <Badge variant={badgeVariantMap[k.outcome]}>{badgeLabel[k.outcome]}</Badge>
          </Card>
        ))}
      </ul>

      {/* Street switch */}
      <SectionHeader>Current Street</SectionHeader>
      <Card>
        <input
          value={streetMode}
          onChange={(e) => setStreetMode(e.target.value)}
          className="w-full bg-transparent text-lg font-mono font-bold uppercase focus:outline-none"
        />
      </Card>
    </AppShell>
  );
}
