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

/* Synthetic pins along Oak Street, London (Hackney area) */
const BASE_LNG = -0.0689;
const BASE_LAT = 51.5424;
const STEP = 0.00012;

const ADDRESSES = [
  "12 Oak Street", "14 Oak Street", "16 Oak Street", "18 Oak Street",
  "20 Oak Street", "22 Oak Street", "24 Oak Street", "26 Oak Street",
  "28 Oak Street", "30 Oak Street", "8 Pine Avenue", "47 Birch Lane",
  "33 Elm Road", "9 Maple Drive", "5 Cedar Drive", "21 Maple Close",
];

export const housePins: HousePin[] = ADDRESSES.map((addr, i) => {
  const knock = mockKnocks.find((k) => k.address === addr);
  const lead = mockLeads.find((l) => l.address === addr);
  const job = mockJobs.find((j) => j.address === addr);
  const angle = i * 0.7;
  const lng = BASE_LNG + Math.cos(angle) * STEP * (i + 1) * 0.6;
  const lat = BASE_LAT + Math.sin(angle) * STEP * (i + 1) * 0.6 + i * STEP * 0.3;
  return {
    id: `pin-${i}`,
    address: addr,
    lng,
    lat,
    outcome: knock?.outcome ?? "untouched",
    leadName: lead?.name,
    phone: lead?.phone,
    status: lead?.status,
    ltv: job ? job.price * 12 : undefined,
    quotePrice: job?.price,
    anchor: knock?.outcome === "quoted" ? 40 : undefined,
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
