import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { BottomNav } from "@/components/BottomNav";
import { HouseCard } from "@/components/HouseCard";
import { Search, Crosshair, Plus } from "lucide-react";
import {
  housePins, OUTCOME_META, STREET_CENTER, MAPBOX_TOKEN, type HousePin,
} from "@/lib/map-data";
import type { KnockOutcome } from "@/lib/mock-data";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [pins, setPins] = useState<HousePin[]>(housePins);
  const [selected, setSelected] = useState<HousePin | null>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; place_name: string; center: [number, number] }>
  >([]);
  const navigate = useNavigate();

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
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Render pins whenever data changes */
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
          setSelected(p);
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

  /* GPS tracking */
  const recenterGPS = useCallback(() => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapRef.current!;
        const ll: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        map.flyTo({ center: ll, zoom: 18, duration: 800 });

        if (userMarkerRef.current) userMarkerRef.current.remove();
        const el = document.createElement("div");
        el.style.cssText = `
          width:18px;height:18px;border-radius:50%;
          background:var(--primary);border:2px solid var(--foreground);
          box-shadow:0 0 0 6px color-mix(in oklab, var(--primary) 25%, transparent);
        `;
        if (pos.coords.heading != null && !isNaN(pos.coords.heading)) {
          const arrow = document.createElement("div");
          arrow.style.cssText = `
            position:absolute;top:-12px;left:50%;
            width:0;height:0;border-left:6px solid transparent;
            border-right:6px solid transparent;border-bottom:10px solid var(--primary);
            transform:translateX(-50%) rotate(${pos.coords.heading}deg);
            transform-origin:50% 18px;
          `;
          el.style.position = "relative";
          el.appendChild(arrow);
        }
        userMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(ll).addTo(mapRef.current!);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  /* Geocoder search via Mapbox API */
  useEffect(() => {
    if (!search.trim() || search.length < 3) {
      setSearchResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          search,
        )}.json?access_token=${MAPBOX_TOKEN}&limit=5&proximity=${STREET_CENTER[0]},${STREET_CENTER[1]}`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        setSearchResults(
          (data.features ?? []).map((f: { id: string; place_name: string; center: [number, number] }) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center,
          })),
        );
      } catch {
        /* ignore */
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [search]);

  const handleSelectResult = (center: [number, number], name: string) => {
    mapRef.current?.flyTo({ center, zoom: 17, duration: 700 });
    setSearch(name);
    setSearchResults([]);
    setSearchOpen(false);
  };

  const handleKnockHere = () => {
    if (!mapRef.current) return;
    const center = mapRef.current.getCenter();
    const newPin: HousePin = {
      id: `pin-${Date.now()}`,
      address: `New pin · ${center.lng.toFixed(4)}, ${center.lat.toFixed(4)}`,
      lng: center.lng,
      lat: center.lat,
      outcome: "untouched",
    };
    setPins((p) => [...p, newPin]);
    setSelected(newPin);
  };

  const handleLogOutcome = (outcome: KnockOutcome) => {
    if (!selected) return;
    setPins((p) =>
      p.map((x) => (x.id === selected.id ? { ...x, outcome } : x)),
    );
    setSelected((s) => (s ? { ...s, outcome } : s));
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Map surface */}
      <div ref={mapContainer} className="absolute inset-0 bottom-20" />

      {/* Search bar */}
      <div className="absolute top-3 left-3 right-3 z-20 max-w-[480px] mx-auto">
        <div className="border-2 border-foreground bg-card flex items-center">
          <Search className="size-4 ml-3 shrink-0" strokeWidth={2.5} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search address or street…"
            className="flex-1 bg-transparent px-2 py-3 font-mono text-sm focus:outline-none"
          />
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div className="mt-1 border-2 border-foreground bg-card max-h-60 overflow-y-auto">
            {searchResults.map((r) => (
              <button
                key={r.id}
                onClick={() => handleSelectResult(r.center, r.place_name)}
                className="w-full text-left px-3 py-2 font-mono text-xs border-b-2 border-foreground/10 last:border-0 hover:bg-[var(--accent)]"
              >
                {r.place_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* GPS recenter — top right under search */}
      <button
        onClick={recenterGPS}
        className="press-brutal absolute top-20 right-3 z-20 size-11 border-2 border-foreground bg-card flex items-center justify-center"
        aria-label="Recenter to my location"
      >
        <Crosshair className="size-5" strokeWidth={2.5} />
      </button>

      {/* Knock Here FAB */}
      <button
        onClick={handleKnockHere}
        className="press-brutal absolute bottom-24 right-3 z-20 border-2 border-foreground bg-foreground text-background font-mono font-bold uppercase tracking-wider px-5 py-4 flex items-center gap-2 text-sm"
      >
        <Plus className="size-5" strokeWidth={3} />
        Knock Here
      </button>

      {/* House sheet */}
      {selected && (
        <HouseCard
          pin={selected}
          onClose={() => setSelected(null)}
          onLogOutcome={handleLogOutcome}
          onQuote={() => navigate({ to: "/quote", search: { address: selected.address, mode: "quote" } })}
        />
      )}

      <BottomNav />
    </div>
  );
}
