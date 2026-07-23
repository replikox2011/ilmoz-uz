import * as React from "react";
import { Link } from "react-router-dom";
import { Globe, CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Center } from "../../types";
import { AdminHeader } from "./AdminLayout";
import { useI18n } from "../../i18n/I18nContext";
import {
  PageBody,
  ErrorBanner,
  SearchInput,
  RefreshButton,
  Table,
  Th,
  Td,
  Tr,
  SkeletonRows,
  EmptyState,
  Pill,
  StatCard,
  SectionCard,
} from "./adminUi";
import { slugifySubdomain } from "../../lib/subdomain";

export function AdminSubdomainsPage() {
  const { t } = useI18n();
  const [centers, setCenters] = React.useState<Center[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  // availability checker
  const [candidate, setCandidate] = React.useState("");
  const [checking, setChecking] = React.useState(false);
  const [available, setAvailable] = React.useState<boolean | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await repo.adminListAllCenters();
      setCenters(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load subdomains");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // debounced availability check
  React.useEffect(() => {
    const slug = slugifySubdomain(candidate);
    if (!slug) {
      setAvailable(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    const id = window.setTimeout(async () => {
      try {
        const ok = await repo.isSubdomainAvailable(slug);
        setAvailable(ok);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    }, 450);
    return () => window.clearTimeout(id);
  }, [candidate]);

  const withSub = centers.filter((c) => c.subdomain);
  const withoutSub = centers.filter((c) => !c.subdomain);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return withSub;
    return withSub.filter(
      (c) => (c.subdomain ?? "").toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [withSub, search]);

  const slug = slugifySubdomain(candidate);

  return (
    <div>
      <AdminHeader
        title={t("admin.nav.subdomains")}
        subtitle={t("admin.subtitle.subdomains")}
        crumbs={[{ label: t("admin.nav.subdomains") }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
          <StatCard icon={Globe} label={t("admin.subdomains.reserved")} value={loading ? "—" : withSub.length} sub={t("admin.subdomains.activeUrls")} color="bg-emerald-500/20 text-emerald-400" />
          <StatCard icon={Building2} label={t("admin.subdomains.withoutSubdomain")} value={loading ? "—" : withoutSub.length} sub={t("admin.subdomains.rootDomainOnly")} color="bg-white/10 text-white/50" />
          <StatCard icon={CheckCircle2} label={t("admin.subdomains.totalOrgs")} value={loading ? "—" : centers.length} sub={t("admin.dashboard.allTime")} color="bg-amber-500/20 text-amber-400" />
        </div>

        {/* Availability checker */}
        <SectionCard title={t("admin.subdomains.checkAvailability")} className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] pr-3 focus-within:border-amber-400/40">
              <input
                value={candidate}
                onChange={(e) => setCandidate(e.target.value)}
                placeholder="my-center"
                className="w-48 bg-transparent py-2 pl-3 text-sm text-white placeholder:text-white/25 focus:outline-none"
              />
              <span className="text-sm text-white/35">.ilmoz.uz</span>
            </div>
            <div className="min-w-[160px] text-sm">
              {!slug && <span className="text-white/30">{t("admin.subdomains.typeToCheck")}</span>}
              {slug && checking && (
                <span className="flex items-center gap-1.5 text-white/50">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("admin.subdomains.checking")} {slug}…
                </span>
              )}
              {slug && !checking && available === true && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {slug}.ilmoz.uz {t("admin.subdomains.available")}
                </span>
              )}
              {slug && !checking && available === false && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <XCircle className="h-3.5 w-3.5" /> {slug}.ilmoz.uz {t("admin.subdomains.taken")}
                </span>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-white/30">
            Subdomains are reserved during center setup. Reserving here requires a backend write.
          </p>
        </SectionCard>

        {/* Toolbar */}
        <div className="mb-5 flex items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder={t("admin.subdomains.searchPlaceholder")} />
          <div className="ml-auto">
            <RefreshButton onClick={load} loading={loading} />
          </div>
        </div>

        {/* Reserved list */}
        <Table
          head={
            <>
              <Th>{t("admin.table.subdomain")}</Th>
              <Th>{t("admin.subdomains.organization")}</Th>
              <Th>{t("admin.subdomains.currency")}</Th>
              <Th>{t("admin.subdomains.reserved2")}</Th>
              <Th className="text-right">{t("admin.subdomains.open2")}</Th>
            </>
          }
        >
          {loading ? (
            <SkeletonRows rows={6} cols={5} />
          ) : (
            filtered.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <a
                    href={`https://${c.subdomain}.ilmoz.uz`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 font-mono text-emerald-300 hover:text-emerald-200"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {c.subdomain}.ilmoz.uz
                  </a>
                </Td>
                <Td className="text-white/80">{c.name}</Td>
                <Td className="font-mono text-xs text-white/55">{c.currency}</Td>
                <Td className="text-xs text-white/40">{new Date(c.createdAt).toLocaleDateString()}</Td>
                <Td className="text-right">
                  <Link to={`/ilmoz-admin/centers/${c.id}`} className="text-xs text-brand-300 hover:text-brand-200">
                    {t("admin.subdomains.open")} →
                  </Link>
                </Td>
              </Tr>
            ))
          )}
        </Table>
        {!loading && filtered.length === 0 && (
          <EmptyState icon={Globe} message={t("admin.subdomains.noMatch")} />
        )}

        {/* Without subdomain */}
        {!loading && withoutSub.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/40">
              {t("admin.subdomains.rootDomainSection")} ({withoutSub.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {withoutSub.map((c) => (
                <Link
                  key={c.id}
                  to={`/ilmoz-admin/centers/${c.id}`}
                  className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-sm text-white/60 transition hover:text-white"
                >
                  <Building2 className="h-3.5 w-3.5 text-white/30" />
                  {c.name}
                  <Pill tone="neutral">{t("admin.subdomains.noSubdomainPill")}</Pill>
                </Link>
              ))}
            </div>
          </div>
        )}
      </PageBody>
    </div>
  );
}
