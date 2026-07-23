import * as React from "react";
import { cn, initials } from "../../lib/utils";

interface AvatarProps {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ name, color = "#3b6bff", size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full font-semibold text-white shadow-glow-sm ring-1 ring-white/15",
        sizes[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
      }}
    >
      {initials(name)}
    </div>
  );
}
