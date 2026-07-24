import * as React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Shield, ChevronRight, Languages, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import { makeAdminNav } from "../../config/adminNav";
import { useAdminBase } from "./AdminRootContext";
import { useI18n } from "../../i18n/I18nContext";
import { useTheme } from "../../context/ThemeContext";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const base = useAdminBase();
  const { language, languages, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const ADMIN_NAV = makeAdminNav(base);
  const isOwner = !!user?.isadm;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)]" style={{ backgroundColor: "var(--color-bg-soft)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-[var(--color-border)] px-5 py-4">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/20 ring-1 ring-amber-400/30">
            <Shield className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-text)]">{t("admin.title")}</p>
            <p className="text-[10px] text-[var(--color-text-faint)]">{t("admin.subtitle")}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {ADMIN_NAV.map((group) => {
            const items = group.items.filter((it) => !it.ownerOnly || isOwner);
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="space-y-0.5">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)]">
                  {t(group.translationKey)}
                </p>
                {items.map(({ to, icon: Icon, end, translationKey }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-amber-500/15 text-amber-300"
                          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(translationKey)}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Language Selector + Theme Toggle */}
        <div className="border-t border-[var(--color-border)] px-4 py-2 flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-text-faint)] flex items-center gap-1">
            <Languages className="h-3 w-3" />
            {t("language.label")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              className="rounded-md p-1 text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
            >
              {theme === "dark" ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
            </button>
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[9px] font-bold transition",
                  language === item.code
                    ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                    : "text-[var(--color-text-faint)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-muted)]"
                )}
              >
                {item.short}
              </button>
            ))}
          </div>
        </div>

        {/* User */}
        <div className="border-t border-[var(--color-border)] p-3">
          <div className="flex items-center justify-between rounded-xl px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[var(--color-text-muted)]">{user?.name}</p>
              <p className="text-[10px] text-amber-400/70">{user?.isadm ? t("admin.role.owner") : t("admin.role.mod")}</p>
            </div>
            <button
              onClick={handleLogout}
              title={t("admin.signOut")}
              className="ml-2 rounded-lg p-1.5 text-[var(--color-text-faint)] transition hover:text-[var(--color-text-muted)]"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="min-h-screen flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

/** Admin breadcrumb component for page headers */
export function AdminHeader({
  title,
  subtitle,
  crumbs = [],
}: {
  title: string;
  subtitle?: string;
  crumbs?: { label: string; to?: string }[];
}) {
  const { t } = useI18n();

  const getNavKey = (label: string) => {
    const normalized = label.toLowerCase().replace(/\s+/g, "");
    if (normalized === "aianalytics") return "admin.nav.ai";
    if (normalized === "featureflags") return "admin.nav.flags";
    if (normalized === "versionmanager") return "admin.nav.versions";
    return `admin.nav.${normalized}`;
  };

  const titleKey = getNavKey(title);
  const resolvedTitle = t(titleKey) !== titleKey ? t(titleKey) : title;

  const subKey = `admin.subtitle.${title.toLowerCase().replace(/\s+/g, "")}`;
  const resolvedSubtitle = subtitle ? (t(subKey) !== subKey ? t(subKey) : subtitle) : undefined;

  return (
    <div className="border-b border-[var(--color-border)] px-8 py-6">
      {crumbs.length > 0 && (
        <div className="mb-1 flex items-center gap-1.5 text-xs text-[var(--color-text-faint)]">
          <span>{t("admin.title") || "Admin"}</span>
          {crumbs.map((c) => {
            const crumbKey = getNavKey(c.label);
            const resolvedCrumb = t(crumbKey) !== crumbKey ? t(crumbKey) : c.label;
            return (
              <React.Fragment key={c.label}>
                <ChevronRight className="h-3 w-3" />
                <span className={c.to ? "text-[var(--color-text-muted)]" : "text-[var(--color-text)]"}>{resolvedCrumb}</span>
              </React.Fragment>
            );
          })}
        </div>
      )}
      <h1 className="text-xl font-semibold text-[var(--color-text)]">{resolvedTitle}</h1>
      {resolvedSubtitle && <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{resolvedSubtitle}</p>}
    </div>
  );
}
