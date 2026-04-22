import { useEffect, useState } from "react";

/* SSR-safe localStorage hook. Returns initial value on first render
   (server + first client paint) then hydrates from storage. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore parse / access errors */
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore quota / access errors */
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}
