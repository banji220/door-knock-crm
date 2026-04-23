/* Brutalist KPI tile — used in the desktop KPI row.
   Big mono number on top, tiny uppercase label below. */
export function KpiTile({
  value,
  label,
  accent = false,
}: {
  value: string | number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="border-2 border-foreground bg-card px-5 py-4">
      <div
        className={[
          "text-3xl font-bold font-mono leading-none tabular-nums",
          accent ? "text-primary" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </div>
      <div className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
