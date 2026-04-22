/**
 * Google Calendar connection helpers.
 *
 * NOTE: This is a local stub that tracks connection state in localStorage.
 * Replace with a real OAuth flow when a Google Calendar connector is wired up.
 */

const STORAGE_KEY = "giraffe.googleCalendarConnected";

export function isCalendarConnected(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function connectGoogleCalendar(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new Event("googleCalendar:changed"));
      resolve(true);
    } catch {
      resolve(false);
    }
  });
}

export function disconnectGoogleCalendar(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event("googleCalendar:changed"));
  } catch {
    // ignore
  }
}
