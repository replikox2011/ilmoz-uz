import * as React from "react";
import { cn } from "../../lib/utils";

export interface LineSeries {
  label: string;
  color: string;
  /** One entry per x-axis slot; null = no data point (gap). */
  points: (number | null)[];
}

interface LineChartProps {
  series: LineSeries[];
  xLabels: string[];
  height?: number;
  className?: string;
}

/**
 * Multi-line chart on a fixed 0–100 y-scale. Each series draws its own coloured
 * polyline, skipping null points (gaps). Used for the per-student performance
 * charts — one line for the average, or one line per assignment.
 */
export function LineChart({ series, xLabels, height = 220, className }: LineChartProps) {
  const width = 560;
  const padL = 34;
  const padR = 12;
  const padT = 12;
  const padB = 26;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const n = xLabels.length;
  const maxX = Math.max(n - 1, 1);

  const xOf = (i: number) => padL + (n === 1 ? plotW / 2 : (i / maxX) * plotW);
  const yOf = (v: number) => padT + (1 - Math.max(0, Math.min(v, 100)) / 100) * plotH;

  const gridVals = [0, 25, 50, 75, 100];

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="min-w-[360px]" role="img">
        {/* horizontal grid + y labels */}
        {gridVals.map((g) => {
          const y = yOf(g);
          return (
            <g key={g}>
              <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="currentColor" strokeWidth={1} className="text-white/8" />
              <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-white/35 text-[9px]">{g}</text>
            </g>
          );
        })}

        {/* x labels */}
        {xLabels.map((lbl, i) => (
          <text key={i} x={xOf(i)} y={height - 8} textAnchor="middle" className="fill-white/35 text-[9px]">{lbl}</text>
        ))}

        {/* series lines */}
        {series.map((s, si) => {
          // Break the polyline into contiguous non-null segments.
          const segments: string[] = [];
          let cur: string[] = [];
          s.points.forEach((v, i) => {
            if (v === null) {
              if (cur.length) { segments.push(cur.join(" ")); cur = []; }
            } else {
              cur.push(`${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`);
            }
          });
          if (cur.length) segments.push(cur.join(" "));
          return (
            <g key={si}>
              {segments.map((seg, i) => (
                <polyline key={i} points={seg} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              ))}
              {s.points.map((v, i) =>
                v === null ? null : <circle key={i} cx={xOf(i)} cy={yOf(v)} r={2.5} fill={s.color} />
              )}
            </g>
          );
        })}
      </svg>

      {/* legend */}
      {series.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-xs text-white/60">
              <span className="h-2 w-4 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
