import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* =========================================================================
   Brutalist Warm — Component primitives
   All shapes are squared (radius:0). All borders are 2px foreground.
   No shadows. Press feedback uses translateY(2px).
   ========================================================================= */

/* ---------- Card ---------- */
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
