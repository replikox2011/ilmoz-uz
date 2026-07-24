import * as React from "react";
import { Link } from "react-router-dom";
import { Search, RefreshCw, Users as UsersIcon, Building2 } from "lucide-react";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Center, User, Role, ROLE_LABELS } from "../../types";
import { AdminHeader } from "./AdminLayout";
import { Avatar } from "../../components/ui/Avatar";
import { useI18n } from "../../i18n/I18nContext";
import { cn } from "../../lib/utils";

/** Role filter tabs shown to the site owner. "all" = every user. */
type RoleFilter = "all" | Role;

const ROLE_BADGE: Record<Role, string> = {
  owner: "bg-amber-500/15 text-amber-300",
  director: "bg-violet-500/15 text-violet-300",
  administrator: "bg-sky-500/15 text-sky-300",
  teacher: "bg-emerald-500/15 text-emerald-300",
  student: "bg-brand-500/15 text-brand-300",
  parent: "bg-rose-500/15 text-rose-300",
};

export function AdminUsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = React.useState<User[]>([]);
  const [centers, setCenters] = React.useState<Center[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<RoleFilter>("all");
  const [search, setSearch] = React.useState("");

  const FILTERS: { key: RoleFilter; label: string }[] = [
    { key: "all", label: t("admin.users.filterAll") },
    { key: "director", label: t("admin.users.filterDirectors") },
    { key: "administrator", label: t("admin.users.filterAdmins") },
    { key: "teacher", label: t("admin.users.filterTeachers") },
    { key: "student", label: t("admin.users.filterStudents") },
    { key: "parent", label: t("admin.users.filterParents") },
  ];

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allUsers, allCenters] = await Promise.all([
        repo.adminListAllUsers(),
        repo.adminListAllCenters(),
      ]);
      setUsers(allUsers);
      setCenters(allCenters);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const centerName = React.useCallback(
    (id: string) => centers.find((c) => c.id === id)?.name ?? "—",
    [centers]
  );

  // Counts per role (across all centers)
  const counts = React.useMemo(() => {
    const c: Record<string, number> = { all: users.length };
    for (const u of users) c[u.role] = (c[u.role] ?? 0) + 1;
    return c;
  }, [users]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => filter === "all" || u.role === filter)
      .filter((u) => {
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.phone ?? "").toLowerCase().includes(q) ||
          centerName(u.centerId).toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, filter, search, centerName]);

  return (
    <div>
      <AdminHeader
        title={t("admin.nav.users")}
        subtitle={t("admin.subtitle.users")}
        crumbs={[{ label: t("admin.nav.users") }]}
      />

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}{" "}
            <button onClick={load} className="underline hover:no-underline">Retry</button>
          </div>
        )}

        {/* Filters + search */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition",
                  filter === f.key
                    ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25"
                    : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    filter === f.key ? "bg-amber-500/20 text-amber-300" : "bg-white/[0.06] text-white/40"
                  )}
                >
                  {loading ? "—" : counts[f.key] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("admin.users.searchPlaceholder")}
                className="w-64 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none"
              />
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/50 transition hover:text-white/80 disabled:opacity-40"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              {t("admin.refresh")}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">{t("admin.table.name")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">{t("admin.table.role")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">{t("admin.table.center")}</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40">{t("admin.users.contact")}</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.04]">
                      {Array.from({ length: 4 }).map((__, j) => (
                        <td key={j} className="px-5 py-3.5">
                          <div className="h-3 rounded-full bg-white/[0.05] animate-pulse" style={{ width: `${50 + j * 12}%` }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((u) => (
                    <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} color={u.avatarColor} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{u.name}</p>
                            {u.username && <p className="text-[11px] text-white/35">@{u.username}</p>}
                          </div>
                          {u.isadm && (
                            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">ADM</span>
                          )}
                          {!u.isadm && u.ismod && (
                            <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">MOD</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ROLE_BADGE[u.role])}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/ilmoz-admin/centers/${u.centerId}`}
                          className="flex items-center gap-1.5 text-white/70 hover:text-white transition"
                        >
                          <Building2 className="h-3.5 w-3.5 text-white/30" />
                          {centerName(u.centerId)}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/45">
                        {u.email || u.phone || "—"}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <UsersIcon className="h-8 w-8 text-white/15" />
              <p className="text-sm text-white/35">{t("admin.users.noMatch")}</p>
            </div>
          )}
        </div>

        {!loading && (
          <p className="mt-3 text-xs text-white/35">
            {t("admin.users.showingOf")} {filtered.length} {t("admin.users.of")} {users.length} {t("admin.users.users")} {t("admin.users.across")} {centers.length} {t("admin.users.centers")}
          </p>
        )}
      </div>
    </div>
  );
}
