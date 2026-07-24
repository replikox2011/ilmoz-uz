import * as React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";
import { navForRole } from "../../config/nav";
import { Role } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { useAuth } from "../../context/AuthContext";

// Show max 4 primary items, the rest go into "More"
const MAX_VISIBLE = 4;

interface BottomNavProps {
  role: Role;
}

export function BottomNav({ role }: BottomNavProps) {
  const items = navForRole(role);
  const { t } = useI18n();
  const { logoutToMain } = useAuth();
  const [showMore, setShowMore] = React.useState(false);

  const primary = items.slice(0, MAX_VISIBLE);
  const secondary = items.slice(MAX_VISIBLE);
  const hasMore = secondary.length > 0;

  return (
    <>
      {/* Backdrop for "More" drawer */}
      {showMore && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More drawer — slides up from bottom */}
      {showMore && (
        <motion.div
          key="drawer"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 36 }}
          className="fixed bottom-[72px] left-0 right-0 z-50 mx-3 mb-1 overflow-hidden rounded-3xl border border-[var(--color-border)] glass shadow-glass-lg backdrop-blur-3xl lg:hidden"
        >
          <div className="p-3">
            <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-faint)]">
              {t("sidebar.workspace")}
            </p>
            <ul className="space-y-0.5">
              {secondary.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setShowMore(false)}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                        isActive
                          ? "text-[var(--color-text)]"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="more-active"
                            className="absolute inset-0 -z-10 rounded-xl bg-[var(--color-surface-active)] ring-1 ring-[var(--color-border)]"
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                          />
                        )}
                        <item.icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            isActive ? "text-brand-400" : "text-[var(--color-text-muted)]"
                          )}
                        />
                        <span>{t(item.labelKey)}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Logout button inside drawer */}
            <div className="mt-2 border-t border-[var(--color-border)] pt-2">
              <button
                onClick={() => { setShowMore(false); logoutToMain(); }}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--color-text-muted)] transition-all hover:text-[var(--color-text)]"
              >
                <LogOut className="h-5 w-5 shrink-0 text-[var(--color-text-faint)] group-hover:text-[var(--color-text-muted)]" />
                <span>{t("sidebar.backToMain")}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        {/* Safe area glass pill */}
        <div className="mx-0 border-t border-[var(--color-border)] bg-[var(--color-bg)]/90 px-2 pb-safe-bottom backdrop-blur-3xl">
          <ul className="flex items-center justify-around py-1">
            {primary.map((item) => (
              <li key={item.to} className="flex-1">
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className="group flex flex-col items-center gap-0.5 py-2 outline-none"
                >
                  {({ isActive }) => (
                    <span className="relative flex flex-col items-center gap-0.5">
                      {isActive && (
                        <motion.span
                          layoutId="bottom-nav-indicator"
                          className="absolute -top-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(59,107,255,0.7)]"
                          transition={{ type: "spring", stiffness: 500, damping: 36 }}
                        />
                      )}
                      <span
                        className={cn(
                          "grid h-9 w-9 place-items-center rounded-2xl transition-all duration-200",
                          isActive
                            ? "bg-brand-500/15 scale-105"
                            : "group-active:scale-90"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-[20px] w-[20px] transition-colors duration-200",
                            isActive ? "text-brand-400" : "text-[var(--color-text-faint)] group-hover:text-[var(--color-text-muted)]"
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          "text-[10px] font-medium tracking-wide transition-colors duration-200",
                          isActive ? "text-brand-400" : "text-[var(--color-text-faint)]"
                        )}
                      >
                        {t(item.labelKey)}
                      </span>
                    </span>
                  )}
                </NavLink>
              </li>
            ))}

            {/* More button */}
            {hasMore && (
              <li className="flex-1">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="group flex w-full flex-col items-center gap-0.5 py-2 outline-none"
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-2xl transition-all duration-200",
                      showMore ? "bg-[var(--color-surface-active)] scale-105" : "group-active:scale-90"
                    )}
                  >
                    <MoreHorizontal
                      className={cn(
                        "h-[20px] w-[20px] transition-colors duration-200",
                        showMore ? "text-[var(--color-text)]" : "text-[var(--color-text-faint)]"
                      )}
                    />
                  </span>
                  <span className={cn(
                    "text-[10px] font-medium tracking-wide transition-colors duration-200",
                    showMore ? "text-[var(--color-text-muted)]" : "text-[var(--color-text-faint)]"
                  )}>
                    More
                  </span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </nav>
    </>
  );
}
