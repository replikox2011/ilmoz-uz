import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  strong?: boolean;
  interactive?: boolean;
  highlight?: boolean;
}

/** The core surface of Ilmoz — a frosted, blurred glass panel. */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, strong, interactive, highlight = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          strong ? "glass-strong" : "glass",
          highlight && "glass-highlight",
          "rounded-4xl shadow-glass",
          interactive &&
            "transition-all duration-300 hover:border-white/20 hover:shadow-glass-lg hover:-translate-y-0.5",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";
