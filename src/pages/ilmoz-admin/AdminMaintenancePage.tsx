import * as React from "react";
import { Wrench, AlertTriangle, Clock, Eye } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import { PageBody, SectionCard, Toggle, Pill, ErrorBanner } from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { MaintenanceState } from "../../types/admin";

const DEFAULT: MaintenanceState = {
  enabled: false,
  title: "Scheduled maintenance",
  message: "Ilmoz is undergoing scheduled maintenance and will be back shortly. Thank you for your patience.",
  until: "",
};

const FIELD =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none";

export function AdminMaintenancePage() {
  const [state, setState] = React.useState<MaintenanceState>(DEFAULT);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const s = await repo.adminGetMaintenance();
        if (s) setState(s);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load maintenance settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof MaintenanceState>(key: K, val: MaintenanceState[K]) =>
    setState((s) => ({ ...s, [key]: val }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await repo.adminSetMaintenance(state);
      setToast("Maintenance settings saved");
      setTimeout(() => setToast(null), 3200);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save maintenance settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <AdminHeader
        title="Maintenance Mode"
        subtitle="Take the platform offline for all tenants with a custom notice."
        crumbs={[{ label: "Maintenance" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} />}

        {toast && (
          <div className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
            {toast}
          </div>
        )}

        {loading ? (
          <p className="py-16 text-center text-sm text-white/30">Loading maintenance settings…</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <SectionCard>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        "grid h-10 w-10 shrink-0 place-items-center rounded-xl " +
                        (state.enabled ? "bg-rose-500/20 text-rose-400" : "bg-amber-500/20 text-amber-400")
                      }
                    >
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">Maintenance mode</h3>
                        <Pill tone={state.enabled ? "rose" : "emerald"}>
                          {state.enabled ? "Active" : "Off"}
                        </Pill>
                      </div>
                      <p className="mt-0.5 text-sm text-white/45">
                        {state.enabled
                          ? "All tenants currently see the maintenance screen."
                          : "The platform is live for all tenants."}
                      </p>
                    </div>
                  </div>
                  <Toggle checked={state.enabled} onChange={(v) => set("enabled", v)} />
                </div>

                {state.enabled && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-xs text-rose-200/80">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400/80" />
                    <p>While active, every center's users are locked out except platform Owner and Moderators.</p>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Notice">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Title</label>
                    <input className={FIELD} value={state.title} onChange={(e) => set("title", e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Message</label>
                    <textarea
                      rows={4}
                      className={FIELD + " resize-none"}
                      value={state.message}
                      onChange={(e) => set("message", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/50">
                      <Clock className="h-3 w-3" /> Estimated back online (optional)
                    </label>
                    <input
                      type="datetime-local"
                      className={FIELD}
                      value={state.until}
                      onChange={(e) => set("until", e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={save}
                      disabled={saving}
                      className="rounded-xl bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save settings"}
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/35">
                <Eye className="h-3 w-3" /> Preview
              </div>
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#05060a] p-8 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 ring-1 ring-amber-400/25">
                  <Wrench className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-white">{state.title || "Scheduled maintenance"}</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">
                  {state.message || "We'll be back shortly."}
                </p>
                {state.until && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-xs text-white/50">
                    <Clock className="h-3 w-3" />
                    Back around {new Date(state.until).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PageBody>
    </div>
  );
}
