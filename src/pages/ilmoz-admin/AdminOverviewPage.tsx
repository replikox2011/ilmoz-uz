import * as React from "react";
import { Building2, Users, CalendarDays, TrendingUp, RefreshCw, GraduationCap, UserSquare2 } from "lucide-react";
import { Link } from "react-router-dom";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Center } from "../../types";
import { AdminHeader } from "./AdminLayout";
import { useI18n } from "../../i18n/I18nContext";
import { cn } from "../../lib/utils";

interface PlatformStats {
  totalCenters: number;
  centersWithSubdomain: number;
  centersThisMonth: number;
  totalUsers: number;
  totalStudents: number;
  recentCenters: Center[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-white/50">{label}</p>
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

export function AdminOverviewPage() {
  const { t } = useI18n();
  const [stats, setStats] = React.useState<PlatformStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [centers, allUsers] = await Promise.all([
        repo.adminListAllCenters(),
        repo.adminListAllUsers(),
      ]);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      setStats({
        totalCenters: centers.length,
        centersWithSubdomain: centers.filter((c) => c.subdomain).length,
        centersThisMonth: centers.filter((c) => c.createdAt >= monthStart).length,
        totalUsers: allUsers.length,
        totalStudents: allUsers.filter((u) => u.role === "student").length,
        recentCenters: [...centers]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 8),
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load platform data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div>
      <AdminHeader
        title={t("admin.overview.title")}
        subtitle={t("admin.overview.subtitle")}
      />

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}{" "}
            <button onClick={load} className="underline hover:no-underline">{t("admin.retry")}</button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-3">
          <StatCard
            icon={Building2}
            label={t("admin.overview.totalCenters")}
            value={loading ? "—" : stats?.totalCenters ?? 0}
            sub={t("admin.dashboard.allTime")}
            color="bg-amber-500/20 text-amber-400"
          />
          <StatCard
            icon={TrendingUp}
            label={t("admin.overview.newThisMonth")}
            value={loading ? "—" : stats?.centersThisMonth ?? 0}
            sub={t("admin.overview.calendarMonth")}
            color="bg-emerald-500/20 text-emerald-400"
          />
          <StatCard
            icon={Users}
            label={t("admin.overview.totalUsers")}
            value={loading ? "—" : stats?.totalUsers ?? 0}
            sub={t("admin.overview.acrossAll")}
            color="bg-brand-500/20 text-brand-300"
          />
          <StatCard
            icon={GraduationCap}
            label={t("admin.overview.students")}
            value={loading ? "—" : stats?.totalStudents ?? 0}
            sub="role: student"
            color="bg-sky-500/20 text-sky-400"
          />
          <StatCard
            icon={UserSquare2}
            label={t("admin.overview.withSubdomain")}
            value={loading ? "—" : stats?.centersWithSubdomain ?? 0}
            sub={t("admin.overview.customLoginUrl")}
            color="bg-violet-500/20 text-violet-400"
          />
          <StatCard
            icon={CalendarDays}
            label={t("admin.overview.noSubdomain")}
            value={loading ? "—" : (stats ? stats.totalCenters - stats.centersWithSubdomain : 0)}
            sub={t("admin.overview.rootDomainOnly")}
            color="bg-white/10 text-white/50"
          />
        </div>

        {/* Recent centers */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            {t("admin.overview.recentlyCreated")}
          </h2>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-white/40 hover:text-white/70 transition disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            {t("admin.refresh")}
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">{t("admin.overview.centers")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">{t("admin.table.subdomain")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">{t("admin.subdomains.currency")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">{t("admin.table.created")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-3 rounded-full bg-white/[0.05] animate-pulse" style={{ width: `${60 + j * 10}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : stats?.recentCenters.map((center) => (
                    <tr key={center.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {center.logoUrl ? (
                            <img src={center.logoUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
                          ) : (
                            <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15">
                              <Building2 className="h-3.5 w-3.5 text-amber-400" />
                            </div>
                          )}
                          <span className="font-medium text-white">{center.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {center.subdomain ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                            {center.subdomain}.ilmoz.uz
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-white/55">{center.currency}</td>
                      <td className="px-5 py-3.5 text-xs text-white/40">
                        {new Date(center.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/ilmoz-admin/centers/${center.id}`}
                          className="text-xs text-brand-300 hover:text-brand-200 transition"
                        >
                          {t("admin.overview.viewAll")} →
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && stats?.recentCenters.length === 0 && (
            <div className="py-16 text-center text-sm text-white/35">{t("admin.overview.noCenters")}</div>
          )}
        </div>

        {!loading && stats && stats.totalCenters > 8 && (
          <div className="mt-3 text-center">
            <Link to="/ilmoz-admin/centers" className="text-sm text-brand-300 hover:text-brand-200 transition">
              {t("admin.overview.viewAll")} {stats.totalCenters} {t("admin.overview.centers")} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
