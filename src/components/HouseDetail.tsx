import { useMemo, useState } from "react";
import {
  X,
  Pencil,
  Check,
  Phone,
  MessageSquare,
  Navigation,
  PencilLine,
  MapPin,
} from "lucide-react";
import {
  mockKnocks,
  mockJobs,
  mockQuotes,
  mockCustomers,
  type KnockOutcome,
} from "@/lib/mock-data";
import { OUTCOME_META } from "@/lib/map-data";
import { formatMoney } from "@/lib/format";

/* ============================================================
   HouseDetail — READ-ONLY detail bottom sheet for an existing
   client / deal. Shows contact, money, service info, notes and
   timeline. Inline field editing per row (pencil → check). The
   capture form is opened ONLY when the user taps "Edit Quote".
   ============================================================ */

export type DetailStatus = "LEAD" | "QUOTED" | "CUSTOMER";

export type HouseDetailProps = {
  /** Address acts as the join key across mock collections. */
  address: string;
  /** Initial contact values (the sheet keeps a local editable copy). */
  initialName?: string;
  initialPhone?: string;
  initialEmail?: string;
  /** Used to colour the status badge / pick the money block. */
  status: DetailStatus;
  /** Close the sheet (no route change — overlay just unmounts). */
  onClose: () => void;
  /** Open the capture flow pre-filled with this address. */
  onEditQuote: () => void;
  /** Optional: confirm destructive actions in the parent. */
  onMarkAvoid?: () => void;
  onRemove?: () => void;
};

export function HouseDetail({
  address,
  initialName,
  initialPhone,
  initialEmail,
  status,
  onClose,
  onEditQuote,
  onMarkAvoid,
  onRemove,
}: HouseDetailProps) {
  /* ----- Inline editable contact fields ----- */
  const [name, setName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");

  /* ----- Notes (single free-text + tag chips) ----- */
  const initialNote = useMemo(() => {
    const k = mockKnocks.find((x) => x.address === address && x.notes);
    return k?.notes ?? "";
  }, [address]);
  const [note, setNote] = useState(initialNote);
  const [editingNote, setEditingNote] = useState(false);

  /* ----- Derived data from mocks ----- */
  const quote = useMemo(
    () => mockQuotes.find((q) => q.address === address),
    [address],
  );
  const customer = useMemo(
    () => mockCustomers.find((c) => c.address === address),
    [address],
  );
  const job = useMemo(
    () => mockJobs.find((j) => j.address === address),
    [address],
  );

  /* Anchor price = a soft "before" reference for the strike-through. */
  const anchorPrice = quote ? Math.round(quote.price * 1.25) : undefined;

  const tags = useMemo(() => {
    const t: string[] = [];
    if (note.toLowerCase().includes("dog")) t.push("Dog");
    if (note.toLowerCase().includes("gate")) t.push("Gate code");
    if (note.toLowerCase().includes("evening") || note.toLowerCase().includes("after"))
      t.push("Evenings");
    if (quote?.frequency === "monthly") t.push("Monthly");
    if (quote?.frequency === "bi-monthly") t.push("Bi-monthly");
    return t;
  }, [note, quote]);

  /* Combined timeline: knocks + jobs, newest first. */
  const timeline = useMemo(() => {
    type Row =
      | { kind: "knock"; id: string; outcome: KnockOutcome; ts: string; notes?: string }
      | { kind: "job"; id: string; status: string; price: number; ts: string };
    const rows: Row[] = [];
    for (const k of mockKnocks.filter((x) => x.address === address)) {
      rows.push({ kind: "knock", id: k.id, outcome: k.outcome, ts: k.timestamp, notes: k.notes });
    }
    for (const j of mockJobs.filter((x) => x.address === address)) {
      rows.push({ kind: "job", id: j.id, status: j.status, price: j.price, ts: j.scheduledFor });
    }
    return rows.sort((a, b) => +new Date(b.ts) - +new Date(a.ts));
  }, [address]);

  /* ----- Helpers ----- */
  const telHref = phone ? `tel:${phone.replace(/\s/g, "")}` : undefined;
  const smsHref = phone ? `sms:${phone.replace(/\s/g, "")}` : undefined;
  const navHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  const statusStyles: Record<DetailStatus, string> = {
    LEAD: "bg-card text-foreground",
    QUOTED: "bg-[var(--amber)] text-foreground",
    CUSTOMER: "bg-foreground text-background",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 flex items-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${address}`}
        className="w-full max-w-[480px] mx-auto max-h-[88vh] overflow-y-auto bg-background border-t-2 border-foreground animate-in slide-in-from-bottom duration-200"
      >
        {/* ---- Sticky header ---- */}
        <div className="sticky top-0 z-10 bg-background border-b-2 border-foreground px-4 py-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 border-2 border-foreground font-mono font-bold text-[10px] uppercase tracking-wider ${statusStyles[status]}`}
              >
                {status}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs font-mono text-muted-foreground truncate">
              <MapPin className="size-3 shrink-0" strokeWidth={2.5} />
              <span className="truncate">{address}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press-brutal size-9 border-2 border-foreground bg-card flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X className="size-4" strokeWidth={3} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* ============ CONTACT (inline editable) ============ */}
          <section className="space-y-2">
            <SectionLabel>Contact</SectionLabel>
            <InlineField
              label="Name"
              value={name}
              onChange={setName}
              placeholder="Add name"
            />
            <InlineField
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="Add phone"
              type="tel"
            />
            <InlineField
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="Add email"
              type="email"
            />
          </section>

          {/* ============ MONEY ============ */}
          <section>
            <SectionLabel>{status === "CUSTOMER" ? "Lifetime" : "Quote"}</SectionLabel>
            <div className="border-2 border-foreground bg-[var(--amber)] px-4 py-4">
              {status === "CUSTOMER" && customer ? (
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                      Lifetime Value
                    </div>
                    <div className="mt-1 text-4xl font-mono font-bold leading-none tabular-nums">
                      {formatMoney(customer.ltv)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                      Jobs
                    </div>
                    <div className="mt-1 text-3xl font-mono font-bold leading-none tabular-nums">
                      {customer.jobsDone}
                    </div>
                  </div>
                </div>
              ) : status === "QUOTED" && quote ? (
                <div>
                  {anchorPrice !== undefined && (
                    <div className="text-sm font-mono text-foreground/60 line-through tabular-nums">
                      {formatMoney(anchorPrice)}
                    </div>
                  )}
                  <div className="mt-0.5 text-4xl font-mono font-bold leading-none tabular-nums">
                    {formatMoney(quote.price)}
                  </div>
                  <div className="mt-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em]">
                    {quote.frequency.replace("-", " ")}
                  </div>
                </div>
              ) : (
                <div className="text-sm font-mono text-foreground/70">
                  No quote yet — tap{" "}
                  <span className="font-bold uppercase">Edit Quote</span> to start.
                </div>
              )}
            </div>
          </section>

          {/* ============ QUICK ACTIONS ============ */}
          <section>
            <SectionLabel>Actions</SectionLabel>
            <div className="grid grid-cols-4 gap-2">
              <ActionBtn
                href={telHref}
                disabled={!phone}
                icon={<Phone className="size-5" strokeWidth={2.5} />}
                label="Call"
              />
              <ActionBtn
                href={smsHref}
                disabled={!phone}
                icon={<MessageSquare className="size-5" strokeWidth={2.5} />}
                label="Text"
              />
              <ActionBtn
                href={navHref}
                icon={<Navigation className="size-5" strokeWidth={2.5} />}
                label="Nav"
              />
              <ActionBtn
                onClick={onEditQuote}
                icon={<PencilLine className="size-5" strokeWidth={2.5} />}
                label="Quote"
                accent
              />
            </div>
          </section>

          {/* ============ SERVICE DETAILS ============ */}
          {(quote || job) && (
            <section>
              <SectionLabel>Service</SectionLabel>
              <div className="border-2 border-foreground bg-card divide-y-2 divide-foreground">
                {quote?.windowCount !== undefined && (
                  <DetailRow label="Windows" value={`${quote.windowCount}`} />
                )}
                {quote?.frequency && (
                  <DetailRow
                    label="Frequency"
                    value={quote.frequency.replace("-", " ")}
                  />
                )}
                {job?.scheduledFor && (
                  <DetailRow
                    label="Scheduled"
                    value={fmtDate(job.scheduledFor)}
                  />
                )}
                {job?.status && (
                  <DetailRow label="Job status" value={job.status} />
                )}
              </div>
            </section>
          )}

          {/* ============ NOTES ============ */}
          <section>
            <SectionLabel>Notes</SectionLabel>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-2 py-0.5 border-2 border-foreground bg-card font-mono font-bold text-[10px] uppercase tracking-wider"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            {editingNote ? (
              <div className="border-2 border-foreground bg-card">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  rows={3}
                  autoFocus
                  className="w-full p-2 bg-transparent font-mono text-sm outline-none resize-none"
                  placeholder="Add a note…"
                />
                <div className="flex justify-end border-t-2 border-foreground">
                  <button
                    type="button"
                    onClick={() => setEditingNote(false)}
                    className="press-brutal px-3 py-2 font-mono font-bold text-[11px] uppercase tracking-wider flex items-center gap-1"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setEditingNote(true)}
                className="press-brutal w-full text-left border-2 border-foreground bg-card p-2 flex items-start justify-between gap-2"
              >
                <p className="font-mono text-sm whitespace-pre-wrap min-h-[1.25rem]">
                  {note || (
                    <span className="text-muted-foreground">Tap to add a note…</span>
                  )}
                </p>
                <Pencil className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={2.5} />
              </button>
            )}
          </section>

          {/* ============ TIMELINE ============ */}
          <section>
            <SectionLabel>History</SectionLabel>
            {timeline.length === 0 ? (
              <div className="border-2 border-dashed border-foreground/40 p-4 text-center">
                <p className="font-mono text-xs text-muted-foreground">
                  No history yet.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {timeline.map((t) => (
                  <li
                    key={t.id}
                    className="border-2 border-foreground bg-card p-2 flex items-start gap-2"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 mt-0.5 w-16">
                      {fmtShort(t.ts)}
                    </span>
                    {t.kind === "knock" ? (
                      <div className="min-w-0 flex-1">
                        <span
                          className="inline-flex items-center px-1.5 py-px border-2 border-foreground font-mono font-bold text-[10px] uppercase tracking-wider"
                          style={{ background: OUTCOME_META[t.outcome].color }}
                        >
                          {OUTCOME_META[t.outcome].full}
                        </span>
                        {t.notes && (
                          <p className="mt-1 text-xs font-mono text-muted-foreground truncate">
                            {t.notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <span className="inline-flex items-center px-1.5 py-px border-2 border-foreground font-mono font-bold text-[10px] uppercase tracking-wider bg-foreground text-background">
                          Job · {t.status}
                        </span>
                        <span className="ml-2 font-mono font-bold text-xs tabular-nums">
                          {formatMoney(t.price)}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ============ DANGER ZONE ============ */}
          <div className="pt-3 border-t-2 border-foreground/15 flex items-center justify-between">
            <button
              type="button"
              onClick={onMarkAvoid}
              className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-destructive"
            >
              Mark as avoid
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-destructive"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== Internal pieces ===================== */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-muted-foreground mb-2">
      {children}
    </div>
  );
}

function InlineField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "tel" | "email";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    onChange(draft.trim());
    setEditing(false);
  };

  return (
    <div className="border-2 border-foreground bg-card flex items-stretch">
      <div className="px-2 py-2 border-r-2 border-foreground font-mono font-bold text-[10px] uppercase tracking-wider w-16 flex items-center bg-background">
        {label}
      </div>
      {editing ? (
        <>
          <input
            type={type}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value.slice(0, 80))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            className="flex-1 px-2 bg-transparent font-mono text-sm outline-none min-w-0"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={commit}
            aria-label={`Save ${label}`}
            className="press-brutal px-3 border-l-2 border-foreground bg-[var(--amber)] flex items-center justify-center"
          >
            <Check className="size-4" strokeWidth={3} />
          </button>
        </>
      ) : (
        <>
          <div className="flex-1 px-2 py-2 font-mono text-sm truncate flex items-center min-w-0">
            {value || (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <button
            type="button"
            onClick={start}
            aria-label={`Edit ${label}`}
            className="press-brutal px-3 border-l-2 border-foreground bg-card flex items-center justify-center"
          >
            <Pencil className="size-3.5 text-muted-foreground" strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between px-3 py-2 gap-3">
      <span className="font-mono font-bold text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm font-bold uppercase tabular-nums truncate">
        {value}
      </span>
    </div>
  );
}

function ActionBtn({
  icon,
  label,
  href,
  onClick,
  disabled,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  const cls = `press-brutal h-11 border-2 border-foreground flex flex-col items-center justify-center gap-0.5 font-mono font-bold text-[9px] uppercase tracking-wider ${
    accent ? "bg-foreground text-background" : "bg-card"
  } ${disabled ? "opacity-40 pointer-events-none" : ""}`;
  if (href && !onClick) {
    return (
      <a href={href} className={cls} aria-label={label}>
        {icon}
        <span>{label}</span>
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls} aria-label={label}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ----- date helpers (UTC for SSR/CSR parity) ----- */
function fmtShort(iso: string) {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
