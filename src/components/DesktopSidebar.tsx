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
   DesktopSidebar — 240px fixed dark rail (lg+ only).
   Layout:
   - Top: GIRAFFE wordmark + FIELD CRM eyebrow
   - Middle: nav stack (icon + label + optional badge)
   - Bottom: avatar + name + sign-out link
   The sidebar is `bg-foreground text-background` (inverted) and stays
   pinned to the left edge across every desktop route.
   ========================================================================= */
export function DesktopSidebar() {
  const { pathname } = useLocation();

  return (
    <aside
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-foreground text-background"
      aria-label="Primary navigation"
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <Logo tone="light" size={36} />
        <div className="min-w-0">
          <div className="font-mono font-bold uppercase tracking-[0.3em] text-sm leading-none text-background">
            GIRAFFE
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-background/50 leading-none">
            Field CRM
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon, badge }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={[
                    "press-brutal flex items-center gap-3 px-4 py-3 text-sm font-mono font-bold uppercase tracking-wider relative",
                    active
                      ? "bg-background/15 text-background"
                      : "text-background/70 hover:bg-background/10 hover:text-background",
                  ].join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  {/* Active left bar */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary"
                    />
                  )}
                  <Icon
                    className="size-5 shrink-0"
                    strokeWidth={active ? 2.75 : 2.25}
                  />
                  <span className="flex-1">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span
                      className={[
                        "min-w-[22px] h-[22px] px-1.5 border-2 font-mono font-bold text-[10px] flex items-center justify-center leading-none tabular-nums",
                        active
                          ? "border-background bg-background text-foreground"
                          : "border-background/40 bg-transparent text-background",
                      ].join(" ")}
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

      {/* Footer — user + sign out */}
      <div className="px-4 py-4 border-t border-background/10">
        <div className="flex items-center gap-3">
          <div className="size-10 border-2 border-background/20 bg-background/10 flex items-center justify-center font-mono font-bold text-xs text-background shrink-0">
            HG
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono font-bold uppercase tracking-wider truncate text-background">
              Holy Giraffe
            </div>
            <button
              type="button"
              className="mt-0.5 text-[10px] font-mono uppercase tracking-wider text-background/50 hover:text-background"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
