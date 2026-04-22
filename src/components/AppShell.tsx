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
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto bg-background border-x-[3px] border-ink">
      <header className="sticky top-0 z-40 bg-amber border-b-[3px] border-ink">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-2xl font-display uppercase text-ink">{title}</h1>
            {subtitle && (
              <p className="text-xs font-mono uppercase tracking-wide text-ink/70 mt-0.5">
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
