import { Phone, Navigation } from "lucide-react";
import { Card } from "./ui-brutal";
import { formatMoney } from "@/lib/format";

export type ActionItemProps = {
  /** "2:45 PM", "2d overdue", "5d old" — the time/age context */
  dueLabel: string;
  /** True if dueLabel is overdue/expiring — flips badge to destructive */
  overdue?: boolean;
  /** Optional price shown in bold mono if present */
  price?: number;
  /** Bold contact name */
  name: string;
  /** Mono muted address line */
  address: string;
  /** Optional phone — wires the call button */
  phone?: string;
};

export function ActionItem({
  dueLabel, overdue, price, name, address, phone,
}: ActionItemProps) {
  const navHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const callHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span
          className={`shrink-0 px-2 py-0.5 border-2 border-foreground font-mono font-bold text-[10px] uppercase tracking-[0.15em] ${
            overdue
              ? "bg-destructive text-destructive-foreground"
              : "bg-card text-foreground"
          }`}
        >
          {dueLabel}
        </span>
        {price !== undefined && (
          <span className="font-mono font-bold text-lg leading-none">
            ${price}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-mono font-bold uppercase text-sm leading-tight truncate">
            {name}
          </div>
          <div className="text-xs font-mono text-muted-foreground truncate mt-0.5">
            {address}
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0">
          {callHref ? (
            <a
              href={callHref}
              aria-label={`Call ${name}`}
              className="press-brutal w-9 h-9 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center"
            >
              <Phone className="size-4" strokeWidth={2.5} />
            </a>
          ) : (
            <button
              disabled
              aria-label="No phone"
              className="w-9 h-9 border-2 border-foreground bg-card opacity-40 flex items-center justify-center"
            >
              <Phone className="size-4" strokeWidth={2.5} />
            </button>
          )}
          <a
            href={navHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Navigate to ${address}`}
            className="press-brutal w-9 h-9 border-2 border-foreground bg-card flex items-center justify-center"
          >
            <Navigation className="size-4" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </Card>
  );
}
