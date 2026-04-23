import { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { Logo } from "./Logo";

/* =========================================================================
   AppShell — 3 intentional layouts. NEVER one layout stretched across sizes.

   Mobile  (≤640):   full-bleed single column, sticky header, bottom nav.
   Tablet  (641-1024): centered 720px column, side-bordered, bottom nav.
   Desktop (≥1025):  fixed 240px sidebar + scrollable main (1400px max).

   Each tier has its own container/padding/nav. Constraints do NOT leak
   between tiers. The Map route opts into bleed:true for full-bleed main.
   ========================================================================= */

type AppShellProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Override the entire mobile/tablet header (e.g. richer page-header) */
  header?: ReactNode;
  children: ReactNode;
  /** Pages that own their main area edge-to-edge (e.g. Map). */
  bleed?: boolean;
  /** Legacy prop, no-op. */
  wide?: boolean;
};

const SIDEBAR_W = 240;

export function AppShell({
  title,
  subtitle,
  right,
  header,
  children,
  bleed = false,
}: AppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMapRoute = pathname === "/map";
  const fullBleed = bleed || isMapRoute;

  /* Mobile/tablet header — sticky, full width of the column */
  const renderTouchHeader = () =>
    header ? (
      <div className="sticky top-0 z-30 bg-card border-b-2 border-foreground">
        {header}
      </div>
    ) : (
      <header className="sticky top-0 z-30 bg-[var(--amber)] border-b-2 border-foreground">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold uppercase text-foreground tracking-tight leading-none">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-foreground/70 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {right}
        </div>
      </header>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar — fixed left, lg+ only */}
      <DesktopSidebar />

      {/* ===================================================================
          Mobile + Tablet (<lg) — single column with bottom nav.
          Mobile: 100% width, no side borders.
          Tablet: 720px max, centered, side borders for "phone slab" feel.
          =================================================================== */}
      <div
        className={[
          "lg:hidden min-h-screen flex flex-col bg-background",
          // mobile defaults: full width
          "max-w-full",
          // tablet: clamp to 720, side borders
          "sm:max-w-[720px] sm:mx-auto sm:border-x-2 sm:border-foreground",
        ].join(" ")}
      >
        {renderTouchHeader()}
        <main
          className={[
            "flex-1",
            // mobile: 16px padding
            "px-4 pt-4",
            // tablet: 24px padding, slightly more top breathing room
            "sm:px-6 sm:pt-6",
          ].join(" ")}
          style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <BottomNav />
      </div>

      {/* ===================================================================
          Desktop (≥1025) — sidebar + scrollable main. NO bottom nav.
          =================================================================== */}
      <div
        className="hidden lg:block min-h-screen bg-background"
        style={{ paddingLeft: `${SIDEBAR_W}px` }}
      >
        {fullBleed ? (
          <main className="min-h-screen">{children}</main>
        ) : (
          <main className="min-h-screen">
            <div className="max-w-[1400px] mx-auto px-10 py-8">{children}</div>
          </main>
        )}
      </div>
    </div>
  );
}

/* ---------------- PageHeader (mobile/tablet sticky header content) ---------- */
type PageHeaderProps = {
  eyebrow: string;
  title: string;
  meta?: ReactNode;
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, meta, action }: PageHeaderProps) {
  return (
    <div className="px-4 py-3 sm:px-6 sm:py-4 lg:px-0 lg:py-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Logo — touch tier only; desktop uses sidebar logo */}
          <Logo tone="dark" size={36} className="mt-0.5 lg:hidden shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-muted-foreground">
              {eyebrow}
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-display font-bold tracking-tight leading-tight text-foreground">
              {title}
            </h1>
            {meta && (
              <p className="mt-1 text-xs font-mono text-muted-foreground">
                {meta}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/* ---------------- DesktopPageHeader ---------- */
export function DesktopPageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </div>
        <h1 className="mt-1 text-3xl font-display font-bold tracking-tight leading-none text-foreground">
          {title}
        </h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
