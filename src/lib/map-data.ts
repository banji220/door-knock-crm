import { mockKnocks, mockLeads, mockJobs, type KnockOutcome } from "./mock-data";

export type HousePin = {
  id: string;
  address: string;
  lng: number;
  lat: number;
  outcome: KnockOutcome | "untouched" | "avoid";
  leadName?: string;
  phone?: string;
  status?: string;
  ltv?: number;
  quotePrice?: number;
  anchor?: number;
};

/* Synthetic neighborhood pins around Hackney, London. We deliberately
   scatter them across a few streets so the desktop war-room view shows
   a believable territory rather than a single line of houses. */
const BASE_LNG = -0.0689;
const BASE_LAT = 51.5424;

/* Each entry pairs a display address with a hand-tuned offset (in
   roughly metres ÷ 100k) from BASE so the pins land on different
   streets / blocks on the map. */
const PIN_SEED: Array<{ address: string; dLng: number; dLat: number }> = [
  // Oak Street row (north–south)
  { address: "12 Oak Street", dLng: -0.00040, dLat:  0.00020 },
  { address: "14 Oak Street", dLng: -0.00040, dLat:  0.00060 },
  { address: "16 Oak Street", dLng: -0.00040, dLat:  0.00100 },
  { address: "18 Oak Street", dLng: -0.00040, dLat:  0.00140 },
  { address: "20 Oak Street", dLng: -0.00040, dLat:  0.00180 },
  { address: "22 Oak Street", dLng: -0.00040, dLat:  0.00220 },
  { address: "24 Oak Street", dLng: -0.00040, dLat:  0.00260 },
  { address: "26 Oak Street", dLng: -0.00040, dLat:  0.00300 },
  { address: "28 Oak Street", dLng: -0.00040, dLat:  0.00340 },
  { address: "30 Oak Street", dLng: -0.00040, dLat:  0.00380 },
  // Pine Avenue (east–west, north of Oak)
  { address:  "8 Pine Avenue", dLng:  0.00010, dLat:  0.00400 },
  { address: "12 Pine Avenue", dLng:  0.00060, dLat:  0.00400 },
  { address: "16 Pine Avenue", dLng:  0.00110, dLat:  0.00400 },
  // Birch Lane (south block)
  { address: "47 Birch Lane",  dLng:  0.00050, dLat: -0.00050 },
  { address: "49 Birch Lane",  dLng:  0.00100, dLat: -0.00050 },
  { address: "51 Birch Lane",  dLng:  0.00150, dLat: -0.00050 },
  // Elm Road (east side)
  { address: "33 Elm Road",    dLng:  0.00200, dLat:  0.00080 },
  { address: "35 Elm Road",    dLng:  0.00200, dLat:  0.00130 },
  // Maple Drive / Close cluster
  { address:  "9 Maple Drive", dLng:  0.00150, dLat:  0.00250 },
  { address: "21 Maple Close", dLng:  0.00190, dLat:  0.00220 },
  // Cedar Drive (corner)
  { address:  "5 Cedar Drive", dLng: -0.00100, dLat: -0.00080 },
  { address:  "7 Cedar Drive", dLng: -0.00150, dLat: -0.00080 },
];

export const housePins: HousePin[] = PIN_SEED.map((seed, i) => {
  const knock = mockKnocks.find((k) => k.address === seed.address);
  const lead = mockLeads.find((l) => l.address === seed.address);
  const job = mockJobs.find((j) => j.address === seed.address);

  /* Deterministic outcome for pins that don't have a real knock so the
     map shows a believable mix instead of all "untouched". */
  const fallback: HousePin["outcome"] = (() => {
    if (knock) return knock.outcome;
    const cycle = ["untouched", "no-answer", "untouched", "callback", "untouched", "quoted", "booked", "not-interested"] as const;
    return cycle[i % cycle.length];
  })();

  return {
    id: `pin-${i}`,
    address: seed.address,
    lng: BASE_LNG + seed.dLng,
    lat: BASE_LAT + seed.dLat,
    outcome: fallback,
    leadName: lead?.name,
    phone: lead?.phone,
    status: lead?.status,
    ltv: job ? job.price * 12 : undefined,
    quotePrice: job?.price ?? (fallback === "quoted" ? 40 : undefined),
    anchor: fallback === "quoted" ? 40 : undefined,
  };
});

export const OUTCOME_META: Record<
  KnockOutcome | "untouched" | "avoid",
  { label: string; color: string; full: string }
> = {
  booked: { label: "$", color: "var(--heatmap-5)", full: "Booked" },
  quoted: { label: "Q", color: "var(--heatmap-4)", full: "Quoted" },
  callback: { label: "C", color: "var(--heatmap-3)", full: "Callback" },
  "no-answer": { label: "NH", color: "var(--heatmap-1)", full: "No answer" },
  "not-interested": { label: "X", color: "var(--muted)", full: "Not interested" },
  untouched: { label: "·", color: "var(--heatmap-0)", full: "Untouched" },
  avoid: { label: "!", color: "var(--destructive)", full: "Avoid" },
};

export const STREET_CENTER: [number, number] = [BASE_LNG, BASE_LAT];

/* Mapbox public token — safe to commit (pk.*) */
export const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYmFuamkyMjAiLCJhIjoiY21ucnhpeTU0MDdkZTJwcHNtMHZscDFhZCJ9.LzDkx9cfc9G2btJOFyMFoQ";
