import * as React from "react";
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { FadeItem } from "../motion/Motion";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  /** Shorter value shown only on small screens (e.g. "$1.5K"). Falls back to `value`. */
  compactValue?: string | number;
  icon: LucideIcon;
  delta?: number;
  accent?: string;
  hint?: string;
}

export function StatCard({ label, value, compactValue, icon: Icon, delta, accent = "#3b6bff", hint }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <FadeItem>
      <GlassCard interactive className="@container overflow-hidden p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl ring-1 ring-white/10"
            style={{ background: `${accent}22` }}
          >
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          {delta !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                positive
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-red-500/15 text-red-300"
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <p className="mt-4 truncate text-2xl font-bold tracking-tight text-white @[10rem]:text-3xl">
          {compactValue !== undefined ? (
            <>
              <span className="@[10rem]:hidden">{compactValue}</span>
              <span className="hidden @[10rem]:inline">{value}</span>
            </>
          ) : (
            value
          )}
        </p>
        <p className="mt-1 truncate text-xs text-white/50 sm:text-sm">{label}</p>
        {hint && <p className="mt-2 text-xs text-white/30">{hint}</p>}
      </GlassCard>
    </FadeItem>
  );
}
