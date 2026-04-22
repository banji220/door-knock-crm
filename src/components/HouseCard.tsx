import { useMemo } from "react";
import { Card, Badge, Button } from "@/components/ui-brutal";
import { Phone, MessageSquare, Navigation, X } from "lucide-react";
import { mockKnocks, mockJobs, type KnockOutcome } from "@/lib/mock-data";
import { OUTCOME_META, type HousePin } from "@/lib/map-data";

const OUTCOMES: KnockOutcome[] = [
  "booked", "quoted", "callback", "no-answer", "not-interested",
];

type Props = {
  pin: HousePin;
  onClose: () => void;
  onLogOutcome: (o: KnockOutcome) => void;
  onQuote: () => void;
};

export function HouseCard({ pin, onClose, onLogOutcome, onQuote }: Props) {
  const meta = OUTCOME_META[pin.outcome];

  const timeline = useMemo(() => {
    const knocks = mockKnocks
      .filter((k) => k.address === pin.address)
      .map((k) => ({
        type: "knock" as const,
        id: k.id,
        outcome: k.outcome,
        notes: k.notes,
        timestamp: k.timestamp,
      }));
    const jobs = mockJobs
      .filter((j) => j.address === pin.address)
      .map((j) => ({
        type: "job" as const,
        id: j.id,
        status: j.status,
        price: j.price,
        timestamp: j.scheduledFor,
      }));
    return [...knocks, ...jobs].sort(
      (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp),
    );
  }, [pin.address]);

  /* Next Best Action */
  const nba = (() => {
    if (pin.outcome === "quoted") return { label: "Close the Deal", action: onQuote };
    if (pin.outcome === "booked") return { label: "Offer Reclean", action: onQuote };
    if (pin.outcome === "callback") return { label: "Call Now", action: () => {} };
    return { label: "Knock Again", action: () => onLogOutcome("no-answer") };
  })();

  const money = pin.ltv ?? pin.quotePrice ?? pin.anchor;
  const moneyLabel = pin.ltv ? "Lifetime Value" : pin.quotePrice ? "Quote" : "Anchor";

  return (
    <div
      className="fixed inset-0 z-40 bg-foreground/40 flex items-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[85vh] overflow-y-auto bg-background border-t-2 border-foreground animate-in slide-in-from-bottom duration-200"
      >
        <div className="sticky top-0 bg-background border-b-2 border-foreground px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1">
              📍 Address
            </div>
            <h2 className="text-xl font-display font-bold uppercase truncate">
              {pin.address}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="press-brutal size-9 border-2 border-foreground bg-card flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={3} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Contact + status */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-mono font-bold text-base truncate">
                {pin.leadName ?? "No contact yet"}
              </div>
              {pin.phone && (
                <div className="text-xs font-mono text-muted-foreground">{pin.phone}</div>
              )}
            </div>
            <Badge
              variant={
                pin.outcome === "booked" ? "success"
                  : pin.outcome === "quoted" ? "accent"
                    : pin.outcome === "not-interested" ? "destructive"
                      : "default"
              }
            >
              {meta.full}
            </Badge>
          </div>

          {/* Money line */}
          {money !== undefined && (
            <div className="border-2 border-foreground bg-[var(--amber)] px-4 py-3 flex items-baseline justify-between">
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                {moneyLabel}
              </div>
              <div className="text-3xl font-mono font-bold leading-none">
                £{money}
              </div>
            </div>
          )}

          {/* NBA */}
          <Button variant="primary" block onClick={nba.action} className="py-4 text-base">
            {nba.label} →
          </Button>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-2">
            <QuickAction icon={<Phone className="size-5" strokeWidth={2.5} />} label="Call" href={pin.phone ? `tel:${pin.phone}` : undefined} />
            <QuickAction icon={<MessageSquare className="size-5" strokeWidth={2.5} />} label="Text" href={pin.phone ? `sms:${pin.phone}` : undefined} />
            <QuickAction icon={<Navigation className="size-5" strokeWidth={2.5} />} label="Nav" href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`} />
          </div>

          {/* Outcome grid */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Log Outcome
            </div>
            <div className="grid grid-cols-5 gap-2">
              {OUTCOMES.map((o) => {
                const m = OUTCOME_META[o];
                return (
                  <button
                    key={o}
                    onClick={() => onLogOutcome(o)}
                    className="press-brutal aspect-square border-2 border-foreground flex flex-col items-center justify-center gap-0.5"
                    style={{ background: m.color }}
                    title={m.full}
                  >
                    <span className="font-mono font-bold text-base leading-none">
                      {m.label}
                    </span>
                    <span className="font-mono font-bold text-[8px] uppercase tracking-wider opacity-80 leading-none">
                      {o.split("-")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline */}
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Timeline
            </div>
            {timeline.length === 0 ? (
              <Card className="text-xs font-mono text-muted-foreground text-center py-3">
                No history yet.
              </Card>
            ) : (
              <div className="space-y-1.5">
                {timeline.map((t) => (
                  <div
                    key={t.id}
                    className="border-2 border-foreground bg-card p-2.5 flex items-start gap-2"
                  >
                    <div
                      className="size-6 border-2 border-foreground flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                      style={{
                        background:
                          t.type === "knock"
                            ? OUTCOME_META[t.outcome].color
                            : "var(--heatmap-5)",
                        color: t.type === "job" ? "var(--background)" : undefined,
                      }}
                    >
                      {t.type === "knock" ? OUTCOME_META[t.outcome].label : "J"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-bold text-xs uppercase">
                        {t.type === "knock"
                          ? OUTCOME_META[t.outcome].full
                          : `Job · ${t.status} · £${t.price}`}
                      </div>
                      {t.type === "knock" && t.notes && (
                        <div className="text-xs font-mono text-muted-foreground truncate">
                          {t.notes}
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {new Date(t.timestamp).toLocaleString([], {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom buried actions */}
          <div className="flex items-center justify-between pt-2 border-t-2 border-foreground/20">
            <button className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-destructive">
              Mark as Avoid
            </button>
            <button className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-destructive">
              Remove Pin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon, label, href,
}: { icon: React.ReactNode; label: string; href?: string }) {
  const cls =
    "press-brutal border-2 border-foreground bg-card py-3 flex flex-col items-center gap-1 font-mono font-bold text-[10px] uppercase tracking-wider";
  if (href)
    return (
      <a href={href} className={cls}>
        {icon}
        {label}
      </a>
    );
  return (
    <button className={cls + " opacity-50"} disabled>
      {icon}
      {label}
    </button>
  );
}
