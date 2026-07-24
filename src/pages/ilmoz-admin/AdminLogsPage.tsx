import * as React from "react";
import { ScrollText, CheckCircle2, XCircle, Monitor, Globe, RefreshCw } from "lucide-react";
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
  ErrorBanner,
  SkeletonRows,
} from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { LogEntry, LogResult } from "../../types/admin";

type Filter = "all" | LogResult;

export function AdminLogsPage() {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.adminListLogs(500);
      setLogs(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: logs.length };
    for (const l of logs) c[l.result] = (c[l.result] ?? 0) + 1;
    return c;
  }, [logs]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => filter === "all" || l.result === filter).filter((l) => {
      if (!q) return true;
      return (
        l.actor.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.target ?? "").toLowerCase().includes(q) ||
        l.ip.includes(q)
      );
    });
  }, [filter, search, logs]);

  return (
    <div>
      <AdminHeader
        title="Logs"
        subtitle="Every platform action — actor, target, device and result."
        crumbs={[{ label: "Logs" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <FilterTabs
            tabs={[
              { key: "all", label: "All" },
              { key: "success", label: "Success" },
              { key: "failure", label: "Failure" },
            ]}
            active={filter}
            onChange={setFilter}
            counts={counts}
          />
          <div className="ml-auto flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search actor, action, IP…" />
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
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Target</Th>
              <Th>When</Th>
              <Th>IP</Th>
              <Th>Device</Th>
              <Th>Result</Th>
            </>
          }
        >
          {loading ? (
            <SkeletonRows cols={7} />
          ) : (
            filtered.map((l) => (
              <Tr key={l.id}>
                <Td>
                  <p className="font-medium text-white">{l.actor}</p>
                  <p className="text-[11px] capitalize text-white/35">{l.role}</p>
                </Td>
                <Td className="font-mono text-xs text-amber-200/80">{l.action}</Td>
                <Td className="text-white/60">{l.target ?? "—"}</Td>
                <Td className="text-xs text-white/40">{new Date(l.at).toLocaleString()}</Td>
                <Td className="font-mono text-xs text-white/55">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-white/25" />
                    {l.ip}
                  </span>
                </Td>
                <Td className="text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Monitor className="h-3 w-3 text-white/25" />
                    {l.device} · {l.browser}
                  </span>
                </Td>
                <Td>
                  {l.result === "success" ? (
                    <Pill tone="emerald">
                      <CheckCircle2 className="h-3 w-3" /> success
                    </Pill>
                  ) : (
                    <Pill tone="red">
                      <XCircle className="h-3 w-3" /> failure
                    </Pill>
                  )}
                </Td>
              </Tr>
            ))
          )}
        </Table>
        {!loading && filtered.length === 0 && (
          <EmptyState icon={ScrollText} message={logs.length === 0 ? "No audit logs yet" : "No log entries match this filter"} />
        )}
      </PageBody>
    </div>
  );
}
