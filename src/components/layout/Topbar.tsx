import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bell, Command, LogOut, Users,
  GraduationCap, Settings, Sparkles,
  ArrowRight, LayoutDashboard, CalendarDays,
  Wallet, BarChart3, Languages, Sun, Moon, type LucideIcon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";
import { useTheme } from "../../context/ThemeContext";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "student" | "group" | "navigation";
  url: string;
  icon?: LucideIcon;
  avatarColor?: string;
}

export function Topbar() {
  const { user, center, logout } = useAuth();
  const { language, languages, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const data = useCenterData();
  const navigate = useNavigate();

  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Default navigation commands/options
  const navOptions = React.useMemo<SearchResult[]>(() => [
    { id: "nav-dash", title: t("nav.dashboard"), subtitle: t("topbar.nav.dashboard.subtitle"), type: "navigation", url: "/", icon: LayoutDashboard },
    { id: "nav-groups", title: t("nav.groups"), subtitle: t("topbar.nav.groups.subtitle"), type: "navigation", url: "/groups", icon: Users },
    { id: "nav-schedule", title: t("nav.schedule"), subtitle: t("topbar.nav.schedule.subtitle"), type: "navigation", url: "/schedule", icon: CalendarDays },
    { id: "nav-students", title: t("nav.students"), subtitle: t("topbar.nav.students.subtitle"), type: "navigation", url: "/students", icon: GraduationCap },
    { id: "nav-teachers", title: t("nav.teachers"), subtitle: t("topbar.nav.teachers.subtitle"), type: "navigation", url: "/teachers", icon: Users },
    { id: "nav-finance", title: t("nav.finance"), subtitle: t("topbar.nav.finance.subtitle"), type: "navigation", url: "/finance", icon: Wallet },
    { id: "nav-analytics", title: t("nav.analytics"), subtitle: t("topbar.nav.analytics.subtitle"), type: "navigation", url: "/analytics", icon: BarChart3 },
    { id: "nav-copilot", title: t("nav.copilot"), subtitle: t("topbar.nav.copilot.subtitle"), type: "navigation", url: "/ai", icon: Sparkles },
    { id: "nav-notifications", title: t("nav.notifications"), subtitle: t("topbar.nav.notifications.subtitle"), type: "navigation", url: "/notifications", icon: Bell },
    { id: "nav-settings", title: t("nav.settings"), subtitle: t("topbar.nav.settings.subtitle"), type: "navigation", url: "/settings", icon: Settings },
  ], [t]);

  // Global Ctrl+Q / Cmd+Q handler
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered results based on query
  const results = React.useMemo<SearchResult[]>(() => {
    if (!query.trim()) {
      return navOptions;
    }

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // 1. Search Students
    data.students.forEach(s => {
      if (s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q))) {
        matches.push({
          id: s.id,
          title: s.name,
          subtitle: s.phone || t("topbar.student.noPhone"),
          type: "student",
          url: "/students",
          avatarColor: s.avatarColor,
        });
      }
    });

    // 2. Search Groups
    data.groups.forEach(g => {
      if (g.name.toLowerCase().includes(q)) {
        matches.push({
          id: g.id,
          title: g.name,
          subtitle: `${g.status === "active" ? t("topbar.group.active") : t("topbar.group.completed")} • ${g.studentIds?.length || 0} ${t("topbar.group.studentsShort")}`,
          type: "group",
          url: "/groups",
        });
      }
    });

    // 3. Search Navigation
    navOptions.forEach(nav => {
      if (nav.title.toLowerCase().includes(q) || (nav.subtitle && nav.subtitle.toLowerCase().includes(q))) {
        matches.push(nav);
      }
    });

    return matches;
  }, [query, data.students, data.groups, navOptions, t]);

  // Reset selected index on query change
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle select action
  const handleSelect = (item: SearchResult) => {
    navigate(item.url);
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  // Keyboard navigation within the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % Math.max(1, results.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 px-4 pt-4">
      <div className="glass glass-highlight grid grid-cols-3 items-center rounded-3xl px-4 py-2 shadow-glass">
        {/* Left Section */}
        <div className="flex items-center">
          <span className="truncate text-sm font-semibold text-white/70 pl-1">
            {center?.name ?? "Ilmoz"}
          </span>
        </div>

        {/* Center: Search Input Container */}
        <div ref={containerRef} className="relative w-full max-w-md mx-auto">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("topbar.searchPlaceholder")}
            className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-10 pr-16 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/50 focus:bg-white/[0.05]"
          />
          <span className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/40 sm:flex">
            <Command className="h-3 w-3" /> K
          </span>

          {/* Inline Dropdown Panel */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-full max-h-[350px] overflow-y-auto rounded-3xl p-2 z-50 border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
              {results.length === 0 ? (
                <div className="py-8 text-center text-sm text-white/40">
                  {t("topbar.noResults")} «{query}»
                </div>
              ) : (
                <div className="space-y-0.5">
                  {results.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-150",
                          isSelected
                            ? "bg-brand-500/20 text-white ring-1 ring-brand-500/30"
                            : "text-white/70 hover:bg-white/[0.03] hover:text-white"
                        )}
                      >
                        {item.type === "student" ? (
                          <Avatar name={item.title} color={item.avatarColor} size="sm" />
                        ) : (
                          <div className={cn(
                            "grid h-8 w-8 place-items-center rounded-xl bg-white/[0.04]",
                            isSelected && "bg-brand-500/10 text-brand-300"
                          )}>
                            {item.type === "group" && <Users className="h-4 w-4" />}
                            {item.type === "navigation" && (item.icon ? <item.icon className="h-4 w-4" /> : <Command className="h-4 w-4" />)}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-xs text-white/45 truncate mt-0.5">{item.subtitle}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="neutral" className="text-[9px] capitalize opacity-60">
                            {item.type === "student" && t("topbar.result.student")}
                            {item.type === "group" && t("topbar.result.group")}
                            {item.type === "navigation" && t("topbar.result.navigation")}
                          </Badge>
                          {isSelected && (
                            <ArrowRight className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
