import * as React from "react";
import { cn } from "../../lib/utils";

interface SparklineProps {
  /** Series of values (0–100). One point per graded lesson, oldest → newest. */
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  className?: string;
}

/**
 * Tiny inline progress chart. Plots values on a fixed 0–100 y-scale so multiple
 * students' sparklines are visually comparable. Renders nothing meaningful for
 * fewer than 2 points (a single dot instead of a line).
 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  stroke = "#c7d2fe",
  className,
}: SparklineProps) {
  if (!values.length) {
    return <span className={cn("text-xs text-white/25", className)}>—</span>;
  }

  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const maxX = Math.max(values.length - 1, 1);

  const point = (v: number, i: number) => {
    const x = pad + (i / maxX) * w;
    const y = pad + (1 - Math.max(0, Math.min(v, 100)) / 100) * h;
    return [x, y] as const;
  };

  const pts = values.map(point);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = pts[pts.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      {/* baseline at 50% for reference */}
      <line
        x1={pad}
        x2={width - pad}
        y1={pad + 0.5 * h}
        y2={pad + 0.5 * h}
        stroke="currentColor"
        strokeWidth={1}
        className="text-white/10"
      />
      {values.length > 1 && (
        <polyline
          points={line}
          fill="none"
          stroke={stroke}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      <circle cx={lastX} cy={lastY} r={2.5} fill={stroke} />
    </svg>
  );
}
