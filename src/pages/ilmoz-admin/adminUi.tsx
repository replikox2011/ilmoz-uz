import * as React from "react";
import { Search, RefreshCw, Info } from "lucide-react";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";

/**
 * Shared building blocks for the Nexo Admin console.
 *
 * These reproduce — 1:1 — the visual idioms already used in AdminOverviewPage
 * and AdminUsersPage (amber accent, `rounded-2xl border border-white/[0.06]`
 * surfaces, plain-div stat tiles, hand-rolled tables with pulse skeletons).
 * They exist only so the 15+ console sections stay pixel-consistent without
 * copy-pasting the same markup into every page. No new design system.
 */

// ── Stat tile ────────────────────────────────────────────────────────────────
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "bg-amber-500/20 text-amber-400",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-white/50">{label}</p>
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

// ── Status / role pill ───────────────────────────────────────────────────────
const PILL_TONES: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  sky: "bg-sky-500/15 text-sky-300",
  violet: "bg-violet-500/15 text-violet-300",
  brand: "bg-brand-500/15 text-brand-300",
  rose: "bg-rose-500/15 text-rose-300",
  red: "bg-red-500/15 text-red-300",
  neutral: "bg-white/[0.06] text-white/50",
};
export type PillTone = keyof typeof PILL_TONES;

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        PILL_TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Search input (matches AdminUsersPage) ────────────────────────────────────
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const resolvedPlaceholder = placeholder === "Search…" ? t("admin.searchPlaceholder") : placeholder;
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        className="w-64 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none"
      />
    </div>
  );
}

// ── Refresh button (matches AdminUsersPage) ──────────────────────────────────
export function RefreshButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-white/50 transition hover:text-white/80 disabled:opacity-40"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      {t("admin.refresh")}
    </button>
  );
}

// ── Filter tabs (matches AdminUsersPage role tabs) ───────────────────────────
export function FilterTabs<T extends string>({
  tabs,
  active,
  onChange,
  counts,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (k: T) => void;
  counts?: Record<string, number | string>;
}) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((f) => {
        const filterKey = `admin.filter.${f.key}`;
        const resolvedLabel = t(filterKey) !== filterKey ? t(filterKey) : f.label;
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition",
              active === f.key
                ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/25"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
            )}
          >
            {resolvedLabel}
            {counts && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  active === f.key
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-white/[0.06] text-white/40"
                )}
              >
                {counts[f.key] ?? 0}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Error banner (matches AdminUsersPage) ────────────────────────────────────
export function ErrorBanner({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
      {error}{" "}
      {onRetry && (
        <button onClick={onRetry} className="underline hover:no-underline">
          {t("admin.retry")}
        </button>
      )}
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <Icon className="h-8 w-8 text-white/15" />
      <p className="text-sm text-white/35">{message}</p>
    </div>
  );
}

// ── Table shell + skeleton rows ──────────────────────────────────────────────
export function Table({
  head,
  children,
}: {
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  const getHeaderLabel = () => {
    if (typeof children === "string") {
      const key = `admin.table.${children.toLowerCase().replace(/\s+/g, "")}`;
      return t(key) !== key ? t(key) : children;
    }
    return children;
  };
  return (
    <th className={cn("px-5 py-3 text-left text-xs font-medium text-white/40", className)}>
      {getHeaderLabel()}
    </th>
  );
}

export function Td({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <td className={cn("px-5 py-3.5", className)}>{children}</td>;
}

export function Tr({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]",
        className
      )}
    >
      {children}
    </tr>
  );
}

/** Skeleton rows matching the existing pulse pattern. */
export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-white/[0.04]">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-5 py-3.5">
              <div
                className="h-3 rounded-full bg-white/[0.05] animate-pulse"
                style={{ width: `${50 + j * 12}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Section card (labelled surface) ──────────────────────────────────────────
export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * A small notice shown at the top of sections whose backend data model does not
 * exist yet — the UI is fully built and reads from sample fixtures. Keeps the
 * scaffold honest instead of pretending the numbers are live.
 */
export function ScaffoldBanner({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-3.5 text-xs text-amber-200/80">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/70" />
      <p>
        {children ??
          "Preview data. This section's UI is complete; wire it to Firestore when the backend model lands."}
      </p>
    </div>
  );
}

// ── Standard page body wrapper (matches `<div className="p-8">`) ──────────────
export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="p-8">{children}</div>;
}

// ── Charts ───────────────────────────────────────────────────────────────────
// Hand-rolled bars matching the CRM AnalyticsPage idiom (gradient fills, CSS
// height, no chart library).
const BAR_COLORS = ["#f59e0b", "#3b6bff", "#22c55e", "#a855f7", "#38bdf8", "#f43f5e"];

/** Vertical bar chart. */
export function BarChart({
  data,
  height = 220,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        const color = BAR_COLORS[i % BAR_COLORS.length];
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs tabular-nums text-white/60">{d.value}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-lg rounded-b-sm transition-all"
                style={{
                  height: `${Math.max(pct, d.value > 0 ? 6 : 0)}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}55)`,
                }}
              />
            </div>
            <span className="text-xs font-medium text-white/45">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal labelled bar (usage meters, breakdowns). */
export function MeterBar({
  label,
  value,
  max,
  color = "#f59e0b",
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(max, 1)) * 100));
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white/45">
          {value.toLocaleString()}
          {suffix ? ` ${suffix}` : ""}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
        />
      </div>
    </div>
  );
}

// ── Toggle switch ────────────────────────────────────────────────────────────
export function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-amber-500/70" : "bg-white/[0.12]",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
