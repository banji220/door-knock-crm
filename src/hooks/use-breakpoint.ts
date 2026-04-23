import { useEffect, useState } from "react";

/* =========================================================================
   Responsive breakpoint system — single source of truth.
   Mirrors the --breakpoint-* CSS tokens in styles.css.

   Mobile  :  0    – 640px
   Tablet  :  641  – 1024px
   Desktop :  1025px and up
   ========================================================================= */

export const BP = {
  MOBILE_MAX: 640,
  TABLET_MAX: 1024,
} as const;

export type Breakpoint = "mobile" | "tablet" | "desktop";

function getBreakpoint(width: number): Breakpoint {
  if (width <= BP.MOBILE_MAX) return "mobile";
  if (width <= BP.TABLET_MAX) return "tablet";
  return "desktop";
}

/** SSR-safe responsive breakpoint hook. Returns "desktop" until mounted to
 *  match the desktop-first server render and avoid hydration mismatches. */
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

/** Convenience flags. */
export function useIsDesktop() {
  return useBreakpoint() === "desktop";
}
export function useIsTablet() {
  return useBreakpoint() === "tablet";
}
export function useIsMobile() {
  return useBreakpoint() === "mobile";
}
