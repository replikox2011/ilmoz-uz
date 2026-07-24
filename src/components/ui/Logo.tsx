import * as React from "react";
import { cn } from "../../lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

/** The Ilmoz brand logo — graduation cap with "im" letters on an open book. */
export function Logo({ className, showText = true, size = 36 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/logo.png"
        alt="Ilmoz"
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
        draggable={false}
      />
      {showText && (
        <div className="leading-none">
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            Ilmoz
          </span>
        </div>
      )}
    </div>
  );
}
