import * as React from "react";
import {
  Newspaper,
  Image as ImageIcon,
  Mail,
  Bell,
  Tag,
  Ticket as TicketIcon,
  Handshake,
  Plus,
  RefreshCw,
} from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import { PageBody, FilterTabs, Pill, SectionCard, EmptyState, ErrorBanner } from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { NewsPost, Campaign, Coupon } from "../../types/admin";

type Tab = "news" | "banners" | "email" | "push" | "promos" | "coupons" | "affiliate";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "news", label: "News", icon: Newspaper },
  { key: "banners", label: "Banners", icon: ImageIcon },
  { key: "email", label: "Email", icon: Mail },
  { key: "push", label: "Push", icon: Bell },
  { key: "promos", label: "Promotions", icon: Tag },
  { key: "coupons", label: "Coupons", icon: TicketIcon },
  { key: "affiliate", label: "Affiliate", icon: Handshake },
];

export function AdminMarketingPage() {
  const [tab, setTab] = React.useState<Tab>("news");
  const [news, setNews] = React.useState<NewsPost[]>([]);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [n, c, cp] = await Promise.all([
        repo.adminListNews(),
        repo.adminListCampaigns(),
        repo.adminListCoupons(),
      ]);
      setNews(n);
      setCampaigns(c);
      setCoupons(cp);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load marketing data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const emailCampaigns = campaigns.filter((c) => c.type === "email");
  const pushCampaigns = campaigns.filter((c) => c.type === "push");

  return (
    <div>
      <AdminHeader
        title="Marketing"
        subtitle="News, banners, campaigns, promotions and the partner program."
        crumbs={[{ label: "Marketing" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <FilterTabs
            tabs={TABS.map((t) => ({ key: t.key, label: t.label }))}
            active={tab}
            onChange={setTab}
          />
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30">
              <Plus className="h-3.5 w-3.5" />
              New {TABS.find((t) => t.key === tab)?.label.toLowerCase()}
            </button>
          </div>
        </div>

        {tab === "news" && (
          <SectionCard title="News posts">
            {loading ? (
              <p className="py-8 text-center text-xs text-white/30">Loading…</p>
            ) : news.length === 0 ? (
              <EmptyState icon={Newspaper} message="No news posts yet. Add docs to the platformNews collection." />
            ) : (
              <div className="space-y-2">
                {news.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    <Newspaper className="h-4 w-4 text-white/30" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{n.title}</p>
                      <p className="text-[11px] text-white/35">{new Date(n.date).toLocaleDateString()}</p>
                    </div>
                    <Pill tone={n.status === "published" ? "emerald" : "neutral"}>{n.status}</Pill>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {(tab === "email" || tab === "push") && (
          <SectionCard title={tab === "email" ? "Email campaigns" : "Push campaigns"}>
            {loading ? (
              <p className="py-8 text-center text-xs text-white/30">Loading…</p>
            ) : (tab === "email" ? emailCampaigns : pushCampaigns).length === 0 ? (
              <EmptyState icon={tab === "email" ? Mail : Bell} message={`No ${tab} campaigns yet. Add docs to the platformCampaigns collection.`} />
            ) : (
              <div className="space-y-2">
                {(tab === "email" ? emailCampaigns : pushCampaigns).map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    {tab === "email" ? <Mail className="h-4 w-4 text-white/30" /> : <Bell className="h-4 w-4 text-white/30" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{c.name}</p>
                      <p className="text-[11px] text-white/35">
                        {c.sent.toLocaleString()} sent · {c.opens}% opened
                      </p>
                    </div>
                    <Pill tone={c.status === "sent" ? "emerald" : "amber"}>{c.status}</Pill>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {tab === "coupons" && (
          <SectionCard title="Coupons">
            {loading ? (
              <p className="py-8 text-center text-xs text-white/30">Loading…</p>
            ) : coupons.length === 0 ? (
              <EmptyState icon={TicketIcon} message="No coupons yet. Add docs to the platformCoupons collection." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {coupons.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-amber-300">{c.code}</span>
                      <Pill tone="amber">{c.discount}</Pill>
                    </div>
                    <p className="text-xs text-white/40">
                      {c.uses} / {c.cap} redeemed
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-amber-400/60"
                        style={{ width: `${Math.min(100, Math.round((c.uses / c.cap) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {tab === "banners" && (
          <SectionCard title="Banners">
            <EmptyState icon={ImageIcon} message="Banner management coming soon. Add docs to the platformBanners collection." />
          </SectionCard>
        )}

        {tab === "promos" && (
          <SectionCard title="Promotions">
            <EmptyState icon={Tag} message="No active promotions. Create one to boost conversions." />
          </SectionCard>
        )}

        {tab === "affiliate" && (
          <SectionCard title="Affiliate program">
            <EmptyState icon={Handshake} message="Affiliate tracking coming soon. Add docs to the platformPartners collection." />
          </SectionCard>
        )}
      </PageBody>
    </div>
  );
}
