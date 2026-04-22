import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, Button, Label, Input } from "@/components/ui-brutal";
import { Minus, Plus, Send, Save } from "lucide-react";

export const Route = createFileRoute("/quote")({
  component: QuotePage,
});

const frequencies = [
  { key: "one-off", label: "One-Off", multiplier: 1 },
  { key: "monthly", label: "Monthly", multiplier: 1 },
  { key: "bi-monthly", label: "6-Weekly", multiplier: 1.15 },
  { key: "quarterly", label: "Quarterly", multiplier: 1.4 },
] as const;

type Freq = (typeof frequencies)[number]["key"];

function QuotePage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [windows, setWindows] = useState(8);
  const [frequency, setFrequency] = useState<Freq>("monthly");
  const [extras, setExtras] = useState({ conservatory: false, frames: false });

  const price = useMemo(() => {
    const freq = frequencies.find((f) => f.key === frequency)!;
    let base = 15 + windows * 2.5;
    base *= freq.multiplier;
    if (extras.conservatory) base += 10;
    if (extras.frames) base += 8;
    return Math.round(base);
  }, [windows, frequency, extras]);

  const handleSave = () => {
    if (navigator.vibrate) navigator.vibrate(30);
    navigate({ to: "/leads" });
  };

  return (
    <AppShell title="Quote" subtitle="30 seconds flat">
      {/* Live price card */}
      <Card className="bg-[var(--amber)] p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-2 right-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-foreground/70">
          Live · {frequency}
        </div>
        <Label className="text-foreground/80">Price</Label>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-7xl font-mono font-bold leading-none">£{price}</span>
          <span className="text-sm font-mono text-foreground/70">
            {frequency === "one-off" ? "" : "/visit"}
          </span>
        </div>
        <div className="mt-2 text-xs font-mono">
          {windows} windows · base £{15 + windows * 2.5}
        </div>
      </Card>

      {/* Address + name */}
      <div className="space-y-3 mb-5">
        <div>
          <Label htmlFor="addr" className="mb-1">Address</Label>
          <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="24 Oak Street" />
        </div>
        <div>
          <Label htmlFor="nm" className="mb-1">Name (optional)</Label>
          <Input id="nm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah" />
        </div>
      </div>

      {/* Window stepper */}
      <Card className="p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Label>Windows</Label>
            <div className="text-4xl font-mono font-bold leading-none mt-1">{windows}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWindows(Math.max(1, windows - 1))}
              className="press-brutal size-14 border-2 border-foreground bg-background flex items-center justify-center"
              aria-label="Decrease"
            >
              <Minus className="size-7" strokeWidth={3} />
            </button>
            <button
              onClick={() => setWindows(windows + 1)}
              className="press-brutal size-14 border-2 border-foreground bg-foreground text-background flex items-center justify-center"
              aria-label="Increase"
            >
              <Plus className="size-7" strokeWidth={3} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {[4, 6, 8, 10, 12].map((n) => (
            <button
              key={n}
              onClick={() => setWindows(n)}
              className={`press-brutal py-2 border-2 border-foreground font-mono font-bold text-sm ${
                windows === n ? "bg-foreground text-background" : "bg-background"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Card>

      {/* Frequency */}
      <Label className="mb-2">Frequency</Label>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {frequencies.map((f) => (
          <button
            key={f.key}
            onClick={() => setFrequency(f.key)}
            className={`press-brutal py-3 border-2 border-foreground font-mono font-bold uppercase tracking-wider text-sm ${
              frequency === f.key ? "bg-foreground text-background" : "bg-card"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Extras */}
      <Label className="mb-2">Add-ons</Label>
      <div className="grid grid-cols-2 gap-2 mb-6">
        <button
          onClick={() => setExtras({ ...extras, conservatory: !extras.conservatory })}
          className={`press-brutal py-3 border-2 border-foreground font-mono font-bold uppercase tracking-wider text-xs ${
            extras.conservatory ? "bg-[var(--amber)]" : "bg-card"
          }`}
        >
          + Conservatory £10
        </button>
        <button
          onClick={() => setExtras({ ...extras, frames: !extras.frames })}
          className={`press-brutal py-3 border-2 border-foreground font-mono font-bold uppercase tracking-wider text-xs ${
            extras.frames ? "bg-[var(--amber)]" : "bg-card"
          }`}
        >
          + Frames £8
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={handleSave} className="py-4">
          <Save className="size-5" strokeWidth={2.5} />
          Save
        </Button>
        <Button variant="primary" onClick={handleSave} className="py-4 bg-[var(--success)] text-[var(--success-foreground)]">
          <Send className="size-5" strokeWidth={2.5} />
          Send
        </Button>
      </div>
    </AppShell>
  );
}
