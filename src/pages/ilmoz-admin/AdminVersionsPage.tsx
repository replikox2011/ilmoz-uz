import * as React from "react";
import { GitBranch, Sparkles, Wrench, CheckCircle2, RefreshCw } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import { PageBody, Pill, StatCard, EmptyState, ErrorBanner } from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { ReleaseVersion } from "../../types/admin";

export function AdminVersionsPage() {
  const [versions, setVersions] = React.useState<ReleaseVersion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.adminListVersions();
      setVersions(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load versions");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const current = versions.find((v) => v.current) ?? versions[0];

  return (
    <div>
      <AdminHeader
        title="Version Manager"
        subtitle="Current release, changelog, fixes and new features."
        crumbs={[{ label: "Version Manager" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-5 flex justify-end">
          <button
            onClick={load}
            disabled={loading}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-white/30">Loading versions…</p>
        ) : (
          <>
            {current && (
              <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
                <StatCard icon={GitBranch} label="Current version" value={current.version} sub={new Date(current.date).toLocaleDateString()} color="bg-amber-500/20 text-amber-400" />
                <StatCard icon={Sparkles} label="Features (latest)" value={current.features.length} sub="New in release" color="bg-emerald-500/20 text-emerald-400" />
                <StatCard icon={Wrench} label="Fixes (latest)" value={current.fixes.length} sub="Bug fixes" color="bg-sky-500/20 text-sky-400" />
              </div>
            )}

            {versions.length === 0 ? (
              <EmptyState icon={GitBranch} message="No versions in Firestore yet. Create docs in the platformVersions collection." />
            ) : (
              <div className="space-y-4">
                {versions.map((v) => (
                  <div key={v.version} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15">
                        <GitBranch className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">v{v.version}</h3>
                          {v.current && (
                            <Pill tone="emerald">
                              <CheckCircle2 className="h-3 w-3" /> Current
                            </Pill>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{new Date(v.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-emerald-400/70">
                          <Sparkles className="h-3 w-3" /> New features
                        </p>
                        <ul className="space-y-1.5">
                          {v.features.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-sky-400/70">
                          <Wrench className="h-3 w-3" /> Fixes
                        </p>
                        <ul className="space-y-1.5">
                          {v.fixes.map((f) => (
                            <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sky-400" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </PageBody>
    </div>
  );
}
