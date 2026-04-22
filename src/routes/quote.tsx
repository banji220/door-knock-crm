import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
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
      <div className="border-brutal-thick shadow-brutal-lg bg-amber p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-2 right-3 text-[10px] font-mono uppercase tracking-wider text-ink/70">
          Live · {frequency}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink/80">
          Price
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-7xl font-display leading-none">£{price}</span>
          <span className="text-sm font-mono text-ink/70">
            {frequency === "one-off" ? "" : "/visit"}
          </span>
        </div>
        <div className="mt-2 text-xs font-mono">
          {windows} windows · base £{15 + windows * 2.5}
        </div>
      </div>

      {/* Address + name */}
      <div className="space-y-3 mb-5">
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Address
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 24 Oak Street"
            className="w-full mt-1 border-brutal-thick bg-card px-4 py-3 text-lg font-mono focus:outline-none focus:bg-amber/20"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Name (optional)
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah"
            className="w-full mt-1 border-brutal-thick bg-card px-4 py-3 text-lg font-mono focus:outline-none focus:bg-amber/20"
          />
        </div>
      </div>

      {/* Window stepper */}
      <div className="border-brutal-thick bg-card p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Windows
            </div>
            <div className="text-4xl font-display leading-none">{windows}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWindows(Math.max(1, windows - 1))}
              className="size-14 border-brutal-thick bg-cream press-brutal flex items-center justify-center"
              aria-label="Decrease"
            >
              <Minus className="size-7" strokeWidth={3} />
            </button>
            <button
              onClick={() => setWindows(windows + 1)}
              className="size-14 border-brutal-thick bg-amber-deep text-cream press-brutal flex items-center justify-center"
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
              className={`py-2 border-2 border-ink font-mono font-bold text-sm press-brutal ${
                windows === n ? "bg-ink text-cream" : "bg-cream"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Frequency */}
      <div className="mb-5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Frequency
        </div>
        <div className="grid grid-cols-2 gap-2">
          {frequencies.map((f) => (
            <button
              key={f.key}
              onClick={() => setFrequency(f.key)}
              className={`py-3 border-brutal-thick font-display uppercase text-sm press-brutal ${
                frequency === f.key ? "bg-ink text-cream shadow-brutal-sm" : "bg-card"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Extras */}
      <div className="mb-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Add-ons
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setExtras({ ...extras, conservatory: !extras.conservatory })}
            className={`py-3 border-brutal-thick font-display uppercase text-sm press-brutal ${
              extras.conservatory ? "bg-amber shadow-brutal-sm" : "bg-card"
            }`}
          >
            + Conservatory £10
          </button>
          <button
            onClick={() => setExtras({ ...extras, frames: !extras.frames })}
            className={`py-3 border-brutal-thick font-display uppercase text-sm press-brutal ${
              extras.frames ? "bg-amber shadow-brutal-sm" : "bg-card"
            }`}
          >
            + Frames £8
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 sticky bottom-24">
        <button
          onClick={handleSave}
          className="border-brutal-thick shadow-brutal bg-cream press-brutal py-4 flex items-center justify-center gap-2 font-display uppercase"
        >
          <Save className="size-5" strokeWidth={2.5} />
          Save
        </button>
        <button
          onClick={handleSave}
          className="border-brutal-thick shadow-brutal bg-success text-success-foreground press-brutal py-4 flex items-center justify-center gap-2 font-display uppercase"
        >
          <Send className="size-5" strokeWidth={2.5} />
          Send
        </button>
      </div>
    </AppShell>
  );
}
