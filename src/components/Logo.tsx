import logoUrl from "@/assets/giraffe-logo.png";

type LogoProps = {
  /** Render the logo in light (white) or dark (foreground) tone. */
  tone?: "light" | "dark";
  /** Pixel size (square). */
  size?: number;
  className?: string;
};

/* =========================================================================
   Logo — the Giraffe "G" mark.
   The source asset is a white silhouette on transparent. For dark
   backgrounds we render it as-is; for light backgrounds we invert it
   via a CSS filter so it appears in the foreground ink color.
   ========================================================================= */
export function Logo({ tone = "light", size = 28, className = "" }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt="Giraffe"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      style={{
        filter: tone === "dark" ? "invert(1)" : "none",
        objectFit: "contain",
      }}
      draggable={false}
    />
  );
}
