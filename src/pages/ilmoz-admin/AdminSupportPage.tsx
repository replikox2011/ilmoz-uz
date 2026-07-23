import * as React from "react";
import { LifeBuoy, MessageSquare, Send, Clock, RefreshCw } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import {
  PageBody,
  SearchInput,
  FilterTabs,
  Pill,
  PillTone,
  StatCard,
  SectionCard,
  EmptyState,
  ErrorBanner,
} from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Ticket, TicketStatus, TicketPriority } from "../../types/admin";
import { cn } from "../../lib/utils";

type Filter = "all" | TicketStatus;

const STATUS_TONE: Record<TicketStatus, PillTone> = {
  open: "amber",
  pending: "sky",
  resolved: "emerald",
  closed: "neutral",
};
const PRIORITY_TONE: Record<TicketPriority, PillTone> = {
  low: "neutral",
  normal: "sky",
  high: "amber",
  urgent: "red",
};

export function AdminSupportPage() {
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Ticket | null>(null);
  const [reply, setReply] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.adminListTickets();
      setTickets(data);
      if (!selected && data.length > 0) setSelected(data[0]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => { load(); }, [load]);

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: tickets.length };
    for (const t of tickets) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [tickets]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => filter === "all" || t.status === filter).filter((t) => {
      if (!q) return true;
      return (
        t.subject.toLowerCase().includes(q) ||
        t.centerName.toLowerCase().includes(q) ||
        t.requester.toLowerCase().includes(q)
      );
    });
  }, [filter, search, tickets]);

  const open = counts.open ?? 0;
  const urgent = tickets.filter((t) => t.priority === "urgent").length;

  const resolve = async (t: Ticket) => {
    if (saving) return;
    setSaving(true);
    try {
      await repo.adminUpdateTicket(t.id, { status: "resolved" });
      setTickets((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "resolved" } : x));
      if (selected?.id === t.id) setSelected({ ...t, status: "resolved" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Support"
        subtitle="Tickets from organizations — triage, reply and resolve."
        crumbs={[{ label: "Support" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={LifeBuoy} label="Open tickets" value={open} sub="Needs response" color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={Clock} label="Pending" value={counts.pending ?? 0} sub="Awaiting user" color="bg-sky-500/20 text-sky-400" />
          <StatCard icon={MessageSquare} label="Urgent" value={urgent} sub="High priority" color="bg-red-500/20 text-red-400" />
          <StatCard icon={LifeBuoy} label="Total" value={tickets.length} sub="All tickets" color="bg-white/10 text-white/50" />
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <FilterTabs
            tabs={[
              { key: "all", label: "All" },
              { key: "open", label: "Open" },
              { key: "pending", label: "Pending" },
              { key: "resolved", label: "Resolved" },
              { key: "closed", label: "Closed" },
            ]}
            active={filter}
            onChange={setFilter}
            counts={counts}
          />
          <div className="ml-auto flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search tickets…" />
            <button
              onClick={load}
              disabled={loading}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-white/30">Loading tickets…</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
            <div className="space-y-2">
              {filtered.length === 0 && (
                <EmptyState icon={LifeBuoy} message={tickets.length === 0 ? "No support tickets yet" : "No tickets match this filter"} />
              )}
              {filtered.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left transition",
                    selected?.id === t.id
                      ? "border-amber-400/30 bg-amber-500/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
                  )}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-white">{t.subject}</p>
                    <Pill tone={PRIORITY_TONE[t.priority]}>{t.priority}</Pill>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span>{t.centerName} · {t.requester}</span>
                    <Pill tone={STATUS_TONE[t.status]}>{t.status}</Pill>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <SectionCard>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{selected.subject}</h3>
                    <p className="mt-0.5 text-xs text-white/40">
                      {selected.centerName} · {selected.requester} ·{" "}
                      {new Date(selected.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill tone={STATUS_TONE[selected.status]}>{selected.status}</Pill>
                    {selected.status !== "resolved" && selected.status !== "closed" && (
                      <button
                        onClick={() => resolve(selected)}
                        disabled={saving}
                        className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-40"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4 space-y-3">
                  <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3.5 text-sm text-white/70">
                    {selected.requester} from {selected.centerName} opened this ticket: "{selected.subject}"
                    ({selected.messages} messages in thread.)
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply…"
                    rows={2}
                    className="flex-1 resize-none rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none"
                  />
                  <button
                    disabled={!reply.trim()}
                    onClick={() => setReply("")}
                    className="flex items-center gap-1.5 rounded-2xl bg-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send
                  </button>
                </div>
              </SectionCard>
            )}
          </div>
        )}
      </PageBody>
    </div>
  );
}
