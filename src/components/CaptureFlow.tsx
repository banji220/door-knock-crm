import { useState, useRef, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, X } from "lucide-react";

export type CaptureMode = "quote" | "follow-up";

export type CaptureData = {
  /* WHO */
  name: string;
  phone: string;
  email: string;
  /* WHEN */
  date: string | null; // ISO date YYYY-MM-DD
  time: string | null; // "9AM"…
  /* WHAT */
  windows: number;
  services: string[]; // e.g. ["Exterior", "Screens"]
  price: number;
  priceOverridden: boolean;
  /* NOTES */
  tags: string[];
  notes: string;
};

const EMPTY: CaptureData = {
  name: "", phone: "", email: "",
  date: null, time: null,
  windows: 8, services: ["Exterior"], price: 0, priceOverridden: false,
  tags: [], notes: "",
};

type Props = {
  address: string;
  mode?: CaptureMode;
  initial?: Partial<CaptureData>;
  onSave: (step: number, data: CaptureData) => void;
  onClose: () => void;
};

const TOTAL_STEPS = 4;

export function CaptureFlow({ address, mode = "quote", initial, onSave, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CaptureData>({ ...EMPTY, ...initial });
  const touchStartX = useRef<number | null>(null);

  const update = <K extends keyof CaptureData>(key: K, value: CaptureData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const goNext = () => {
    onSave(step, data); // every card is a save point
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else onClose();
  };
  const goBack = () => {
    if (step === 0) onClose();
    else setStep((s) => s - 1);
  };

  /* Swipe handling */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) goNext();
      else goBack();
    }
    touchStartX.current = null;
  };

  const isLast = step === TOTAL_STEPS - 1;
  const nextLabel = isLast ? "Done" : step === 3 ? "Done" : "Next";

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top: address + close */}
      <div className="border-b-2 border-foreground bg-card px-4 py-3 flex items-center justify-between gap-3">
        <div className="border-2 border-foreground bg-background px-3 py-2 flex items-center gap-2 min-w-0 flex-1">
          <MapPin className="size-4 shrink-0" strokeWidth={2.5} />
          <span className="font-mono font-bold text-sm truncate">{address}</span>
        </div>
        <button
          onClick={onClose}
          className="press-brutal size-10 border-2 border-foreground bg-card flex items-center justify-center shrink-0"
          aria-label="Close"
        >
          <X className="size-4" strokeWidth={3} />
        </button>
      </div>

      {/* Dot progress */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`size-2.5 border-2 border-foreground ${
              i === step ? "bg-foreground" : i < step ? "bg-[var(--amber)]" : "bg-card"
            }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      {/* Card content */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          key={step}
          className="animate-in slide-in-from-right-8 fade-in duration-200"
        >
          {step === 0 && <CardWho data={data} update={update} />}
          {step === 1 && <CardWhen data={data} update={update} mode={mode} />}
          {step === 2 && <CardWhat data={data} update={update} />}
          {step === 3 && <CardNotes data={data} update={update} />}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="border-t-2 border-foreground bg-card px-4 py-3 flex items-stretch gap-3">
        <button
          onClick={goBack}
          className="press-brutal border-2 border-foreground bg-card px-4 py-3 font-mono font-bold uppercase tracking-wider text-sm flex items-center gap-2"
        >
          <ArrowLeft className="size-4" strokeWidth={3} />
          Back
        </button>
        <button
          onClick={goNext}
          className="press-brutal flex-1 border-2 border-foreground bg-foreground text-background py-3 font-mono font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2"
        >
          {nextLabel}
          {isLast ? <Check className="size-4" strokeWidth={3} /> : <ArrowRight className="size-4" strokeWidth={3} />}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Shared bits ---------------- */
function StepLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
      {children}
    </div>
  );
}

function Field({
  label, children,
}: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full border-2 border-foreground bg-card text-foreground font-mono text-lg p-3 focus:outline-none focus:bg-[var(--accent)]";

/* ---------------- Card 1 — WHO ---------------- */
function CardWho({
  data, update,
}: { data: CaptureData; update: <K extends keyof CaptureData>(k: K, v: CaptureData[K]) => void }) {
  return (
    <div>
      <StepLabel>Who lives here?</StepLabel>
      <Field label="Name">
        <input
          type="text"
          value={data.name}
          onChange={(e) => update("name", e.target.value.slice(0, 100))}
          autoCapitalize="words"
          autoComplete="name"
          maxLength={100}
          placeholder="Sarah"
          className={inputCls}
        />
      </Field>
      <Field label="Phone">
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => update("phone", e.target.value.slice(0, 30))}
          autoComplete="tel"
          inputMode="tel"
          maxLength={30}
          placeholder="07700 900123"
          className={inputCls}
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          value={data.email}
          onChange={(e) => update("email", e.target.value.slice(0, 255))}
          autoComplete="email"
          inputMode="email"
          maxLength={255}
          placeholder="sarah@example.com"
          className={inputCls}
        />
      </Field>
    </div>
  );
}

/* ---------------- Card 2 — WHEN ---------------- */
function buildDayTiles(): Array<{ key: string; label: string; iso: string }> {
  const out: Array<{ key: string; label: string; iso: string }> = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    let label: string;
    if (i === 0) label = "Today";
    else if (i === 1) label = "Tomorrow";
    else label = days[d.getDay()];
    out.push({ key: iso, label, iso });
  }
  return out;
}

const TIMES = ["9AM", "10AM", "11AM", "1PM", "2PM", "3PM"];

function CardWhen({
  data, update, mode,
}: { data: CaptureData; update: <K extends keyof CaptureData>(k: K, v: CaptureData[K]) => void; mode: CaptureMode }) {
  const tiles = buildDayTiles();
  return (
    <div>
      <StepLabel>{mode === "quote" ? "When is the job?" : "When to follow up?"}</StepLabel>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {tiles.map((t) => {
          const active = data.date === t.iso;
          return (
            <button
              key={t.key}
              onClick={() => update("date", active ? null : t.iso)}
              className={`press-brutal py-3 border-2 border-foreground font-mono font-bold uppercase text-xs tracking-wider ${
                active ? "bg-foreground text-background" : "bg-card"
              }`}
            >
              {t.label}
            </button>
          );
        })}
        <button
          onClick={() => update("date", null)}
          className={`press-brutal py-3 border-2 border-foreground font-mono font-bold uppercase text-xs tracking-wider ${
            data.date === null ? "bg-[var(--amber)]" : "bg-card"
          }`}
        >
          Later
        </button>
      </div>

      <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Time
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TIMES.map((t) => {
          const active = data.time === t;
          return (
            <button
              key={t}
              onClick={() => update("time", active ? null : t)}
              className={`press-brutal py-3 border-2 border-foreground font-mono font-bold text-sm ${
                active ? "bg-foreground text-background" : "bg-card"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {mode === "quote" && (
        <p className="mt-4 text-[11px] font-mono text-muted-foreground">
          ☑ Will sync to Google Calendar when connected.
        </p>
      )}
    </div>
  );
}

/* ---------------- Card 3 — WHAT ---------------- */
const SERVICES = ["Exterior", "In+Out", "Screens", "Tracks"] as const;

function calcPrice(windows: number, services: string[]): number {
  let base = 15 + windows * 2.5;
  if (services.includes("In+Out")) base *= 1.6;
  if (services.includes("Screens")) base += 12;
  if (services.includes("Tracks")) base += 8;
  return Math.round(base);
}

function CardWhat({
  data, update,
}: { data: CaptureData; update: <K extends keyof CaptureData>(k: K, v: CaptureData[K]) => void }) {
  const normal = Math.round(calcPrice(data.windows, data.services) * 1.3);
  const auto = calcPrice(data.windows, data.services);
  const display = data.priceOverridden ? data.price : auto;

  const setWindows = (n: number) => {
    const clamped = Math.max(1, Math.min(99, n));
    update("windows", clamped);
    if (!data.priceOverridden) update("price", calcPrice(clamped, data.services));
  };
  const toggleService = (s: string) => {
    const next = data.services.includes(s)
      ? data.services.filter((x) => x !== s)
      : [...data.services, s];
    update("services", next);
    if (!data.priceOverridden) update("price", calcPrice(data.windows, next));
  };

  return (
    <div>
      <StepLabel>What are we quoting?</StepLabel>

      {/* Window stepper */}
      <div className="border-2 border-foreground bg-card p-4 mb-4">
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Windows
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setWindows(data.windows - 1)}
            className="press-brutal size-14 border-2 border-foreground bg-background flex items-center justify-center font-mono font-bold text-2xl"
            aria-label="Decrease"
          >
            −
          </button>
          <div className="text-6xl font-mono font-bold leading-none tabular-nums">
            {data.windows}
          </div>
          <button
            onClick={() => setWindows(data.windows + 1)}
            className="press-brutal size-14 border-2 border-foreground bg-foreground text-background flex items-center justify-center font-mono font-bold text-2xl"
            aria-label="Increase"
          >
            +
          </button>
        </div>
      </div>

      {/* Service chips */}
      <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Services
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {SERVICES.map((s) => {
          const active = data.services.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggleService(s)}
              className={`press-brutal py-3 border-2 border-foreground font-mono font-bold uppercase tracking-wider text-xs ${
                active ? "bg-foreground text-background" : "bg-card"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Price card */}
      <div className="border-2 border-foreground bg-[var(--amber)] p-4">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
            Price
          </div>
          <div className="text-xs font-mono line-through text-foreground/60">
            Normally £{normal}
          </div>
        </div>
        <div className="text-5xl font-mono font-bold text-primary leading-none">
          £{display}
        </div>
        <button
          onClick={() => {
            if (data.priceOverridden) {
              update("priceOverridden", false);
              update("price", auto);
            } else {
              const v = window.prompt("Enter price (£)", String(display));
              const n = v ? Number(v.replace(/[^\d.]/g, "")) : NaN;
              if (!isNaN(n) && n >= 0 && n < 100000) {
                update("priceOverridden", true);
                update("price", Math.round(n));
              }
            }
          }}
          className="mt-2 text-[11px] font-mono font-bold uppercase tracking-wider underline"
        >
          {data.priceOverridden ? "Reset price" : "Edit price"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Card 4 — NOTES ---------------- */
const NOTE_TAGS = [
  "Dog", "Gate code", "Side door", "Steep roof",
  "Ladder needed", "Cash only", "Senior", "Back gate",
];

function CardNotes({
  data, update,
}: { data: CaptureData; update: <K extends keyof CaptureData>(k: K, v: CaptureData[K]) => void }) {
  const toggle = (t: string) => {
    const next = data.tags.includes(t)
      ? data.tags.filter((x) => x !== t)
      : [...data.tags, t];
    update("tags", next);
  };
  return (
    <div>
      <StepLabel>Anything to remember?</StepLabel>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {NOTE_TAGS.map((t) => {
          const active = data.tags.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`press-brutal py-3 border-2 border-foreground font-mono font-bold uppercase tracking-wider text-xs ${
                active ? "bg-[var(--amber)]" : "bg-card"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      <Field label="Free text">
        <textarea
          value={data.notes}
          onChange={(e) => update("notes", e.target.value.slice(0, 1000))}
          maxLength={1000}
          placeholder="Optional details…"
          rows={4}
          className={`${inputCls} text-base resize-none`}
        />
      </Field>

      <p className="text-[11px] font-mono text-muted-foreground">
        Optional — tap Done to skip.
      </p>
    </div>
  );
}
