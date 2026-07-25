import * as React from "react";
import { Link } from "react-router-dom";
import {
  Users, GraduationCap, UserSquare2, DoorOpen, BookOpen,
  Wallet, BarChart3, Settings, Sparkles, Globe, Shield,
  ExternalLink, Building2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { buildSubdomainUrl } from "../../lib/subdomain";
import { formatMoney } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";

// Quick-action card that links to a management page
function ActionCard({
  icon: Icon,
  label,
  desc,
  to,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  to: string;
  accent: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
    >
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition group-hover:scale-105"
        style={{ background: accent + "22", boxShadow: `0 0 0 1px ${accent}44`, color: accent }}
      >
        <Icon className="h-5 w-5 shrink-0" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-white">{label}</p>
        <p className="truncate text-xs text-white/40">{desc}</p>
      </div>
      <span className="ml-auto text-white/20 transition group-hover:text-white/50">→</span>
    </Link>
  );
}

export function AdminPanelPage() {
  const { center, user } = useAuth();
  const data = useCenterData();
  const { t } = useI18n();

  const activeGroups = data.groups.filter((g) => g.status === "active");
  const totalRevenue = data.payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = data.payments.filter((p) => p.status === "pending").length;

  const stats = [
    { label: t("nav.students"), value: data.loading ? "—" : data.students.length, icon: GraduationCap, accent: "#0ea5e9" },
    { label: t("nav.teachers"), value: data.loading ? "—" : data.teachers.length, icon: UserSquare2, accent: "#a855f7" },
    { label: t("nav.groups"), value: data.loading ? "—" : activeGroups.length, icon: Users, accent: "#3b6bff" },
    { label: t("nav.rooms"), value: data.loading ? "—" : data.rooms.length, icon: DoorOpen, accent: "#f59e0b" },
  ];

  const actions = [
    { icon: GraduationCap, label: t("nav.students"), desc: "Manage students & enrollments", to: "/students", accent: "#0ea5e9" },
    { icon: UserSquare2, label: t("nav.teachers"), desc: "Staff and teacher accounts", to: "/teachers", accent: "#a855f7" },
    { icon: Users, label: t("nav.groups"), desc: "Classes, schedules, courses", to: "/groups", accent: "#3b6bff" },
    { icon: Wallet, label: t("nav.finance"), desc: "Payments and invoices", to: "/finance", accent: "#f59e0b" },
    { icon: BarChart3, label: t("nav.analytics"), desc: "Reports and insights", to: "/analytics", accent: "#ec4899" },
    { icon: Sparkles, label: t("nav.copilot"), desc: "AI assistant for your center", to: "/ai", accent: "#6366f1" },
    { icon: Settings, label: t("nav.settings"), desc: "Center settings & login theme", to: "/settings", accent: "#64748b" },
  ];

  return (
    <Stagger className="space-y-6">
      <FadeItem>
        <PageHeader
          title="Admin Panel"
          subtitle={`${center?.name ?? "Your center"} — management console`}
        />
      </FadeItem>

      {/* Center identity + subdomain link */}
      <FadeItem>
        <GlassCard className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {center?.logoUrl ? (
              <img src={center.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-contain" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/20 ring-1 ring-brand-400/30">
                <Building2 className="h-7 w-7 text-brand-300" />
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-white">{center?.name}</p>
              {center?.description && (
                <p className="mt-0.5 text-sm text-white/45">{center.description}</p>
              )}
              <div className="mt-1 flex items-center gap-1.5 text-xs text-white/35">
                <Shield className="h-3 w-3" />
                <span>{user?.role}</span>
              </div>
            </div>
          </div>

          {center?.subdomain ? (
            <a
              href={buildSubdomainUrl(center.subdomain) + "/"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="glass" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                {center.subdomain}.ilmoz.uz
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Button>
            </a>
          ) : (
            <Link to="/settings">
              <Button variant="glass" size="sm">Set up subdomain →</Button>
            </Link>
          )}
        </GlassCard>
      </FadeItem>

      {/* Stats */}
      <FadeItem>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </FadeItem>

      {/* Revenue summary */}
      <FadeItem>
        <GlassCard className="flex items-center justify-between p-5">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Paid revenue</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatMoney(totalRevenue, center?.currency)}
            </p>
          </div>
          {pendingPayments > 0 && (
            <div className="text-right">
              <p className="text-xs text-white/40">Pending</p>
              <p className="mt-1 text-lg font-semibold text-amber-400">{pendingPayments}</p>
            </div>
          )}
          <Link to="/finance" className="ml-4">
            <Button variant="glass" size="sm">View finance →</Button>
          </Link>
        </GlassCard>
      </FadeItem>

      {/* Quick actions */}
      <FadeItem>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/35">
          Management
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((a) => (
            <ActionCard key={a.to} {...a} />
          ))}
        </div>
      </FadeItem>
    </Stagger>
  );
}
