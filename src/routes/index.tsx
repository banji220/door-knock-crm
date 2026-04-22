import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, Button, Label, SectionHeader, Input, Badge } from "@/components/ui-brutal";
import {
  mockKnocks, mockFollowUps, mockJobs, todayStats, type KnockOutcome,
} from "@/lib/mock-data";
import { Check, X, Phone, FileText, HelpCircle, Plus, MapPin } from "lucide-react";

export const Route = createFileRoute("/")({
  component: TodayPage,
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

function TodayPage() {
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

  const todayJobs = mockJobs.filter(
    (j) => new Date(j.scheduledFor).toDateString() === new Date().toDateString(),
  );
  const overdueChase = mockFollowUps.filter((f) => {
    const d = new Date(f.dueDate);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d.getTime() <= t.getTime();
  });

  const fullDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const pendingActions = overdueChase.length + todayJobs.filter((j) => j.status === "scheduled").length;

  return (
    <AppShell
      header={
        <PageHeader
          eyebrow="Today"
          title={fullDate}
          meta={
            <>
              <span className="font-bold text-foreground">{knocks.length}</span> doors knocked ·{" "}
              <span className="font-bold text-foreground">{pendingActions}</span> actions pending
            </>
          }
          action={
            <div className="text-right border-2 border-foreground bg-[var(--amber)] px-3 py-1.5">
              <div className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-foreground/70 leading-none">
                Booked
              </div>
              <div className="text-2xl font-mono font-bold leading-none mt-1">
                {todayStats.booked}
              </div>
            </div>
          }
        />
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
          <Label className="text-[10px] tracking-[0.15em]">Pipe</Label>
          <div className="text-3xl font-mono font-bold mt-1 leading-none">£{todayStats.pipeline}</div>
        </Card>
      </div>

      {/* Quick log */}
      <SectionHeader>Log A Knock</SectionHeader>
      <div className="mb-3">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={`24 ${streetMode}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
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

      {/* Today's jobs */}
      <SectionHeader count={todayJobs.length}>Jobs Today</SectionHeader>
      <ul className="space-y-2 mb-6">
        {todayJobs.map((j) => (
          <Card as="li" key={j.id} className="p-3 flex items-center gap-3">
            <div className="size-9 border-2 border-foreground bg-background flex items-center justify-center font-mono font-bold text-base shrink-0">
              {j.routeOrder}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono font-bold uppercase text-sm leading-none">
                {j.customerName}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs font-mono text-muted-foreground truncate">
                <MapPin className="size-3" />{j.address}
              </div>
            </div>
            <span className="font-mono font-bold text-lg">£{j.price}</span>
          </Card>
        ))}
        {todayJobs.length === 0 && (
          <Card as="li" className="border-dashed p-4 text-center">
            <p className="font-mono text-xs text-muted-foreground uppercase">No jobs booked today</p>
          </Card>
        )}
      </ul>

      {/* Chase queue */}
      <SectionHeader count={overdueChase.length}>Chase Queue</SectionHeader>
      <ul className="space-y-2 mb-6">
        {overdueChase.slice(0, 3).map((f) => (
          <Card as="li" key={f.id} className="p-3">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3 className="font-mono font-bold uppercase text-sm">{f.leadName}</h3>
              <Badge variant={f.priority === "high" ? "destructive" : "accent"}>
                {f.priority}
              </Badge>
            </div>
            <p className="text-xs font-mono text-muted-foreground">{f.reason}</p>
          </Card>
        ))}
      </ul>

      {/* Recent knocks */}
      <SectionHeader count={knocks.length}>Recent Knocks</SectionHeader>
      <ul className="space-y-2 mb-6">
        {knocks.slice(0, 6).map((k) => (
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

      {/* Street + Quote shortcut */}
      <SectionHeader>Current Street</SectionHeader>
      <Card className="mb-4">
        <input
          value={streetMode}
          onChange={(e) => setStreetMode(e.target.value)}
          className="w-full bg-transparent text-lg font-mono font-bold uppercase focus:outline-none"
        />
      </Card>
      <Link
        to="/quote"
        className="press-brutal block w-full border-2 border-foreground bg-foreground text-background py-4 text-center font-mono font-bold uppercase tracking-wider"
      >
        <Plus className="inline size-5 mr-2 -mt-1" strokeWidth={3} />
        New Quote
      </Link>
    </AppShell>
  );
}
