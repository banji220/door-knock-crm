import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* =========================================================================
   Brutalist Warm — Component primitives.

   Two visual tiers, used intentionally:

   1. PRIMARY  — heavy 2px ink border. Heroes, top-level CTAs, dashboard
      anchors. Use sparingly: typically ONE primary block per screen zone.
   2. SECONDARY — hairline border, raised surface. Lists, grouped rows,
      supporting cards. Quiet container; content does the talking.

   Use accent stripes (`stripe-destructive`, `stripe-warning`, etc.) to
   signal urgency on individual rows without re-introducing heavy borders.
   ========================================================================= */

/* ---------- Card (PRIMARY tier — heavy ink border) ---------- */
type CardProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
};
export function Card({ children, className, as: Tag = "div" }: CardProps) {
  return (
    <Tag className={cn("border-2 border-foreground bg-card p-3", className)}>
      {children}
    </Tag>
  );
}

/* ---------- Surface (SECONDARY tier — hairline + raised) ---------- */
type SurfaceProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "ul";
  /** "raised" (default) = lighter than background. "sunken" = quietest. */
  tone?: "raised" | "sunken";
  /** Drop the hairline border entirely. */
  borderless?: boolean;
};
export function Surface({
  children,
  className,
  as: Tag = "div",
  tone = "raised",
  borderless = false,
}: SurfaceProps) {
  return (
    <Tag
      className={cn(
        tone === "sunken" ? "surface-sunken" : "surface-raised",
        !borderless && "border-hairline",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ---------- HeroCard ----------
   The single anchor on a screen — used for Daily Mission, etc.
   Heavy ink border + ink left stripe for unmistakable focus. */
export function HeroCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative border-2 border-foreground bg-card p-5 lg:p-6",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1.5 bg-foreground"
      />
      {children}
    </div>
  );
}

/* ---------- SectionLabel ----------
   Tiny uppercase mono header. Used above lists to identify a zone WITHOUT
   wrapping the list in another card. Visual weight via type, not box. */
export function SectionLabel({
  children,
  count,
  action,
  className,
}: {
  children: ReactNode;
  count?: number | string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between mb-2", className)}>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-muted-foreground">
          {children}
        </span>
        {count !== undefined && (
          <span className="text-[11px] font-mono font-bold tabular-nums text-foreground">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

/* ---------- Buttons ---------- */
const buttonBase =
  "press-brutal inline-flex items-center justify-center gap-2 border-2 border-foreground font-mono font-bold text-sm uppercase tracking-wider px-4 py-3 select-none disabled:opacity-50 disabled:pointer-events-none";

const variantMap = {
  primary: "bg-foreground text-background",
  secondary: "bg-card text-foreground",
  accent: "bg-accent text-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  amber: "bg-[var(--amber)] text-foreground",
} as const;

type Variant = keyof typeof variantMap;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", block, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonBase, variantMap[variant], block && "w-full", className)}
      {...props}
    >
      {children}
    </button>
  ),
);
Button.displayName = "Button";

/* ---------- Label ---------- */
export function Label({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </label>
  );
}

/* ---------- Section Header (label + right-aligned count badge) ---------- */
export function SectionHeader({
  children,
  count,
  className,
  action,
}: {
  children: ReactNode;
  count?: number | string;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-2 mt-4 first:mt-0",
        className,
      )}
    >
      <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {children}
      </span>
      {action ??
        (count !== undefined && (
          <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 border-2 border-foreground bg-card text-foreground">
            {count}
          </span>
        ))}
    </div>
  );
}

/* ---------- Input ---------- */
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full border-2 border-foreground bg-card text-foreground font-mono text-lg p-3 focus:outline-none focus:bg-[var(--accent)]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

/* ---------- Badge (count chip) ---------- */
export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "primary" | "accent" | "destructive" | "success";
  className?: string;
}) {
  const variants = {
    default: "bg-card text-foreground",
    primary: "bg-foreground text-background",
    accent: "bg-accent text-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    success: "bg-[var(--success)] text-[var(--success-foreground)]",
  };
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 border-2 border-foreground font-mono font-bold text-xs uppercase tracking-wider",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
