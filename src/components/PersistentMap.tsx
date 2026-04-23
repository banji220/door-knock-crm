import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Crosshair, Layers } from "lucide-react";
import {
  housePins,
  OUTCOME_META,
  STREET_CENTER,
  MAPBOX_TOKEN,
  type HousePin,
} from "@/lib/map-data";

/* =========================================================================
   PersistentMap — singleton mapbox surface for the desktop command center.
   Mounted ONCE inside AppShell at lg+ and stays alive across route changes
   so the user never loses spatial context. Pin data is module-level state.
   ========================================================================= */

type Listener = (pin: HousePin | null) => void;
let selectedListeners: Listener[] = [];
let currentSelected: HousePin | null = null;

export function setSelectedPin(p: HousePin | null) {
  currentSelected = p;
  selectedListeners.forEach((l) => l(p));
}

export function useSelectedPin(): HousePin | null {
  const [pin, setPin] = useState<HousePin | null>(currentSelected);
  useEffect(() => {
    selectedListeners.push(setPin);
    return () => {
      selectedListeners = selectedListeners.filter((l) => l !== setPin);
    };
  }, []);
  return pin;
}

/* Module-level pins list so updates persist across route mounts */
let pinsState: HousePin[] = housePins;
let pinsListeners: Array<(p: HousePin[]) => void> = [];
export function updatePins(updater: (prev: HousePin[]) => HousePin[]) {
  pinsState = updater(pinsState);
  pinsListeners.forEach((l) => l(pinsState));
}
export function usePins(): HousePin[] {
  const [p, setP] = useState(pinsState);
  useEffect(() => {
    pinsListeners.push(setP);
    return () => {
      pinsListeners = pinsListeners.filter((l) => l !== setP);
    };
  }, []);
  return p;
}

export function PersistentMap({
  /** Left inset (px) — historically reserved a column for the panel; now usually 0 (full-bleed). */
  leftInset = 0,
  /** Top inset (px) for top bar — map starts below this. */
  topInset = 0,
  /** Width of the floating panel (px) — used to position map controls clear of it. */
  panelInset = 0,
}: {
  leftInset?: number;
  topInset?: number;
  panelInset?: number;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pins = usePins();

  /* Init map once */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: STREET_CENTER,
      zoom: 17,
      pitch: 0,
      attributionControl: false,
    });
    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-right",
    );
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Resize when insets change (panel collapses, top bar mounts, etc.) */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const t = setTimeout(() => map.resize(), 220);
    return () => clearTimeout(t);
  }, [leftInset, topInset, panelInset]);

  /* Render pins */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const draw = () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      pins.forEach((p) => {
        const meta = OUTCOME_META[p.outcome];
        const el = document.createElement("button");
        el.className =
          "press-brutal cursor-pointer border-2 border-foreground font-mono font-bold flex items-center justify-center";
        el.style.width = "32px";
        el.style.height = "32px";
        el.style.borderRadius = "0";
        el.style.background = meta.color;
        el.style.fontSize = "12px";
        el.style.color = ["booked", "quoted"].includes(p.outcome)
          ? "var(--background)"
          : "var(--foreground)";
        el.textContent = meta.label;
        el.setAttribute("aria-label", `${p.address} — ${meta.full}`);
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelectedPin(p);
          map.flyTo({ center: [p.lng, p.lat], zoom: 18, duration: 600 });
        });
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });
    };
    if (map.loaded()) draw();
    else map.once("load", draw);
  }, [pins]);

  const recenterGPS = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapRef.current!;
        const ll: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        map.flyTo({ center: ll, zoom: 18, duration: 800 });
        if (userMarkerRef.current) userMarkerRef.current.remove();
        const el = document.createElement("div");
        el.style.cssText = `
          width:18px;height:18px;border-radius:50%;
          background:var(--primary);border:2px solid var(--foreground);
          box-shadow:0 0 0 6px color-mix(in oklab, var(--primary) 25%, transparent);
        `;
        userMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(ll)
          .addTo(map);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  return (
    <>
      {/* Map fills the viewport (offset only by the top bar). Sits behind
          the floating panel (z-0). Stays stable across route changes. */}
      <div
        ref={mapContainer}
        className="fixed right-0 bottom-0 z-0"
        style={{ left: `${leftInset}px`, top: `${topInset}px` }}
        aria-label="Territory map"
      />

      {/* Map controls — top-right of the map area, just below the top bar. */}
      <div
        className="fixed z-20 flex flex-col gap-2"
        style={{ top: `${topInset + 16}px`, right: "1rem" }}
      >
        <button
          type="button"
          onClick={recenterGPS}
          className="press-brutal size-11 border-2 border-foreground bg-card flex items-center justify-center shadow-[3px_3px_0_0_var(--foreground)]"
          aria-label="Recenter to my location"
        >
          <Crosshair className="size-5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="press-brutal size-11 border-2 border-foreground bg-card flex items-center justify-center shadow-[3px_3px_0_0_var(--foreground)]"
          aria-label="Map layers"
        >
          <Layers className="size-5" strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}

/** Helper for non-field routes: get a reference to the active map for flyTo, etc. */
export function getMap(): mapboxgl.Map | null {
  return null; // reserved for future cross-route flyTo coordination
}
