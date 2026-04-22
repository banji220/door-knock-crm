import { useEffect, useState } from "react";

const MOBILE_MAX = 639; // < 640 = mobile
const TABLET_MAX = 1023; // 640..1023 = tablet, >=1024 = desktop

export type Breakpoint = "mobile" | "tablet" | "desktop";

function getBreakpoint(width: number): Breakpoint {
  if (width <= MOBILE_MAX) return "mobile";
  if (width <= TABLET_MAX) return "tablet";
  return "desktop";
}

/** SSR-safe responsive breakpoint hook. Returns "desktop" until mounted. */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("desktop");

  useEffect(() => {
    const update = () => setBp(getBreakpoint(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return bp;
}
