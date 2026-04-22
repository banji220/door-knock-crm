import { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { PersistentMap } from "./PersistentMap";

type AppShellProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Override the entire header (e.g. for a richer page-header layout) */
  header?: ReactNode;
  children: ReactNode;
  /** Set true for pages that already manage their own wide layout (e.g. desktop Me grid). */
  wide?: boolean;
};

/* Sidebar = 64 (w-64). Panel = 420px. */
const SIDEBAR_W = 256;
const PANEL_W = 420;

/* Field routes get the persistent map + floating panel treatment on desktop.
   Me page is its own wide dashboard (no map behind it). */
const FIELD_ROUTES = new Set(["/", "/deals", "/map", "/clients"]);

/* =========================================================================
   AppShell
   - Mobile  (<640):  full-width single column, sticky header, bottom nav.
   - Tablet  (640+):  centered max-w-2xl column, side-bordered.
   - Desktop (≥1024): left sidebar nav + (field routes) persistent map base
                     with left-anchored 420px panel; (other routes) wide dash.
   ========================================================================= */
export function AppShell({
  title,
  subtitle,
  right,
  header,
  children,
  wide = false,
}: AppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isFieldRoute = FIELD_ROUTES.has(pathname);

  const renderHeader = (forPanel = false) =>
    header ? (
      <div
        className={
          forPanel
            ? "bg-card border-b-2 border-foreground"
            : "sticky top-0 z-30 bg-card border-b-2 border-foreground"
        }
      >
        {header}
      </div>
    ) : (
      <header
        className={
          forPanel
            ? "bg-[var(--amber)] border-b-2 border-foreground"
            : "sticky top-0 z-30 bg-[var(--amber)] border-b-2 border-foreground"
        }
      >
        <div
          className={
            forPanel
              ? "flex items-center justify-between px-5 py-4"
              : "flex items-center justify-between px-4 py-3 lg:px-8 lg:py-5"
          }
        >
          <div>
            <h1
              className={
                forPanel
                  ? "text-2xl font-display font-bold uppercase text-foreground tracking-tight leading-none"
                  : "text-3xl lg:text-4xl font-display font-bold uppercase text-foreground tracking-tight leading-none"
              }
            >
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
    <div className="min-h-screen bg-muted">
      <DesktopSidebar />

      {/* Mobile / Tablet: centered phone-like column */}
      <div className="lg:hidden min-h-screen flex flex-col max-w-2xl mx-auto bg-background sm:border-x-2 sm:border-foreground">
        {renderHeader()}
        <main
          className="flex-1 px-4 pt-4 sm:px-6"
          style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}
        >
          {children}
        </main>
        <BottomNav />
      </div>

      {/* ===================================================================
          Desktop (≥1024)
          =================================================================== */}
      {isFieldRoute ? (
        <DesktopFieldLayout
          renderHeader={renderHeader}
          children={children}
        />
      ) : (
        <div className="hidden lg:flex lg:flex-col min-h-screen lg:pl-64 bg-background">
          {renderHeader()}
          <main
            className={
              wide
                ? "flex-1 px-8 py-8"
                : "flex-1 px-8 py-8 max-w-7xl w-full mx-auto"
            }
          >
            {children}
          </main>
        </div>
      )}
    </div>
  );
}

/* ---------------- Desktop field layout ----------------
   Map = full-bleed base layer (edge-to-edge, always visible).
   Sidebar (64) and Panel (420) float ON TOP as overlays. */
function DesktopFieldLayout({
  renderHeader,
  children,
}: {
  renderHeader: (forPanel?: boolean) => ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="hidden lg:block">
      {/* Map is full-screen behind everything — leftInset=0 so it spans
          edge to edge. Sidebar + panel float on top with their own z-index. */}
      <PersistentMap leftInset={0} />

      {/* Floating drawer panel — sits on top of the map, anchored to the
          right edge of the sidebar. */}
      <aside
        className="fixed top-0 bottom-0 z-30 flex flex-col bg-background border-r-2 border-foreground shadow-[6px_0_0_0_color-mix(in_oklab,var(--foreground)_15%,transparent)]"
        style={{ left: `${SIDEBAR_W}px`, width: `${PANEL_W}px` }}
        aria-label="Route panel"
      >
        {renderHeader(true)}
        <main className="flex-1 overflow-y-auto px-5 py-5">{children}</main>
      </aside>
    </div>
  );
}

/* ---------------- PageHeader ----------------
   Brutalist warm header: small primary eyebrow,
   big bold display title, mono stats line beneath. */
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
    <div className="px-4 py-4 lg:px-5 lg:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
            {eyebrow}
          </div>
          <h1 className="mt-1 text-2xl lg:text-3xl font-display font-bold tracking-tight leading-tight text-foreground">
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
