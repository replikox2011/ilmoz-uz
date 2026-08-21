import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, LogOut, Settings, Languages, Sun, Moon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";
import { useTheme } from "../../context/ThemeContext";

export function Topbar() {
  const { user, center, logout } = useAuth();
  const { language, languages, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 px-4 pt-4">
      <div className="glass glass-highlight flex items-center justify-between rounded-3xl px-4 py-2 shadow-glass">
        {/* Left Section */}
        <div className="flex items-center">
          <span className="truncate text-sm font-semibold text-white/70 pl-1">
            {center?.name ?? "Ilmoz"}
          </span>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => navigate("/notifications")}
            title={t("nav.notifications")}
            className="relative grid h-10 w-10 place-items-center rounded-2xl text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand-400 ring-2 ring-bg" />
          </button>

          <button
            onClick={() => navigate("/settings")}
            title={t("nav.settings")}
            className="grid h-10 w-10 place-items-center rounded-2xl text-white/60 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Settings className="h-[18px] w-[18px]" />
          </button>

          <div className="mx-1 hidden h-8 w-px bg-[var(--color-border)] sm:block" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
            className="grid h-10 w-10 place-items-center rounded-2xl text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>

          <div
            className="hidden items-center gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1 xl:flex"
            title={t("language.label")}
          >
            <Languages className="ml-2 h-3.5 w-3.5 text-white/35" />
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={cn(
                  "rounded-xl px-2 py-1 text-[10px] font-bold transition",
                  language === item.code
                    ? "bg-white/10 text-white"
                    : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
                )}
                aria-label={item.label}
              >
                {item.short}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl py-1 pl-1 pr-2">
            <Avatar name={user.name} color={user.avatarColor} size="sm" />
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-[11px] text-white/40">{t(`role.${user.role}`)}</p>
            </div>
          </div>

          <button
            onClick={logout}
            title={t("topbar.signOut")}
            className="grid h-10 w-10 place-items-center rounded-2xl text-white/50 transition hover:bg-red-500/15 hover:text-red-300"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </header>
  );
}
