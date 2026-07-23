import * as React from "react";
import { Receipt, CheckCircle2, Clock, XCircle, RotateCcw, RefreshCw } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import {
  PageBody,
  SearchInput,
  FilterTabs,
  Table,
  Th,
  Td,
  Tr,
  EmptyState,
  Pill,
  PillTone,
  StatCard,
  ErrorBanner,
  SkeletonRows,
} from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { PlatformPayment, PlatformPaymentStatus } from "../../types/admin";
import { formatMoney } from "../../lib/utils";

type Filter = "all" | PlatformPaymentStatus;

const STATUS: Record<PlatformPaymentStatus, { tone: PillTone; icon: React.ComponentType<{ className?: string }> }> = {
  succeeded: { tone: "emerald", icon: CheckCircle2 },
  pending: { tone: "amber", icon: Clock },
  failed: { tone: "red", icon: XCircle },
  refunded: { tone: "violet", icon: RotateCcw },
};

export function AdminPaymentsPage() {
  const [payments, setPayments] = React.useState<PlatformPayment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.adminListPlatformPayments();
      setPayments(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: payments.length };
    for (const p of payments) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [payments]);

  const totals = React.useMemo(() => {
    const succeeded = payments.filter((p) => p.status === "succeeded");
    return {
      gross: succeeded.reduce((s, p) => s + p.amount, 0),
      pending: payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0),
      refunded: payments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0),
      failed: counts.failed ?? 0,
    };
  }, [payments, counts]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => filter === "all" || p.status === filter).filter((p) => {
      if (!q) return true;
      return (
        p.centerName.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [filter, search, payments]);

  return (
    <div>
      <AdminHeader
        title="Payments"
        subtitle="SaaS billing across all organizations — succeeded, pending, failed and refunds."
        crumbs={[{ label: "Payments" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={CheckCircle2} label="Collected" value={formatMoney(totals.gross, "USD")} sub="Succeeded" color="bg-emerald-500/20 text-emerald-400" />
          <StatCard icon={Clock} label="Pending" value={formatMoney(totals.pending, "USD")} sub="Awaiting capture" color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={RotateCcw} label="Refunded" value={formatMoney(totals.refunded, "USD")} sub="This period" color="bg-violet-500/20 text-violet-400" />
          <StatCard icon={XCircle} label="Failed" value={totals.failed} sub="Needs attention" color="bg-red-500/20 text-red-400" />
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <FilterTabs
            tabs={[
              { key: "all", label: "All" },
              { key: "succeeded", label: "Succeeded" },
              { key: "pending", label: "Pending" },
              { key: "failed", label: "Failed" },
              { key: "refunded", label: "Refunded" },
            ]}
            active={filter}
            onChange={setFilter}
            counts={counts}
          />
          <div className="ml-auto flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search center, method, id…" />
            <button
              onClick={load}
              disabled={loading}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <Table
          head={
            <>
              <Th>Payment</Th>
              <Th>Organization</Th>
              <Th>Plan</Th>
              <Th>Method</Th>
              <Th>Date</Th>
              <Th className="text-right">Amount</Th>
              <Th>Status</Th>
            </>
          }
        >
          {loading ? (
            <SkeletonRows cols={7} />
          ) : (
            filtered.map((p) => {
              const s = STATUS[p.status];
              const Icon = s.icon;
              return (
                <Tr key={p.id}>
                  <Td className="font-mono text-xs text-white/45">{p.id}</Td>
                  <Td className="text-white">{p.centerName}</Td>
                  <Td>
                    <Pill tone={p.tier === "pro" ? "amber" : p.tier === "standard" ? "sky" : "neutral"}>
                      {p.tier} · {p.cycle}
                    </Pill>
                  </Td>
                  <Td className="text-white/60">{p.method}</Td>
                  <Td className="text-xs text-white/40">{new Date(p.createdAt).toLocaleDateString()}</Td>
                  <Td className="text-right font-mono text-white/80">{formatMoney(p.amount, p.currency)}</Td>
                  <Td>
                    <Pill tone={s.tone}>
                      <Icon className="h-3 w-3" />
                      {p.status}
                    </Pill>
                  </Td>
                </Tr>
              );
            })
          )}
        </Table>
        {!loading && filtered.length === 0 && (
          <EmptyState icon={Receipt} message={payments.length === 0 ? "No payments recorded yet" : "No payments match this filter"} />
        )}
      </PageBody>
    </div>
  );
}
