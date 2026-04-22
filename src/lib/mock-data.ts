export type KnockOutcome = "no-answer" | "not-interested" | "callback" | "quoted" | "booked";

export type Knock = {
  id: string;
  address: string;
  outcome: KnockOutcome;
  notes?: string;
  timestamp: string; // ISO
};

export type Lead = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  status: "cold" | "warm" | "hot" | "won" | "lost";
  notes?: string;
  lastContact: string;
};

export type Quote = {
  id: string;
  leadName: string;
  address: string;
  windowCount: number;
  frequency: "one-off" | "monthly" | "bi-monthly" | "quarterly";
  price: number;
  status: "draft" | "sent" | "accepted" | "declined";
  createdAt: string;
};

export type Job = {
  id: string;
  customerName: string;
  address: string;
  scheduledFor: string; // ISO
  price: number;
  status: "scheduled" | "in-progress" | "done" | "paid";
  routeOrder: number;
};

export type FollowUp = {
  id: string;
  leadName: string;
  address: string;
  reason: string;
  dueDate: string;
  priority: "low" | "med" | "high";
};

const today = new Date();
const iso = (d: Date) => d.toISOString();
const addDays = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
};
const addHours = (n: number) => {
  const d = new Date(today);
  d.setHours(d.getHours() + n);
  return d;
};

export const mockKnocks: Knock[] = [
  { id: "k1", address: "12 Oak Street", outcome: "booked", timestamp: iso(addHours(-1)), notes: "Wants monthly clean, £35" },
  { id: "k2", address: "14 Oak Street", outcome: "no-answer", timestamp: iso(addHours(-1)) },
  { id: "k3", address: "16 Oak Street", outcome: "not-interested", timestamp: iso(addHours(-2)) },
  { id: "k4", address: "18 Oak Street", outcome: "quoted", timestamp: iso(addHours(-2)), notes: "£40 quoted, will think" },
  { id: "k5", address: "20 Oak Street", outcome: "callback", timestamp: iso(addHours(-3)), notes: "Husband decides, evening" },
  { id: "k6", address: "22 Oak Street", outcome: "no-answer", timestamp: iso(addHours(-3)) },
];

export const mockLeads: Lead[] = [
  { id: "l1", name: "Sarah Mendez", address: "12 Oak Street", phone: "07700 900123", status: "won", lastContact: iso(addHours(-1)) },
  { id: "l2", name: "No 18 Oak", address: "18 Oak Street", phone: "07700 900222", status: "warm", lastContact: iso(addHours(-2)), notes: "£40 quoted" },
  { id: "l3", name: "Mr Patel", address: "20 Oak Street", phone: "07700 900456", status: "hot", lastContact: iso(addHours(-3)), notes: "Callback after 6pm" },
  { id: "l4", name: "Jenny Carter", address: "47 Birch Lane", phone: "07700 900789", status: "warm", lastContact: iso(addDays(-2)) },
  { id: "l5", name: "No 33 Elm", address: "33 Elm Road", status: "cold", lastContact: iso(addDays(-5)) },
];

export const mockQuotes: Quote[] = [
  { id: "q1", leadName: "Sarah Mendez", address: "12 Oak Street", windowCount: 8, frequency: "monthly", price: 35, status: "accepted", createdAt: iso(addHours(-1)) },
  { id: "q2", leadName: "No 18 Oak", address: "18 Oak Street", windowCount: 10, frequency: "bi-monthly", price: 40, status: "sent", createdAt: iso(addHours(-2)) },
  { id: "q3", leadName: "Jenny Carter", address: "47 Birch Lane", windowCount: 12, frequency: "monthly", price: 45, status: "sent", createdAt: iso(addDays(-2)) },
  { id: "q4", leadName: "Mr Patel", address: "20 Oak Street", windowCount: 9, frequency: "monthly", price: 38, status: "sent", createdAt: iso(addDays(-6)) },
  { id: "q5", leadName: "Helen Park", address: "9 Maple Drive", windowCount: 14, frequency: "bi-monthly", price: 55, status: "sent", createdAt: iso(addDays(-7)) },
];

export const mockJobs: Job[] = [
  { id: "j1", customerName: "Sarah Mendez", address: "12 Oak Street", scheduledFor: iso(addHours(2)), price: 35, status: "scheduled", routeOrder: 1 },
  { id: "j2", customerName: "Mike Reilly", address: "8 Pine Avenue", scheduledFor: iso(addHours(3)), price: 50, status: "scheduled", routeOrder: 2 },
  { id: "j3", customerName: "Linda Khan", address: "21 Maple Close", scheduledFor: iso(addHours(4)), price: 40, status: "scheduled", routeOrder: 3 },
  { id: "j4", customerName: "Tom Webb", address: "5 Cedar Drive", scheduledFor: iso(addDays(1)), price: 45, status: "scheduled", routeOrder: 1 },
];

/* APPOINTMENTS — quoted prospects with a confirmed time today */
export type Appointment = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  time: string; // ISO
  price?: number;
};
export const mockAppointments: Appointment[] = [
  { id: "a1", name: "Mr Patel", address: "20 Oak Street", phone: "07700 900456", time: iso(addHours(2)), price: 38 },
  { id: "a2", name: "No 18 Oak", address: "18 Oak Street", phone: "07700 900222", time: iso(addHours(5)), price: 40 },
];

export const mockFollowUps: FollowUp[] = [
  { id: "f1", leadName: "Mr Patel", address: "20 Oak Street", reason: "Callback after 6pm — quote", dueDate: iso(today), priority: "high" },
  { id: "f2", leadName: "No 18 Oak", address: "18 Oak Street", reason: "Chase quote — sent yesterday", dueDate: iso(addDays(-1)), priority: "med" },
  { id: "f3", leadName: "Jenny Carter", address: "47 Birch Lane", reason: "Confirm date for first clean", dueDate: iso(addDays(2)), priority: "med" },
  { id: "f4", leadName: "No 33 Elm", address: "33 Elm Road", reason: "Re-knock — was out", dueDate: iso(addDays(-3)), priority: "low" },
];

/* CUSTOMERS — won leads with job history */
export type Customer = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  ltv: number;             // lifetime value £
  jobsDone: number;
  lastJobAt: string;       // ISO
  recleanDueAt: string;    // ISO — when next clean is due
  reviewAsked: boolean;
};

export const mockCustomers: Customer[] = [
  {
    id: "c1", name: "Sarah Mendez", address: "12 Oak Street", phone: "07700 900123",
    ltv: 420, jobsDone: 12, lastJobAt: iso(addDays(-28)),
    recleanDueAt: iso(addDays(2)), reviewAsked: false,
  },
  {
    id: "c2", name: "Mike Reilly", address: "8 Pine Avenue", phone: "07700 900345",
    ltv: 600, jobsDone: 12, lastJobAt: iso(addDays(-30)),
    recleanDueAt: iso(addDays(0)), reviewAsked: false,
  },
  {
    id: "c3", name: "Linda Khan", address: "21 Maple Close", phone: "07700 900567",
    ltv: 320, jobsDone: 8, lastJobAt: iso(addDays(-45)),
    recleanDueAt: iso(addDays(-3)), reviewAsked: true,
  },
  {
    id: "c4", name: "Tom Webb", address: "5 Cedar Drive", phone: "07700 900678",
    ltv: 540, jobsDone: 12, lastJobAt: iso(addDays(-14)),
    recleanDueAt: iso(addDays(16)), reviewAsked: true,
  },
  {
    id: "c5", name: "Helen Park", address: "9 Maple Drive",
    ltv: 165, jobsDone: 3, lastJobAt: iso(addDays(-20)),
    recleanDueAt: iso(addDays(40)), reviewAsked: false,
  },
  {
    id: "c6", name: "James O'Connor", address: "44 Birch Lane", phone: "07700 900889",
    ltv: 1200, jobsDone: 24, lastJobAt: iso(addDays(-10)),
    recleanDueAt: iso(addDays(20)), reviewAsked: true,
  },
];

export const todayStats = {
  knocks: mockKnocks.length,
  quoted: mockKnocks.filter((k) => k.outcome === "quoted" || k.outcome === "booked").length,
  booked: mockKnocks.filter((k) => k.outcome === "booked").length,
  earned: mockJobs.filter((j) => j.status === "paid").reduce((s, j) => s + j.price, 0),
  pipeline: mockQuotes.filter((q) => q.status === "sent").reduce((s, q) => s + q.price, 0),
};
