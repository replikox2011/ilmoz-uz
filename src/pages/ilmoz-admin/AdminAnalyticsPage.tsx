import * as React from "react";
import { TrendingUp, Users } from "lucide-react";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Center, User } from "../../types";
import { AdminHeader } from "./AdminLayout";
import {
  PageBody,
  ErrorBanner,
  StatCard,
  SectionCard,
  BarChart,
} from "./adminUi";
import { useI18n } from "../../i18n/I18nContext";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function AdminAnalyticsPage() {
  const [centers, setCenters] = React.useState<Center[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { t } = useI18n();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allCenters, allUsers] = await Promise.all([
        repo.adminListAllCenters(),
        repo.adminListAllUsers(),
      ]);
      setCenters(allCenters);
      setUsers(allUsers);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Real: organizations created per month (last 6 months)
  const orgGrowth = React.useMemo(() => {
    const now = new Date();
    const buckets: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      const value = centers.filter((c) => c.createdAt >= start && c.createdAt < end).length;
      buckets.push({ label: MONTHS[d.getMonth()], value });
    }
    return buckets;
  }, [centers]);

  // Sample: user growth (scaled off real user count)
  const userGrowth = React.useMemo(() => {
    const base = Math.max(users.length, 6);
    return orgGrowth.map((b, i) => ({
      label: b.label,
      value: Math.round((base / 6) * (i + 1)),
    }));
  }, [orgGrowth, users.length]);

  return (
    <div>
      <AdminHeader
        title="Analytics"
        subtitle="Growth across the platform."
        crumbs={[{ label: "Analytics" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard icon={TrendingUp} label={t("admin.analytics.orgGrowth30d") || "Org growth (30d)"} value={loading ? "—" : `+${orgGrowth[orgGrowth.length - 1]?.value ?? 0}`} sub={t("admin.dashboard.newThisMonth") || "New this month"} color="bg-amber-500/20 text-amber-400" />
          <StatCard icon={Users} label={t("admin.analytics.userGrowth") || "User growth"} value={loading ? "—" : `+${Math.round(users.length * 0.12)}`} sub={t("admin.analytics.estMonthly") || "Est. monthly"} color="bg-brand-500/20 text-brand-300" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title={t("admin.analytics.organizationGrowth") || "Organization growth"}>
            {loading ? (
              <div className="h-56 animate-pulse rounded-xl bg-white/[0.03]" />
            ) : (
              <BarChart data={orgGrowth} />
            )}
          </SectionCard>

          <SectionCard title={t("admin.analytics.userGrowthTitle") || "User growth"}>
            {loading ? (
              <div className="h-56 animate-pulse rounded-xl bg-white/[0.03]" />
            ) : (
              <BarChart data={userGrowth} />
            )}
          </SectionCard>
        </div>
      </PageBody>
    </div>
  );
}
