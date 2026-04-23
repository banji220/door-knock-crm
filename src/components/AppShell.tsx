import { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { Logo } from "./Logo";

type AppShellProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Override the entire mobile/tablet header (e.g. for a richer page-header layout) */
  header?: ReactNode;
  children: ReactNode;
  /** Pages that own their full main area (e.g. Map full-bleed) — disables main padding/max-width on desktop. */
  bleed?: boolean;
  /** Legacy prop, kept for source compat. No-op in the new layout. */
  wide?: boolean;
};

const SIDEBAR_W = 240;

/* =========================================================================
   AppShell
   - Mobile  (<640):  full-width single column, sticky header, bottom nav.
   - Tablet  (640+):  centered max-w-2xl column, side-bordered, bottom nav.
   - Desktop (≥1024): fixed 240px dark sidebar + scrollable main content.
                      Map route gets bleed:true → main area is edge-to-edge.
   ========================================================================= */
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

  /* Mobile/tablet header — kept identical to existing behavior */
  const renderMobileHeader = () =>
    header ? (
      <div className="sticky top-0 z-30 bg-card border-b-2 border-foreground">
        {header}
      </div>
    ) : (
      <header className="sticky top-0 z-30 bg-[var(--amber)] border-b-2 border-foreground">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-3xl font-display font-bold uppercase text-foreground tracking-tight leading-none">
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
      {/* Desktop sidebar — always present at lg+, fixed left */}
      <DesktopSidebar />

      {/* ===================================================================
          Mobile / Tablet (<lg) — single phone-like column with bottom nav
          =================================================================== */}
      <div className="lg:hidden min-h-screen flex flex-col max-w-2xl mx-auto bg-background sm:border-x-2 sm:border-foreground">
        {renderMobileHeader()}
        <main
          className="flex-1 px-4 pt-4 sm:px-6"
          style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <BottomNav />
      </div>

      {/* ===================================================================
          Desktop (≥1024) — sidebar + main content
          =================================================================== */}
      <div
        className="hidden lg:block min-h-screen bg-background"
        style={{ paddingLeft: `${SIDEBAR_W}px` }}
      >
        {fullBleed ? (
          // Full-bleed: page owns its own padding (Map fills the whole area)
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

/* ---------------- PageHeader ----------------
   Used by mobile route headers (passed via the `header` prop on AppShell)
   AND by desktop routes inline as a top-of-content block. */
type PageHeaderProps = {
  /** Eyebrow / section label, e.g. "TODAY" */
  eyebrow: string;
  /** Big title — typically the date or page subject */
  title: string;
  /** Mono stats / metadata line under the title */
  meta?: ReactNode;
  /** Right-side action slot (button, badge, etc.) */
  action?: ReactNode;
};

export function PageHeader({ eyebrow, title, meta, action }: PageHeaderProps) {
  return (
    <div className="px-4 py-3 lg:px-0 lg:py-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-muted-foreground">
            {eyebrow}
          </div>
          <h1 className="mt-1 text-2xl font-display font-bold tracking-tight leading-tight text-foreground">
            {title}
          </h1>
          {meta && (
            <p className="mt-1 text-xs font-mono text-muted-foreground">
              {meta}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/* ---------------- DesktopPageHeader ----------------
   Desktop-specific page header used inside main content area.
   Eyebrow + big bold title on the left, optional action slot on the right.
   ----------------------------------------------------------------- */
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
        <h1 className="mt-1 text-2xl font-display font-bold tracking-tight leading-none text-foreground">
          {title}
        </h1>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
