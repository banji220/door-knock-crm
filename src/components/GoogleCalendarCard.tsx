import { useEffect, useState } from "react";
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  isCalendarConnected,
} from "@/lib/google-calendar";

export function GoogleCalendarCard() {
  const [connected, setConnected] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConnected(isCalendarConnected());
    const onChange = () => setConnected(isCalendarConnected());
    window.addEventListener("googleCalendar:changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("googleCalendar:changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectGoogleCalendar();
      setConnected(isCalendarConnected());
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    disconnectGoogleCalendar();
    setConnected(false);
  };

  // Avoid SSR/CSR mismatch — localStorage is client-only.
  const showConnected = mounted && connected;

  return (
    <section className="border-2 border-foreground bg-card p-4 mb-6">
      <div className="flex items-center gap-2">
        <span aria-hidden="true">📅</span>
        <span className="text-xs font-mono font-bold uppercase tracking-wider">
          Google Calendar
        </span>
      </div>

      {showConnected ? (
        <>
          <div className="mt-3 text-xs font-mono font-bold uppercase tracking-wider text-primary">
            ✓ Calendar Connected
          </div>
          <p className="mt-1 text-xs font-mono text-muted-foreground">
            Jobs and follow-ups auto-sync to Google Calendar.
          </p>
          <button
            type="button"
            onClick={handleDisconnect}
            className="mt-3 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive"
          >
            Disconnect
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-xs font-mono text-muted-foreground">
            Connect to auto-sync jobs and follow-ups to your calendar.
          </p>
          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            className="mt-3 w-full bg-foreground text-background border-2 border-foreground font-mono font-bold text-sm uppercase tracking-wider py-2.5 active:translate-y-[2px] disabled:opacity-60"
          >
            {busy ? "Connecting…" : "Connect Calendar"}
          </button>
        </>
      )}
    </section>
  );
}
