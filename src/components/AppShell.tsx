import { ReactNode, useState } from "react";
import { Link, useLocation, useRouterState, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X, Search } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";
import { Logo } from "./Logo";
import {
  PersistentMap,
  useSelectedPin,
  setSelectedPin,
  updatePins,
} from "./PersistentMap";
import { HouseCardBody } from "./HouseCard";
import { OUTCOME_META } from "@/lib/map-data";
import type { KnockOutcome } from "@/lib/mock-data";

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
const RIGHT_PANEL_W = 420;

/* Field routes get the persistent map + floating panel treatment on desktop.
   Me page is its own wide dashboard (no map behind it). */
const FIELD_ROUTES = new Set(["/", "/deals", "/map", "/clients", "/me"]);

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMapRoute = pathname === "/map";

  /* User-controlled collapse. When the Map tab is active, we always show
     the panel as the tab strip only (the map gets the full stage). */
  const [userCollapsed, setUserCollapsed] = useState(false);
  const collapsed = isMapRoute || userCollapsed;
  const panelW = collapsed ? PANEL_W_COLLAPSED : PANEL_W;

  /* Layer 3 — right detail drawer. Driven by the global selected-pin
     store, so clicks on map pins OR list items in the left panel both
     open it. */
  const selected = useSelectedPin();
  const rightOpen = selected !== null;
  const rightInset = rightOpen ? RIGHT_PANEL_W : 0;

  return (
    <div className="hidden lg:block">
      {/* Layer 1 — full-bleed map */}
      <PersistentMap
        leftInset={0}
        topInset={TOPBAR_H}
        panelInset={panelW}
        rightInset={rightInset}
      />

      {/* Top bar (56px) — sits above both panel and map */}
      <DesktopTopBar />

      {/* Layer 2 — left command panel */}
      <aside
        className="fixed left-0 z-30 flex flex-col bg-card border-r-2 border-foreground shadow-[6px_0_0_0_color-mix(in_oklab,var(--foreground)_15%,transparent)] transition-[width] duration-200 ease-out"
        style={{
          top: `${TOPBAR_H}px`,
          bottom: 0,
          width: `${panelW}px`,
        }}
        aria-label="Command panel"
      >
        {/* Tab bar — horizontal text tabs across the top of the panel.
            When collapsed, render a vertical icon-only fallback so users
            can still switch routes from a 48px rail. */}
        {collapsed ? (
          <CollapsedNav />
        ) : (
          <PanelTabs />
        )}

        {/* Panel content — only shown when expanded */}
        {!collapsed && (
          <div className="flex flex-1 flex-col min-w-0 bg-background border-t-2 border-foreground">
            {renderHeader(true)}
            <main className="flex-1 overflow-y-auto px-5 py-5">
              {children}
            </main>
          </div>
        )}

        {/* Collapse / expand toggle — top-right edge of the panel.
            Hidden on /map since the panel is forcibly collapsed there. */}
        {!isMapRoute && (
          <button
            type="button"
            onClick={() => setUserCollapsed((c) => !c)}
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
        )}
      </aside>

      {/* Layer 3 — right detail drawer (slides in on pin / card click) */}
      <DesktopRightPanel open={rightOpen} />
    </div>
  );
}

/* ---------------- DesktopRightPanel ----------------
   420px slide-in drawer pinned to the right edge. Subscribes to the
   global selected-pin store so any pin click (map or left panel list)
   opens it. Slides with a 200ms transform from translateX(100%) → 0.
   ----------------------------------------------------------------- */
function DesktopRightPanel({ open }: { open: boolean }) {
  const selected = useSelectedPin();
  const navigate = useNavigate();

  /* When 'open' flips false we still need to render `selected` for the
     duration of the slide-out animation. We rely on the global store
     resetting after onClose, and the animation runs purely on the
     transform regardless. */

  const handleClose = () => setSelectedPin(null);

  const handleLogOutcome = (outcome: KnockOutcome) => {
    if (!selected) return;
    updatePins((prev) =>
      prev.map((x) => (x.id === selected.id ? { ...x, outcome } : x)),
    );
    setSelectedPin({ ...selected, outcome });
  };

  const handleQuote = () => {
    if (!selected) return;
    navigate({
      to: "/quote",
      search: { address: selected.address, mode: "quote" },
    });
  };

  return (
    <aside
      className="fixed right-0 z-30 flex flex-col bg-card border-l-2 border-foreground shadow-[-6px_0_0_0_color-mix(in_oklab,var(--foreground)_15%,transparent)] transition-transform duration-200 ease-out"
      style={{
        top: `${TOPBAR_H}px`,
        bottom: 0,
        width: `${RIGHT_PANEL_W}px`,
        transform: open ? "translateX(0)" : "translateX(100%)",
      }}
      aria-label="Detail panel"
      aria-hidden={!open}
    >
      {selected && (
        <>
          {/* Sticky header with address + close button */}
          <div className="bg-background border-b-2 border-foreground px-4 py-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                📍 Address
              </div>
              <h2 className="text-xl font-display font-bold uppercase truncate">
                {selected.address}
              </h2>
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                {OUTCOME_META[selected.outcome].full}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="press-brutal size-9 border-2 border-foreground bg-card flex items-center justify-center shrink-0"
              aria-label="Close detail panel"
            >
              <X className="size-4" strokeWidth={3} />
            </button>
          </div>

          {/* Scrollable content — reuses HouseCardBody so mobile + desktop
              detail flows stay perfectly in sync. */}
          <div className="flex-1 overflow-y-auto bg-background">
            <HouseCardBody
              pin={selected}
              onLogOutcome={handleLogOutcome}
              onQuote={handleQuote}
            />
          </div>
        </>
      )}
    </aside>
  );
}

/* ---------------- DesktopTopBar ----------------
   56px dark inverted strip across the full viewport. Holds the GIRAFFE
   wordmark, a center search field, and the user avatar (with a pending
   notification dot). Always visible above both panels and the map. */
function DesktopTopBar() {
  /* Hard-coded for now — wire to real pending count when available. */
  const hasPending = true;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-foreground text-background border-b-2 border-foreground"
      style={{ height: `${TOPBAR_H}px` }}
    >
      {/* Left — logo + wordmark */}
      <Link
        to="/"
        className="flex items-center gap-2.5 text-background"
        aria-label="Giraffe — go to Today"
      >
        <Logo tone="light" size={28} />
        <span className="font-mono font-bold uppercase tracking-widest text-base">
          GIRAFFE
        </span>
      </Link>

      {/* Center — global search */}
      <div className="flex-1 flex justify-center px-6">
        <label className="relative w-80 max-w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-background/60"
            strokeWidth={2.5}
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search address or client..."
            aria-label="Search address or client"
            className="w-80 max-w-full bg-background/10 border border-background/20 text-background placeholder:text-background/50 font-mono text-sm pl-9 pr-4 py-2 focus:outline-none focus:border-background/60 focus:bg-background/15"
            style={{ borderRadius: 0 }}
          />
        </label>
      </div>

      {/* Right — avatar + notification dot */}
      <Link
        to="/me"
        className="relative size-9 border-2 border-background/30 bg-background/10 flex items-center justify-center font-mono font-bold text-xs text-background hover:border-background/60 transition-colors"
        aria-label="My profile"
      >
        HG
        {hasPending && (
          <span
            className="absolute -top-1 -right-1 size-2.5 bg-[var(--amber)] border border-foreground"
            aria-label="Pending items"
          />
        )}
      </Link>
    </header>
  );
}

/* ---------------- Panel navigation ----------------
   Horizontal text tabs across the top of the expanded panel.
   Active tab = border-b-2 border-primary text-primary.
   Inactive   = text-muted-foreground hover:text-foreground.
   ------------------------------------------------------- */
const TAB_ITEMS = [
  { to: "/", label: "Today" },
  { to: "/deals", label: "Deals" },
  { to: "/map", label: "Map" },
  { to: "/clients", label: "Clients" },
  { to: "/me", label: "Me" },
] as const;

function PanelTabs() {
  const { pathname } = useLocation();
  return (
    <nav
      className="flex bg-card border-b-2 border-foreground"
      aria-label="Primary"
    >
      {TAB_ITEMS.map(({ to, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 text-center px-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors ${
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/* Collapsed (icon-only) fallback. Used when the panel is collapsed by the
   user OR forced collapsed on the /map route. Renders the same 5 tabs as
   stacked icon buttons for one-click navigation. */
function CollapsedNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="flex flex-col items-center gap-1 py-2 bg-card"
      style={{ width: `${PANEL_W_COLLAPSED}px` }}
      aria-label="Primary"
    >
      {TAB_ITEMS.map(({ to, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`size-9 flex items-center justify-center font-mono font-bold text-[10px] uppercase tracking-wider border-2 ${
              active
                ? "border-foreground bg-foreground text-background"
                : "border-transparent text-muted-foreground hover:border-foreground hover:text-foreground"
            }`}
            aria-label={label}
            title={label}
            aria-current={active ? "page" : undefined}
          >
            {label.slice(0, 2)}
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
