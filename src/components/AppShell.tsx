import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { DesktopSidebar } from "./DesktopSidebar";

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

/* =========================================================================
   AppShell
   - Mobile  (<640):  full-width single column, sticky header, bottom nav.
   - Tablet  (640+):  centered max-w-2xl column, side-bordered.
   - Desktop (≥1024): fixed left sidebar + wide main area. Bottom nav hidden.
   ========================================================================= */
export function AppShell({
  title,
  subtitle,
  right,
  header,
  children,
  wide = false,
}: AppShellProps) {
  const renderHeader = () =>
    header ? (
      <div className="sticky top-0 z-30 bg-card border-b-2 border-foreground">
        {header}
      </div>
    ) : (
      <header className="sticky top-0 z-30 bg-[var(--amber)] border-b-2 border-foreground">
        <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-5">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display font-bold uppercase text-foreground tracking-tight leading-none">
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

      {/* Desktop: sidebar + wide main */}
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
    <div className="px-4 py-4 lg:px-8 lg:py-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
            {eyebrow}
          </div>
          <h1 className="mt-1 text-2xl lg:text-4xl font-display font-bold tracking-tight leading-tight text-foreground">
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
