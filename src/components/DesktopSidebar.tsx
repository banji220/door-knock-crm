import { Link, useLocation } from "@tanstack/react-router";
import { Zap, Target, Map as MapIcon, Users, User } from "lucide-react";
import { Logo } from "./Logo";

type Item = {
  to: "/" | "/deals" | "/map" | "/clients" | "/me";
  label: string;
  icon: typeof Zap;
  badge?: number;
};

const items: Item[] = [
  { to: "/", label: "Today", icon: Zap, badge: 3 },
  { to: "/deals", label: "Deals", icon: Target, badge: 5 },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/me", label: "Me", icon: User },
];

/* =========================================================================
   DesktopSidebar — visible only on lg+ screens (≥1024px). The mobile
   BottomNav handles smaller screens. Fixed-width left rail with brand,
   nav list, and active-state highlighting.
   ========================================================================= */
export function DesktopSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-card border-r-2 border-foreground">
      {/* Brand */}
      <div className="px-5 py-5 border-b-2 border-foreground bg-[var(--amber)] flex items-center gap-3">
        <Logo tone="dark" size={40} />
        <div className="min-w-0">
          <div className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-foreground/70">
            Field CRM
          </div>
          <div className="mt-0.5 text-2xl font-display font-bold uppercase tracking-tight leading-none">
            Giraffe
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, badge }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`press-brutal flex items-center gap-3 px-3 py-3 border-2 ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-transparent hover:border-foreground hover:bg-muted text-foreground"
                  }`}
                >
                  <Icon
                    className="size-5 shrink-0"
                    strokeWidth={active ? 2.75 : 2.25}
                  />
                  <span className="font-mono font-bold uppercase tracking-wider text-sm flex-1">
                    {label}
                  </span>
                  {badge !== undefined && badge > 0 && (
                    <span
                      className={`min-w-[22px] h-[22px] px-1.5 border-2 border-foreground font-mono font-bold text-[10px] flex items-center justify-center leading-none tabular-nums ${
                        active
                          ? "bg-background text-foreground"
                          : "bg-destructive text-destructive-foreground"
                      }`}
                      aria-label={`${badge} pending`}
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t-2 border-foreground">
        <div className="flex items-center gap-3">
          <div className="size-9 border-2 border-foreground bg-[var(--amber)] flex items-center justify-center font-mono font-bold text-sm">
            HG
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono font-bold uppercase tracking-wider truncate">
              Holy Giraffe
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
              Pro
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
