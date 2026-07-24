import * as React from "react";
import { Check, Users, GraduationCap, HardDrive, Sparkles, Pencil, RefreshCw } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import { PageBody, Pill, PillTone, EmptyState, ErrorBanner } from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Plan, PlanTier } from "../../types/admin";
import { formatMoney, cn } from "../../lib/utils";

const TIER_TONE: Record<PlanTier, PillTone> = {
  starter: "neutral",
  standard: "sky",
  pro: "amber",
};

const limit = (n: number) => (n < 0 ? "Unlimited" : n.toLocaleString());

export function AdminSubscriptionsPage() {
  const [cycle, setCycle] = React.useState<"monthly" | "yearly">("monthly");
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.adminListPlans();
      setPlans(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div>
      <AdminHeader
        title="Subscriptions"
        subtitle="Published plans, pricing, limits and included features."
        crumbs={[{ label: "Subscriptions" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition",
                  cycle === c ? "bg-amber-500/15 text-amber-300" : "text-white/50 hover:text-white/80"
                )}
              >
                {c}
                {c === "yearly" && <span className="ml-1.5 text-[10px] text-emerald-400">−17%</span>}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-white/30">Loading plans…</p>
        ) : plans.length === 0 ? (
          <EmptyState icon={Sparkles} message="No plans found. Add docs to the platformPlans collection." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = cycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
              return (
                <div
                  key={plan.tier}
                  className={cn(
                    "flex flex-col rounded-2xl border p-6",
                    plan.tier === "pro"
                      ? "border-amber-400/30 bg-amber-500/[0.04]"
                      : "border-white/[0.06] bg-white/[0.02]"
                  )}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Pill tone={TIER_TONE[plan.tier]}>{plan.name}</Pill>
                    <button className="rounded-lg p-1.5 text-white/30 transition hover:bg-white/[0.06] hover:text-white/70">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mb-5">
                    <span className="text-3xl font-bold text-white">
                      {price === 0 ? "Free" : formatMoney(price, "USD")}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-white/40"> / {cycle === "monthly" ? "mo" : "yr"}</span>
                    )}
                  </div>

                  <div className="mb-5 grid grid-cols-2 gap-3 text-xs">
                    <LimitTile icon={Users} label="Users" value={limit(plan.maxUsers)} />
                    <LimitTile icon={GraduationCap} label="Students" value={limit(plan.maxStudents)} />
                    <LimitTile icon={HardDrive} label="Storage" value={`${plan.storageGb} GB`} />
                    <LimitTile icon={Sparkles} label="AI / mo" value={limit(plan.aiCredits)} />
                  </div>

                  <ul className="mb-5 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button className="mt-auto rounded-xl border border-white/[0.08] py-2 text-sm text-white/70 transition hover:border-amber-400/30 hover:text-amber-200">
                    Edit plan
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </PageBody>
    </div>
  );
}

function LimitTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-white/40">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="font-semibold text-white">{value}</p>
    </div>
  );
}
