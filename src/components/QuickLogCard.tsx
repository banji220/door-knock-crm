import { useState } from "react";
import { Label } from "./ui-brutal";

const INCREMENTS = [1, 5, 10, 25] as const;

type Props = {
  /** Called with the increment value when a button is tapped */
  onLog: (n: number) => void;
};

export function QuickLogCard({ onLog }: Props) {
  const [flashed, setFlashed] = useState<number | null>(null);

  const handleTap = (n: number) => {
    setFlashed(n);
    onLog(n);
    if (navigator.vibrate) navigator.vibrate(15);
    window.setTimeout(() => setFlashed(null), 180);
  };

  return (
    <section className="mb-5">
      <Label className="mb-2">Log Doors</Label>
      <div className="grid grid-cols-4 gap-2">
        {INCREMENTS.map((n) => {
          const isFlashed = flashed === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => handleTap(n)}
              aria-label={`Log ${n} door${n === 1 ? "" : "s"}`}
              className={`press-brutal border-2 border-foreground py-4 transition-colors duration-100 ${
                isFlashed
                  ? "bg-foreground text-background"
                  : "bg-card text-foreground"
              }`}
            >
              <span className="text-xl font-bold font-mono leading-none">
                +{n}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
