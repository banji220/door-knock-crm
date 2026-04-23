import { ReactNode } from "react";
import { Phone, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";

/* =========================================================================
   RowItem — the unified scannable row used across Today.

   Consistent height. Three columns:
     LEFT   : time / age tag (mono, no box)
     CENTER : name (bold) + address (muted)
     RIGHT  : optional price + call/navigate icons

   Optional `accent` paints a 4px left stripe to flag urgency without
   wrapping the row in a heavy box. Borderless by default — relies on the
   parent <RowList> divider.
   ========================================================================= */

export type RowAccent = "destructive" | "warning" | "primary" | "success" | null;

type RowItemProps = {
  /** "2:45 PM", "3d overdue", "5d old" — the temporal context */
  timeLabel: string;
  /** When true, timeLabel renders in destructive color */
  overdue?: boolean;
  name: string;
  address: string;
  phone?: string;
  price?: number;
  /** Left accent stripe — null = no stripe (default for normal rows) */
  accent?: RowAccent;
  /** Tiny status word shown next to the name (e.g. "5d old") */
  badge?: string;
  className?: string;
};

export function RowItem({
  timeLabel,
  overdue,
  name,
  address,
  phone,
  price,
  accent = null,
  badge,
  className,
}: RowItemProps) {
  const navHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const callHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;

  const stripeClass =
    accent === "destructive"
      ? "stripe-destructive"
      : accent === "warning"
        ? "stripe-warning"
        : accent === "primary"
          ? "stripe-primary"
          : accent === "success"
            ? "stripe-success"
            : "";

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3",
        "transition-colors hover:bg-muted/50",
        accent ? `${stripeClass} pl-4 sm:pl-5` : "",
        className,
      )}
    >
      {/* LEFT — time / age */}
      <div className="shrink-0 w-14 sm:w-16">
        <div
          className={cn(
            "font-mono font-bold text-xs sm:text-sm tabular-nums leading-tight uppercase tracking-wide",
            overdue ? "text-destructive" : "text-foreground",
          )}
        >
          {timeLabel}
        </div>
      </div>

      {/* CENTER — name + address */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-mono font-bold uppercase text-sm leading-tight truncate">
            {name}
          </div>
          {badge && (
            <span className="shrink-0 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              · {badge}
            </span>
          )}
        </div>
        <div className="text-xs font-mono text-muted-foreground truncate mt-0.5">
          {address}
        </div>
      </div>

      {/* RIGHT — price + actions */}
      <div className="shrink-0 flex items-center gap-2 sm:gap-3">
        {price !== undefined && (
          <span className="font-mono font-bold text-base sm:text-lg leading-none tabular-nums">
            {formatMoney(price)}
          </span>
        )}
        <div className="flex items-center gap-1">
          {callHref ? (
            <a
              href={callHref}
              aria-label={`Call ${name}`}
              className="press-brutal w-9 h-9 border-2 border-foreground bg-foreground text-background flex items-center justify-center hover:bg-primary hover:border-primary transition-colors"
            >
              <Phone className="size-4" strokeWidth={2.5} />
            </a>
          ) : (
            <span
              aria-label="No phone"
              className="w-9 h-9 border-hairline bg-transparent opacity-30 flex items-center justify-center"
            >
              <Phone className="size-4" strokeWidth={2.5} />
            </span>
          )}
          <a
            href={navHref}
            target="_blank"
            rel="noreferrer"
            aria-label={`Navigate to ${address}`}
            className="press-brutal w-9 h-9 border-hairline bg-transparent flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Navigation className="size-4" strokeWidth={2.25} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ---------- RowList — borderless surface with hairline dividers ----------
   Use for grouped row sections. No outer card, no inner box-spam.
   Just a quiet container that lets the rows breathe. */
export function RowList({
  children,
  className,
  empty,
}: {
  children: ReactNode;
  className?: string;
  empty?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-hairline surface-raised divide-y divide-[var(--hairline)]",
        className,
      )}
    >
      {children ?? empty}
    </div>
  );
}

/* ---------- EmptyState — quiet, minimal, motivational ---------- */
export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="px-4 py-8 text-center">
      <p className="font-mono font-bold uppercase text-sm tracking-wide">
        {title}
      </p>
      {hint && (
        <p className="mt-1.5 text-xs font-mono text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
