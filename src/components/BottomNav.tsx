import { Link, useLocation } from "@tanstack/react-router";
import { DoorOpen, FileText, Calendar, Bell, Users } from "lucide-react";

const items = [
  { to: "/", label: "Knock", icon: DoorOpen },
  { to: "/quote", label: "Quote", icon: FileText },
  { to: "/jobs", label: "Jobs", icon: Calendar },
  { to: "/follow-ups", label: "Chase", icon: Bell },
  { to: "/leads", label: "Leads", icon: Users },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 max-w-[480px] mx-auto bg-background border-t-2 border-foreground">
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <li key={to} className="border-r-2 border-foreground last:border-r-0">
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-1 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] press-brutal ${
                  active ? "bg-foreground text-background" : "text-foreground"
                }`}
              >
                <Icon className="size-6" strokeWidth={active ? 3 : 2.25} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
