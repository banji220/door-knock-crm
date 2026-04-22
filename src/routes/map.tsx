import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { HouseCard } from "@/components/HouseCard";
import { AppShell, PageHeader } from "@/components/AppShell";
import {
  setSelectedPin,
  useSelectedPin,
  usePins,
  updatePins,
} from "@/components/PersistentMap";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { Search, Crosshair, Plus } from "lucide-react";
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

function MapPage() {
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  /* Desktop: render as a panel beside the persistent map. */
  if (isDesktop) {
    return <DesktopMapPanel />;
  }

  /* Mobile/Tablet: keep the original full-screen mapbox experience. */
  return <MobileMapPage />;
}

/* ============================================================
   Desktop — panel of filters, legend, and pin list
   ============================================================ */
function DesktopMapPanel() {
  const navigate = useNavigate();
  const pins = usePins();
  const selected = useSelectedPin();
  const [filter, setFilter] = useState<HousePin["outcome"] | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return pins.filter((p) => {
      const matchesFilter = filter === "all" ? true : p.outcome === filter;
      const matchesSearch = search.trim()
        ? p.address.toLowerCase().includes(search.toLowerCase()) ||
          (p.leadName ?? "").toLowerCase().includes(search.toLowerCase())
        : true;
      return matchesFilter && matchesSearch;
    });
  }, [pins, filter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: pins.length };
    for (const p of pins) c[p.outcome] = (c[p.outcome] ?? 0) + 1;
    return c;
  }, [pins]);

  const handleLogOutcome = (outcome: KnockOutcome) => {
    if (!selected) return;
    updatePins((prev) =>
      prev.map((x) => (x.id === selected.id ? { ...x, outcome } : x)),
    );
    setSelectedPin({ ...selected, outcome });
  };

  const handleKnockHere = () => {
    const newPin: HousePin = {
      id: `pin-${Date.now()}`,
      address: `New pin · ${STREET_CENTER[0].toFixed(4)}, ${STREET_CENTER[1].toFixed(4)}`,
      lng: STREET_CENTER[0],
      lat: STREET_CENTER[1],
      outcome: "untouched",
    };
    updatePins((p) => [...p, newPin]);
    setSelectedPin(newPin);
  };

  const filters: Array<{
    key: HousePin["outcome"] | "all";
    label: string;
    color: string;
  }> = [
    { key: "all", label: "All", color: "var(--muted)" },
    ...(Object.entries(OUTCOME_META) as [HousePin["outcome"], typeof OUTCOME_META[HousePin["outcome"]]][])
      .map(([k, v]) => ({ key: k, label: v.full, color: v.color })),
  ];

  return (
    <AppShell
      header={
        <PageHeader
          eyebrow="Map"
          title="Territory"
          meta={
            <>
              <span className="font-bold text-foreground">{pins.length}</span>{" "}
              pins · <span className="font-bold text-foreground">{counts.untouched ?? 0}</span> untouched
            </>
          }
        />
      }
    >
      {/* Search */}
      <div className="border-2 border-foreground bg-card flex items-center mb-4">
        <Search className="size-4 ml-3 shrink-0" strokeWidth={2.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search address or lead…"
          className="flex-1 bg-transparent px-2 py-3 font-mono text-sm focus:outline-none"
        />
      </div>

      {/* Filters / Legend */}
      <div className="mb-4">
        <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Filter
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
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

      {/* Knock here */}
      <button
        type="button"
        onClick={handleKnockHere}
        className="press-brutal w-full border-2 border-foreground bg-foreground text-background font-mono font-bold uppercase tracking-wider px-4 py-3 flex items-center justify-center gap-2 text-sm mb-4"
      >
        <Plus className="size-4" strokeWidth={3} />
        Knock at map center
      </button>

      {/* Pins list */}
      <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Pins · {filtered.length}
      </div>
      <ul className="space-y-1.5">
        {filtered.map((p) => {
          const meta = OUTCOME_META[p.outcome];
          const isSel = selected?.id === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedPin(p)}
                className={`press-brutal w-full text-left border-2 border-foreground bg-card p-2.5 flex items-center gap-3 ${
                  isSel ? "outline outline-2 outline-foreground -outline-offset-[3px]" : ""
                }`}
              >
                <span
                  className="size-7 shrink-0 border-2 border-foreground font-mono font-bold text-[11px] flex items-center justify-center"
                  style={{
                    background: meta.color,
                    color: ["booked", "quoted"].includes(p.outcome)
                      ? "var(--background)"
                      : "var(--foreground)",
                  }}
                  aria-hidden
                >
                  {meta.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-bold text-xs truncate">
                    {p.address}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
                    {p.leadName ?? meta.full}
                  </div>
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="border-2 border-dashed border-foreground p-4 text-center font-mono text-xs text-muted-foreground">
            No pins match
          </li>
        )}
      </ul>

      {/* Selected house sheet (overlays both panel and map) */}
      {selected && (
        <HouseCard
          pin={selected}
          onClose={() => setSelectedPin(null)}
          onLogOutcome={handleLogOutcome}
          onQuote={() =>
            navigate({
              to: "/quote",
              search: { address: selected.address, mode: "quote" },
            })
          }
        />
      )}
    </AppShell>
  );
}

/* ============================================================
   Mobile/Tablet — original full-screen mapbox layout (untouched UX)
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
    <div className="fixed inset-0 flex flex-col bg-background">
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
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>
    </div>
  );
}
