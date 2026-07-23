import * as React from "react";
import { Flag, Building2, RefreshCw } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import { PageBody, Toggle, Pill, SectionCard, EmptyState, ErrorBanner } from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { FeatureFlag } from "../../types/admin";

export function AdminFlagsPage() {
  const [flags, setFlags] = React.useState<FeatureFlag[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.adminListFeatureFlags();
      setFlags(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const toggle = async (key: string, current: boolean) => {
    if (saving) return;
    setSaving(key);
    const next = !current;
    setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled: next } : f));
    try {
      await repo.adminUpdateFeatureFlag(key, { enabled: next });
    } catch {
      setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled: current } : f));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Feature Flags"
        subtitle="Roll out new features globally or to selected organizations."
        crumbs={[{ label: "Feature Flags" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-white/40">{loading ? "…" : `${flags.length} flags`}</p>
          <button
            onClick={load}
            disabled={loading}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-white/30">Loading flags…</p>
        ) : flags.length === 0 ? (
          <EmptyState icon={Flag} message="No feature flags in Firestore yet. Create docs in the featureFlags collection." />
        ) : (
          <div className="space-y-3">
            {flags.map((f) => (
              <SectionCard key={f.key}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <Flag className="h-4 w-4 text-amber-400" />
                      <p className="font-medium text-white">{f.name}</p>
                      <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/45">{f.key}</code>
                    </div>
                    <p className="text-sm text-white/50">{f.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                      {f.enabled ? (
                        f.centerIds.length === 0 ? (
                          <Pill tone="emerald">Enabled for everyone</Pill>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Enabled for {f.centerIds.length} organization{f.centerIds.length > 1 ? "s" : ""}
                          </span>
                        )
                      ) : (
                        <Pill tone="neutral">Disabled</Pill>
                      )}
                    </div>
                  </div>
                  <Toggle
                    checked={f.enabled}
                    onChange={() => toggle(f.key, f.enabled)}
                    disabled={saving === f.key}
                  />
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </PageBody>
    </div>
  );
}
