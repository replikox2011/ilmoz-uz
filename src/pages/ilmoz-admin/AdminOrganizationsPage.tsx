import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  MoreHorizontal,
  ExternalLink,
  LogIn,
  UserCog,
  CreditCard,
  SlidersHorizontal,
  Ban,
  CheckCircle2,
  Trash2,
  Bell,
} from "lucide-react";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Center, User } from "../../types";
import { PlanTier } from "../../types/admin";
import { AdminHeader } from "./AdminLayout";
import { useI18n } from "../../i18n/I18nContext";
import {
  PageBody,
  ErrorBanner,
  SearchInput,
  RefreshButton,
  FilterTabs,
  Table,
  Th,
  Td,
  Tr,
  SkeletonRows,
  EmptyState,
  Pill,
  PillTone,
} from "./adminUi";
import { cn } from "../../lib/utils";

type StatusFilter = "all" | "active" | "blocked";

/** Deterministic pseudo plan/status derived from a center id (no backend yet). */
function planFor(id: string): PlanTier {
  const n = id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0) % 3;
  return (["starter", "standard", "pro"] as PlanTier[])[n];
}
const PLAN_TONE: Record<PlanTier, PillTone> = {
  starter: "neutral",
  standard: "sky",
  pro: "amber",
};

export function AdminOrganizationsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [centers, setCenters] = React.useState<Center[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<StatusFilter>("all");
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [blocked, setBlocked] = React.useState<Set<string>>(new Set());
  const [notice, setNotice] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allCenters, allUsers] = await Promise.all([
        repo.adminListAllCenters(),
        repo.adminListAllUsers(),
      ]);
      setCenters(allCenters.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setUsers(allUsers);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // dismiss the transient notice after a few seconds
  React.useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const byCenter = React.useMemo(() => {
    const m: Record<string, { total: number; students: number; teachers: number; owner?: User }> = {};
    for (const u of users) {
      const e = (m[u.centerId] ??= { total: 0, students: 0, teachers: 0 });
      e.total++;
      if (u.role === "student") e.students++;
      if (u.role === "teacher") e.teachers++;
      if (u.role === "owner" && !e.owner) e.owner = u;
    }
    return m;
  }, [users]);

  const counts = React.useMemo(
    () => ({
      all: centers.length,
      active: centers.filter((c) => !blocked.has(c.id)).length,
      blocked: centers.filter((c) => blocked.has(c.id)).length,
    }),
    [centers, blocked]
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return centers
      .filter((c) => {
        if (filter === "active") return !blocked.has(c.id);
        if (filter === "blocked") return blocked.has(c.id);
        return true;
      })
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.subdomain ?? "").toLowerCase().includes(q) ||
          (byCenter[c.id]?.owner?.name ?? "").toLowerCase().includes(q)
        );
      });
  }, [centers, filter, search, blocked, byCenter]);

  const toggleBlock = (id: string, block: boolean) => {
    setBlocked((prev) => {
      const next = new Set(prev);
      if (block) next.add(id);
      else next.delete(id);
      return next;
    });
    setMenuFor(null);
    setNotice(block ? t("admin.orgs.orgBlocked") : t("admin.orgs.orgUnblocked"));
  };

  const stub = (label: string, name: string) => {
    setMenuFor(null);
    setNotice(`${label} — "${name}". Backend action pending.`);
  };

  return (
    <div onClick={() => setMenuFor(null)}>
      <AdminHeader
        title={t("admin.nav.organizations")}
        subtitle={t("admin.subtitle.organizations")}
        crumbs={[{ label: t("admin.nav.organizations") }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}
        {notice && (
          <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3.5 text-sm text-amber-200">
            {notice}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <FilterTabs
            tabs={[
              { key: "all", label: t("admin.filter.all") },
              { key: "active", label: t("admin.orgs.active") },
              { key: "blocked", label: t("admin.orgs.blocked") },
            ]}
            active={filter}
            onChange={setFilter}
            counts={counts}
          />
          <div className="ml-auto flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder={t("admin.orgs.searchPlaceholder")} />
            <RefreshButton onClick={load} loading={loading} />
          </div>
        </div>

          <Table
          head={
            <>
              <Th>{t("admin.nav.organizations")}</Th>
              <Th>{t("admin.table.subdomain")}</Th>
              <Th>{t("admin.orgs.owner")}</Th>
              <Th>{t("admin.orgs.registered")}</Th>
              <Th>{t("admin.table.plan")}</Th>
              <Th>{t("admin.table.status")}</Th>
              <Th className="text-right">{t("admin.table.users")}</Th>
              <Th className="text-right">{t("admin.table.students")}</Th>
              <Th className="text-right">{t("admin.orgs.teachers")}</Th>
              <Th />
            </>
          }
        >
          {loading ? (
            <SkeletonRows rows={6} cols={10} />
          ) : (
            filtered.map((c) => {
              const stats = byCenter[c.id];
              const isBlocked = blocked.has(c.id);
              const plan = planFor(c.id);
              return (
                <Tr key={c.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" className="h-7 w-7 rounded-lg object-contain" />
                      ) : (
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15">
                          <Building2 className="h-3.5 w-3.5 text-amber-400" />
                        </div>
                      )}
                      <Link to={`/ilmoz-admin/centers/${c.id}`} className="font-medium text-white hover:text-amber-200">
                        {c.name}
                      </Link>
                    </div>
                  </Td>
                  <Td>
                    {c.subdomain ? (
                      <Pill tone="emerald">{c.subdomain}.ilmoz.uz</Pill>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </Td>
                  <Td className="text-white/70">{stats?.owner?.name ?? "—"}</Td>
                  <Td className="text-xs text-white/40">{new Date(c.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <Pill tone={PLAN_TONE[plan]}>{plan}</Pill>
                  </Td>
                  <Td>
                    {isBlocked ? <Pill tone="red">{t("admin.orgs.blocked")}</Pill> : <Pill tone="emerald">{t("admin.orgs.active")}</Pill>}
                  </Td>
                  <Td className="text-right font-mono text-white/70">{stats?.total ?? 0}</Td>
                  <Td className="text-right font-mono text-white/70">{stats?.students ?? 0}</Td>
                  <Td className="text-right font-mono text-white/70">{stats?.teachers ?? 0}</Td>
                  <Td className="text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuFor(menuFor === c.id ? null : c.id);
                        }}
                        className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/[0.06] hover:text-white/80"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuFor === c.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0b0e16] py-1 shadow-xl shadow-black/40"
                        >
                          <MenuItem icon={ExternalLink} onClick={() => navigate(`/ilmoz-admin/centers/${c.id}`)}>
                            {t("admin.orgs.openOrg")}
                          </MenuItem>
                          <MenuItem icon={LogIn} onClick={() => stub(t("admin.orgs.loginAsOwner"), c.name)}>
                            {t("admin.orgs.loginAsOwner")}
                          </MenuItem>
                          <MenuItem icon={UserCog} onClick={() => stub(t("admin.orgs.changeOwner"), c.name)}>
                            {t("admin.orgs.changeOwner")}
                          </MenuItem>
                          <MenuItem icon={CreditCard} onClick={() => stub(t("admin.orgs.changePlan"), c.name)}>
                            {t("admin.orgs.changePlan")}
                          </MenuItem>
                          <MenuItem icon={SlidersHorizontal} onClick={() => stub(t("admin.orgs.changeLimits"), c.name)}>
                            {t("admin.orgs.changeLimits")}
                          </MenuItem>
                          <MenuItem icon={Bell} onClick={() => stub(t("admin.orgs.sendNotification"), c.name)}>
                            {t("admin.orgs.sendNotification")}
                          </MenuItem>
                          <div className="my-1 border-t border-white/[0.06]" />
                          {isBlocked ? (
                            <MenuItem icon={CheckCircle2} tone="emerald" onClick={() => toggleBlock(c.id, false)}>
                              {t("admin.orgs.unblock")}
                            </MenuItem>
                          ) : (
                            <MenuItem icon={Ban} tone="amber" onClick={() => toggleBlock(c.id, true)}>
                              {t("admin.orgs.block")}
                            </MenuItem>
                          )}
                          <MenuItem icon={Trash2} tone="red" onClick={() => stub(t("admin.orgs.delete"), c.name)}>
                            {t("admin.orgs.delete")}
                          </MenuItem>
                        </div>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </Table>
        {!loading && filtered.length === 0 && (
          <EmptyState icon={Building2} message={t("admin.orgs.noMatch")} />
        )}

        {!loading && (
          <p className="mt-3 text-xs text-white/35">
            {t("admin.orgs.showingOf")} {filtered.length} {t("admin.orgs.of")} {centers.length} {t("admin.orgs.organizations")}
          </p>
        )}
      </PageBody>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  children,
  onClick,
  tone = "neutral",
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick: () => void;
  tone?: "neutral" | "amber" | "emerald" | "red";
}) {
  const toneClass = {
    neutral: "text-white/70 hover:bg-white/[0.05]",
    amber: "text-amber-300 hover:bg-amber-500/10",
    emerald: "text-emerald-300 hover:bg-emerald-500/10",
    red: "text-red-300 hover:bg-red-500/10",
  }[tone];
  return (
    <button
      onClick={onClick}
      className={cn("flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition", toneClass)}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {children}
    </button>
  );
}
