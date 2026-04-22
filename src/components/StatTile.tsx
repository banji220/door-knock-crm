type Props = {
  label: string;
  value: string | number;
  accent?: boolean;
};

export function StatTile({ label, value, accent }: Props) {
  return (
    <div
      className={`border-brutal-thick p-3 ${
        accent ? "bg-ink text-cream" : "bg-card"
      }`}
    >
      <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">
        {label}
      </div>
      <div className="text-3xl font-display mt-1 leading-none">{value}</div>
    </div>
  );
}
