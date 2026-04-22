import { Link, useLocation } from "@tanstack/react-router";
import { Zap, Target, Map, Users, User } from "lucide-react";

type Item = {
  to: "/" | "/deals" | "/map" | "/clients" | "/me";
  label: string;
  icon: typeof Zap;
  badge?: number;
  center?: boolean;
};

const items: Item[] = [
  { to: "/", label: "Today", icon: Zap, badge: 3 },
  { to: "/deals", label: "Deals", icon: Target, badge: 5 },
  { to: "/map", label: "Map", icon: Map, center: true },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/me", label: "Me", icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 max-w-2xl mx-auto bg-card border-t-2 border-foreground sm:border-x-2 sm:border-foreground">
      <ul className="grid grid-cols-5 items-end">
        {items.map(({ to, label, icon: Icon, badge, center }) => {
          const active = pathname === to;
          return (
            <li
              key={to}
              className="border-r-2 border-foreground last:border-r-0 relative"
            >
              <Link
                to={to}
                className={`relative flex flex-col items-center justify-center gap-1 press-brutal ${
                  center ? "py-4 bg-foreground text-background" : "py-3"
                } pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
                  active && !center ? "text-primary" : ""
                } ${active && center ? "bg-primary text-primary-foreground" : ""}`}
              >
                <Icon
                  className={center ? "size-8" : "size-6"}
                  strokeWidth={active || center ? 2.75 : 2.25}
                />
                <span
                  className={`font-mono font-bold uppercase tracking-[0.15em] ${
                    center ? "text-[11px]" : "text-[10px]"
                  }`}
                >
                  {label}
                </span>
                {badge !== undefined && badge > 0 && (
                  <span
                    className="absolute top-1.5 right-3 min-w-[18px] h-[18px] px-1 border-2 border-foreground bg-destructive text-destructive-foreground font-mono font-bold text-[10px] flex items-center justify-center leading-none"
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
  );
}
