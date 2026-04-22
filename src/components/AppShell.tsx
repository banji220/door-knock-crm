import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function AppShell({ title, subtitle, right, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto bg-background border-x-2 border-foreground">
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
      <main className="flex-1 pb-28 px-4 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
