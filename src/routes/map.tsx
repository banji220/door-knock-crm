import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { HouseCard, HouseCardBody } from "@/components/HouseCard";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { Search, Crosshair, Plus, X } from "lucide-react";
import {
  housePins,
  OUTCOME_META,
  STREET_CENTER,
  MAPBOX_TOKEN,
  type HousePin,
} from "@/lib/map-data";
import type { KnockOutcome } from "@/lib/mock-data";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

const SIDEBAR_W = 240; // matches AppShell

function MapPage() {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  if (isDesktop) {
    return <DesktopMapPage />;
  }
  return <MobileMapPage />;
}

/* ============================================================
   Desktop Map — full-bleed mapbox right of the 240px sidebar.
   Controls float top-left over the map. Selecting a pin slides
   in a 420px right detail drawer.
   ============================================================ */
function DesktopMapPage() {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [pins, setPins] = useState<HousePin[]>(housePins);
  const [selected, setSelected] = useState<HousePin | null>(null);
  const [filter, setFilter] = useState<HousePin["outcome"] | "all">("all");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; place_name: string; center: [number, number] }>
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);

  /* Sidebar handles routing — we don't render an AppShell here so the
     map can fill the entire remaining viewport edge to edge. */

  /* Init map once */
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: STREET_CENTER,
      zoom: 16,
      pitch: 0,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* Draw / update pins. We keep markers keyed by id so we don't recreate
     them on every selection toggle. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const draw = () => {
      // Remove markers for pins that no longer exist
      const ids = new Set(pins.map((p) => p.id));
      markersRef.current.forEach((m, id) => {
        if (!ids.has(id)) {
          m.remove();
          markersRef.current.delete(id);
        }
      });

      // Add / update markers
      pins.forEach((p) => {
        const meta = OUTCOME_META[p.outcome];
        const isSel = selected?.id === p.id;
        let marker = markersRef.current.get(p.id);
        if (!marker) {
          const el = document.createElement("button");
          el.className =
            "press-brutal cursor-pointer border-2 border-foreground font-mono font-bold flex items-center justify-center";
          el.style.width = "32px";
          el.style.height = "32px";
          el.style.borderRadius = "0";
          el.style.fontSize = "12px";
          el.addEventListener("click", (e) => {
            e.stopPropagation();
            setSelected(p);
          });
          marker = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([p.lng, p.lat])
            .addTo(map);
          markersRef.current.set(p.id, marker);
        }
        const el = marker.getElement();
        el.style.background = meta.color;
        el.style.color = ["booked", "quoted"].includes(p.outcome)
          ? "var(--background)"
          : "var(--foreground)";
        el.textContent = meta.label;
        el.setAttribute("aria-label", `${p.address} — ${meta.full}`);
        el.style.outline = isSel ? "3px solid var(--primary)" : "none";
        el.style.outlineOffset = isSel ? "2px" : "0";
        el.style.zIndex = isSel ? "10" : "1";
        el.style.transform = isSel ? "scale(1.12)" : "scale(1)";
        el.style.transition = "transform 0.15s ease-out";
        // Apply filter as opacity
        const passes =
          filter === "all" || p.outcome === filter;
        el.style.opacity = passes ? "1" : "0.25";
        el.style.pointerEvents = passes ? "auto" : "none";
      });
    };
    if (map.loaded()) draw();
    else map.once("load", draw);
  }, [pins, selected, filter]);

  /* Pan to selected pin, accounting for the right detail drawer width */
  useEffect(() => {
    if (!selected || !mapRef.current) return;
    const map = mapRef.current;
    const rightInset = 420 + 24;
    map.flyTo({
      center: [selected.lng, selected.lat],
      zoom: Math.max(map.getZoom(), 16.5),
      duration: 600,
      padding: { top: 80, bottom: 60, left: 80, right: rightInset },
    });
  }, [selected]);

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
        userMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(ll).addTo(mapRef.current!);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

  /* Address geocoding (debounced) */
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
    setPins((p) => p.map((x) => (x.id === selected.id ? { ...x, outcome } : x)));
    setSelected((s) => (s ? { ...s, outcome } : s));
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: pins.length };
    for (const p of pins) c[p.outcome] = (c[p.outcome] ?? 0) + 1;
    return c;
  }, [pins]);

  const filterChips: Array<{
    key: HousePin["outcome"] | "all";
    label: string;
    color: string;
  }> = [
    { key: "all", label: "All", color: "var(--muted)" },
    ...(Object.entries(OUTCOME_META) as [HousePin["outcome"], typeof OUTCOME_META[HousePin["outcome"]]][])
      .map(([k, v]) => ({ key: k, label: v.full, color: v.color })),
  ];

  const drawerOpen = selected !== null;

  return (
    <div className="hidden lg:block">
      <DesktopSidebar />

      {/* Map fills the remaining viewport */}
      <div
        className="fixed inset-0 bg-background"
        style={{ left: `${SIDEBAR_W}px` }}
      >
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Floating controls — top-left */}
        <div className="absolute top-5 left-5 z-20 w-96 max-w-[calc(100%-2.5rem)]">
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

          {/* Filters */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {filterChips.map((f) => {
              const active = filter === f.key;
              const count = counts[f.key as string] ?? 0;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`press-brutal flex items-center gap-2 px-2.5 py-1.5 border-2 border-foreground text-[11px] font-mono font-bold uppercase tracking-wider ${
                    active ? "bg-foreground text-background" : "bg-card"
                  }`}
                >
                  <span
                    className="inline-block w-2.5 h-2.5 border border-foreground"
                    style={{ background: f.color }}
                  />
                  {f.label}
                  <span className="tabular-nums opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recenter button — top-right (avoids drawer when open) */}
        <button
          onClick={recenterGPS}
          className="press-brutal absolute top-5 z-20 size-11 border-2 border-foreground bg-card flex items-center justify-center transition-[right] duration-200 ease-out"
          style={{ right: drawerOpen ? `${420 + 20}px` : "20px" }}
          aria-label="Recenter to my location"
        >
          <Crosshair className="size-5" strokeWidth={2.5} />
        </button>

        {/* Knock-here button — bottom-right (avoids drawer when open) */}
        <button
          onClick={handleKnockHere}
          className="press-brutal absolute bottom-6 z-20 border-2 border-foreground bg-foreground text-background font-mono font-bold uppercase tracking-wider px-5 py-4 flex items-center gap-2 text-sm transition-[right] duration-200 ease-out"
          style={{ right: drawerOpen ? `${420 + 20}px` : "20px" }}
        >
          <Plus className="size-5" strokeWidth={3} />
          Knock at center
        </button>

        {/* Right detail drawer */}
        <aside
          className="absolute right-0 top-0 bottom-0 z-30 w-[420px] bg-card border-l-2 border-foreground flex flex-col transition-transform duration-200 ease-out"
          style={{ transform: drawerOpen ? "translateX(0)" : "translateX(100%)" }}
          aria-hidden={!drawerOpen}
          aria-label="Pin detail"
        >
          {selected && (
            <>
              <div className="bg-background border-b-2 border-foreground px-4 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    📍 Address
                  </div>
                  <h2 className="text-xl font-display font-bold uppercase truncate">
                    {selected.address}
                  </h2>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                    {OUTCOME_META[selected.outcome].full}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="press-brutal size-9 border-2 border-foreground bg-card flex items-center justify-center shrink-0"
                  aria-label="Close detail"
                >
                  <X className="size-4" strokeWidth={3} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-background">
                <HouseCardBody
                  pin={selected}
                  onLogOutcome={handleLogOutcome}
                  onQuote={() =>
                    navigate({
                      to: "/quote",
                      search: { address: selected.address, mode: "quote" },
                    })
                  }
                />
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ============================================================
   Mobile/Tablet — full-screen mapbox (unchanged UX)
   ============================================================ */
function MobileMapPage() {
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
        userMarkerRef.current = new mapboxgl.Marker({ element: el })
          .setLngLat(ll).addTo(mapRef.current!);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, []);

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
    setPins((p) => p.map((x) => (x.id === selected.id ? { ...x, outcome } : x)));
    setSelected((s) => (s ? { ...s, outcome } : s));
  };

  return (
    <div className="lg:hidden fixed inset-0 flex flex-col bg-background">
      <div ref={mapContainer} className="absolute inset-0 bottom-20" />

      <div className="absolute top-3 left-3 right-3 z-20 max-w-2xl mx-auto">
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

      <button
        onClick={recenterGPS}
        className="press-brutal absolute top-20 right-3 z-20 size-11 border-2 border-foreground bg-card flex items-center justify-center"
        aria-label="Recenter to my location"
      >
        <Crosshair className="size-5" strokeWidth={2.5} />
      </button>

      <button
        onClick={handleKnockHere}
        className="press-brutal absolute bottom-24 right-3 z-20 border-2 border-foreground bg-foreground text-background font-mono font-bold uppercase tracking-wider px-5 py-4 flex items-center gap-2 text-sm"
      >
        <Plus className="size-5" strokeWidth={3} />
        Knock Here
      </button>

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
