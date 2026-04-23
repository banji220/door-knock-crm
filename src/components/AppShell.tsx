import { ReactNode, useState } from "react";
import { Link, useLocation, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Target,
  Map as MapIcon,
  Users,
  User,
} from "lucide-react";
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

/* Desktop layout dimensions */
const TOPBAR_H = 56;
const PANEL_W = 380;
const PANEL_W_COLLAPSED = 48;

/* Field routes get the persistent map + floating panel treatment on desktop.
   Me page is its own wide dashboard (no map behind it). */
const FIELD_ROUTES = new Set(["/", "/deals", "/map", "/clients"]);

/* =========================================================================
   AppShell
   - Mobile  (<640):  full-width single column, sticky header, bottom nav.
   - Tablet  (640+):  centered max-w-2xl column, side-bordered.
   - Desktop (≥1024): full-bleed map + floating left command panel
                     (collapsible to icon rail). Me uses the wide dashboard.
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
              ? "flex items-center justify-between px-4 py-3"
              : "flex items-center justify-between px-4 py-3 lg:px-8 lg:py-5"
          }
        >
          <div>
            <h1
              className={
                forPanel
                  ? "text-xl font-display font-bold uppercase text-foreground tracking-tight leading-none"
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
      {/* DesktopSidebar only on non-field routes (e.g. Me page). */}
      {!isFieldRoute && <DesktopSidebar />}

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
   Layer 1: Full-bleed map (always visible, edge-to-edge).
   Layer 2: TopBar (56px) + collapsible left command panel (380 / 48px). */
function DesktopFieldLayout({
  renderHeader,
  children,
}: {
  renderHeader: (forPanel?: boolean) => ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const panelW = collapsed ? PANEL_W_COLLAPSED : PANEL_W;

  return (
    <div className="hidden lg:block">
      {/* Layer 1 — full-bleed map */}
      <PersistentMap leftInset={0} topInset={TOPBAR_H} panelInset={panelW} />

      {/* Top bar (56px) — sits above both panel and map */}
      <DesktopTopBar />

      {/* Layer 2 — left command panel, collapsible */}
      <aside
        className="fixed left-0 z-30 flex bg-card border-r-2 border-foreground shadow-[6px_0_0_0_color-mix(in_oklab,var(--foreground)_15%,transparent)] transition-[width] duration-200 ease-out"
        style={{
          top: `${TOPBAR_H}px`,
          bottom: 0,
          width: `${panelW}px`,
        }}
        aria-label="Command panel"
      >
        {/* Icon rail — always visible, gives context when collapsed */}
        <PanelNavRail collapsed={collapsed} />

        {/* Expanded content */}
        {!collapsed && (
          <div className="flex flex-1 flex-col min-w-0 border-l-2 border-foreground bg-background">
            {renderHeader(true)}
            <main className="flex-1 overflow-y-auto px-5 py-5">
              {children}
            </main>
          </div>
        )}

        {/* Collapse / expand toggle — top-right edge of the panel */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="press-brutal absolute top-3 -right-4 z-10 size-8 border-2 border-foreground bg-card flex items-center justify-center shadow-[2px_2px_0_0_var(--foreground)]"
          aria-label={collapsed ? "Expand panel" : "Collapse panel"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="size-4" strokeWidth={3} />
          ) : (
            <ChevronLeft className="size-4" strokeWidth={3} />
          )}
        </button>
      </aside>
    </div>
  );
}

/* ---------------- DesktopTopBar ----------------
   56px brand bar that spans the full viewport above both panel and map. */
function DesktopTopBar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-[var(--amber)] border-b-2 border-foreground"
      style={{ height: `${TOPBAR_H}px` }}
    >
      <Link to="/" className="flex items-baseline gap-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-foreground/70">
          Field CRM
        </span>
        <span className="text-xl font-display font-bold uppercase tracking-tight leading-none">
          Giraffe
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/me"
          className="press-brutal size-9 border-2 border-foreground bg-background flex items-center justify-center font-mono font-bold text-xs"
          aria-label="My profile"
        >
          HG
        </Link>
      </div>
    </header>
  );
}

/* ---------------- PanelNavRail ----------------
   48px icon strip on the left edge of the panel. Always visible (even when
   panel is expanded) so primary nav is one click away. */
const RAIL_ITEMS = [
  { to: "/", label: "Today", icon: Zap, badge: 3 },
  { to: "/deals", label: "Deals", icon: Target, badge: 5 },
  { to: "/map", label: "Map", icon: MapIcon, badge: 0 },
  { to: "/clients", label: "Clients", icon: Users, badge: 0 },
  { to: "/me", label: "Me", icon: User, badge: 0 },
] as const;

function PanelNavRail({ collapsed }: { collapsed: boolean }) {
  const { pathname } = useLocation();
  return (
    <nav
      className="flex flex-col items-center gap-1 py-2 bg-card"
      style={{ width: `${PANEL_W_COLLAPSED}px` }}
      aria-label="Primary"
    >
      {RAIL_ITEMS.map(({ to, label, icon: Icon, badge }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`press-brutal relative size-10 flex items-center justify-center border-2 ${
              active
                ? "border-foreground bg-foreground text-background"
                : "border-transparent hover:border-foreground hover:bg-muted text-foreground"
            }`}
            aria-label={label}
            title={collapsed ? label : undefined}
          >
            <Icon
              className="size-5"
              strokeWidth={active ? 2.75 : 2.25}
            />
            {badge > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 border-2 border-foreground bg-destructive text-destructive-foreground font-mono font-bold text-[9px] flex items-center justify-center leading-none tabular-nums"
                aria-hidden
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
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
    <div className="px-4 py-3 lg:px-5 lg:py-4">
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
