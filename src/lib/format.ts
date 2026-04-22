/* Format a non-negative integer with comma thousand separators.
   Locale-independent so SSR + client render byte-identical strings. */
export function formatNumber(n: number): string {
  const sign = n < 0 ? "-" : "";
  const s = String(Math.abs(Math.trunc(n)));
  return sign + s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/* Format a money value as USD (en-US) with no decimals.
   Examples: 1234 → "$1,234", 0 → "$0", -50 → "-$50".
   We do the formatting manually instead of using Intl.NumberFormat
   so SSR and client always emit byte-identical strings (avoids
   hydration mismatches across runtimes / locales). */
export function formatMoney(n: number): string {
  const negative = n < 0;
  return (negative ? "-$" : "$") + formatNumber(Math.abs(n));
}
