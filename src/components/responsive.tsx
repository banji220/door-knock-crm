import { ReactNode, ElementType, CSSProperties } from "react";

/* =========================================================================
   Responsive primitives — the ONLY way pages should branch on viewport.

   Three intentional layouts. Each `Show on=` slot renders ONLY at that
   breakpoint, with hard CSS `hidden` at the others. Never reuse one slot
   across breakpoints — that is the bug pattern this system removes.

     <Show on="mobile">  …mobile UI…  </Show>
     <Show on="tablet">  …tablet UI…  </Show>
     <Show on="desktop"> …desktop UI… </Show>

   Containers + Stacks come from the same source so spacing + max-widths
   never leak across breakpoints.
   ========================================================================= */

type Slot = "mobile" | "tablet" | "desktop" | "touch" | "non-mobile";

const SLOT_CLASS: Record<Slot, string> = {
  // Mobile only: <= 640
  mobile: "block sm:hidden",
  // Tablet only: 641..1024
  tablet: "hidden sm:block lg:hidden",
  // Desktop only: >= 1025
  desktop: "hidden lg:block",
  // Touch tier: mobile + tablet
  touch: "block lg:hidden",
  // Non-mobile: tablet + desktop
  "non-mobile": "hidden sm:block",
};

export function Show({
  on,
  children,
  as: Tag = "div",
  className = "",
}: {
  on: Slot;
  children: ReactNode;
  as?: ElementType;
  className?: string;
}) {
  const C = Tag;
  return <C className={`${SLOT_CLASS[on]} ${className}`.trim()}>{children}</C>;
}

/* ---------------- PageContainer ----------------
   Per-tier max-width + padding. Never apply a single max-width across all
   sizes; this picks the right one and applies it via responsive utilities. */
export function PageContainer({
  children,
  className = "",
  bleed = false,
}: {
  children: ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  if (bleed) return <div className={className}>{children}</div>;
  return (
    <div
      className={[
        "w-full mx-auto",
        // mobile: full bleed with 16px gutter
        "px-4",
        // tablet: 720px max, 24px gutter
        "sm:max-w-[720px] sm:px-6",
        // desktop: 1400px max, 40px gutter
        "lg:max-w-[1400px] lg:px-10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ---------------- Stack ----------------
   Vertical rhythm scale that adapts per tier. Don't use ad-hoc space-y-*
   on page roots — use this so spacing stays consistent. */
export function Stack({
  children,
  className = "",
  gap = "md",
}: {
  children: ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
}) {
  const gapClass =
    gap === "sm"
      ? "space-y-3 sm:space-y-3 lg:space-y-4"
      : gap === "lg"
        ? "space-y-5 sm:space-y-6 lg:space-y-8"
        : "space-y-4 sm:space-y-5 lg:space-y-6";
  return <div className={`${gapClass} ${className}`.trim()}>{children}</div>;
}

/* ---------------- ResponsiveGrid ----------------
   Tier-aware grid. Spec columns per tier; no inheritance bugs. */
export function ResponsiveGrid({
  children,
  cols,
  gap = "md",
  className = "",
}: {
  children: ReactNode;
  cols: { mobile: number; tablet: number; desktop: number | string };
  gap?: "sm" | "md" | "lg";
  className?: string;
}) {
  const gapClass =
    gap === "sm"
      ? "gap-2 sm:gap-3 lg:gap-3"
      : gap === "lg"
        ? "gap-4 sm:gap-5 lg:gap-6"
        : "gap-3 sm:gap-4 lg:gap-4";

  // mobile (default) cols
  const m = `grid-cols-${cols.mobile}`;
  // tablet override
  const t = `sm:grid-cols-${cols.tablet}`;
  // desktop override (number → grid-cols-N, string → arbitrary template)
  const dCls =
    typeof cols.desktop === "string"
      ? "" // applied via inline style below
      : `lg:grid-cols-${cols.desktop}`;
  const dStyle =
    typeof cols.desktop === "string"
      ? { ["--lg-grid" as string]: cols.desktop }
      : undefined;

  return (
    <div
      className={`grid ${m} ${t} ${dCls} ${gapClass} ${className}`.trim()}
      style={
        dStyle
          ? ({ gridTemplateColumns: cols.desktop as string } as CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}
