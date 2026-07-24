import * as React from "react";
import { Link } from "react-router-dom";
import { Building2, Search, RefreshCw, Globe } from "lucide-react";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Center } from "../../types";
import { AdminHeader } from "./AdminLayout";
import { cn } from "../../lib/utils";

export function AdminCentersPage() {
  const [centers, setCenters] = React.useState<Center[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await repo.adminListAllCenters();
      setCenters(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load centers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return centers;
    return centers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subdomain?.toLowerCase().includes(q) ||
        c.id.includes(q)
    );
  }, [centers, query]);

  return (
    <div>
      <AdminHeader
        title="All Centers"
        subtitle={`${centers.length} learning centers on the platform`}
        crumbs={[{ label: "Centers" }]}
      />

      <div className="p-8">
        {/* Toolbar */}
        <div className="mb-5 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or subdomain…"
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-brand-400/50 focus:bg-white/[0.06]"
            />
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/50 hover:text-white/80 transition disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-white/35">
            {query ? "No centers match your search" : "No centers yet"}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((center) => (
              <Link
                key={center.id}
                to={`/ilmoz-admin/centers/${center.id}`}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  {center.logoUrl ? (
                    <img
                      src={center.logoUrl}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-xl object-contain"
                    />
                  ) : (
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/15">
                      <Building2 className="h-5 w-5 text-amber-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{center.name}</p>
                    <p className="mt-0.5 truncate text-xs text-white/35">{center.id}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs">
                  {center.subdomain ? (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span className="truncate">{center.subdomain}.ilmoz.uz</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-white/30">
                      <Globe className="h-3 w-3 shrink-0" />
                      <span>No subdomain</span>
                    </div>
                  )}
                  <p className="text-white/35">
                    Currency:{" "}
                    <span className="font-mono text-white/55">{center.currency}</span>
                  </p>
                  <p className="text-white/30">
                    Created {new Date(center.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {center.description && (
                  <p className="truncate text-xs text-white/35 italic">{center.description}</p>
                )}

                {/* Arrow */}
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 transition group-hover:text-white/50">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
