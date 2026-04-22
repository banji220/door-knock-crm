import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Override the entire header (e.g. for a richer page-header layout) */
  header?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, right, header, children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto bg-background border-x-2 border-foreground">
      {header ? (
        <div className="sticky top-0 z-40 bg-card border-b-2 border-foreground">
          {header}
        </div>
      ) : (
        <header className="sticky top-0 z-40 bg-[var(--amber)] border-b-2 border-foreground">
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
      )}
      <main
        className="flex-1 px-4 pt-4"
        style={{
          paddingBottom: "calc(7rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>
      <BottomNav />
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
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary">
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
