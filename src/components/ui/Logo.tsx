import * as React from "react";
import { cn } from "../../lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

/** The Ilmoz mark — a glowing glass hexagon node with an orbiting accent. */
export function Logo({ className, showText = true, size = 36 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 40 40" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="ilmoz-g" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0" stopColor="#5f90ff" />
              <stop offset="1" stopColor="#2450f5" />
            </linearGradient>
          </defs>
          <path
            d="M20 2.5 34.5 11v18L20 37.5 5.5 29V11L20 2.5Z"
            fill="url(#ilmoz-g)"
            fillOpacity="0.18"
            stroke="url(#ilmoz-g)"
            strokeWidth="1.5"
          />
          <path
            d="M20 13v14 M16 13h8 M16 27h8"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {showText && (
        <div className="leading-none">
          <span className="text-lg font-bold tracking-tight text-white">
            Ilmoz
          </span>
        </div>
      )}
    </div>
  );
}
