import * as React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, LogOut } from "lucide-react";
import { cn } from "../../lib/utils";
import { Logo } from "../ui/Logo";
import { navForRole } from "../../config/nav";
import { Role } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  role: Role;
  centerName: string;
  isadm?: boolean;
  ismod?: boolean;
}

export function Sidebar({ role, centerName, isadm, ismod }: SidebarProps) {
  const items = navForRole(role);
  const { t } = useI18n();
  const { logoutToMain } = useAuth();
  const isPlatformUser = isadm || ismod;

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col p-3 h-full">
      {/* Single unified card */}
      <div className="glass glass-highlight flex flex-1 flex-col rounded-3xl shadow-glass overflow-hidden">
        {/* Logo + center */}
        <div className="px-4 pt-4 pb-3">
          <Logo />
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5">
            <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400/70" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{centerName}</p>
              <p className="text-[11px] text-white/40">
                {t(`role.${role}`)} {t("sidebar.workspaceSuffix")}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/[0.06]" />

        {/* Nav */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-2.5 py-3">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">
            {t("sidebar.workspace")}
          </p>
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm transition-all duration-300",
                      isActive
                        ? "text-white"
                        : "text-white/55 hover:text-white hover:bg-white/[0.04]"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 -z-10 rounded-xl bg-white/[0.08] ring-1 ring-white/10"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <item.icon
                        className={cn(
                          "h-[17px] w-[17px] shrink-0 transition-colors",
                          isActive ? "text-brand-300" : "text-white/45 group-hover:text-white/80"
                        )}
                      />
                      <span className="flex-1 truncate">{t(item.labelKey)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Platform admin link */}
          {isPlatformUser && (
            <>
              <p className="mt-3 px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400/50">
                Platform
              </p>
              <NavLink
                to="/ilmoz-admin"
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm transition-all duration-300",
                    isActive
                      ? "text-amber-300"
                      : "text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/[0.06]"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-platform"
                        className="absolute inset-0 -z-10 rounded-xl bg-amber-500/[0.08] ring-1 ring-amber-400/20"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <Shield className="h-[17px] w-[17px] shrink-0" />
                    <span className="flex-1 truncate">Ilmoz Admin</span>
                    {isadm && (
                      <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                        ADM
                      </span>
                    )}
                    {!isadm && ismod && (
                      <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">
                        MOD
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </>
          )}

          {/* Back to main site — прижат к низу */}
          <div className="mt-auto pt-3 border-t border-white/[0.06]">
            <button
              onClick={logoutToMain}
              className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/70"
            >
              <LogOut className="h-[17px] w-[17px] shrink-0 text-white/30 group-hover:text-white/60" />
              <span className="flex-1 truncate">{t("sidebar.backToMain")}</span>
            </button>
          </div>
        </nav>
      </div>
    </aside>
  );
}
