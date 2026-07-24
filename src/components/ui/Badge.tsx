import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
  {
    variants: {
      variant: {
        neutral: "bg-white/5 border-white/10 text-white/70",
        brand: "bg-brand-500/15 border-brand-400/30 text-brand-200",
        success: "bg-emerald-500/15 border-emerald-400/30 text-emerald-300",
        warning: "bg-amber-500/15 border-amber-400/30 text-amber-300",
        danger: "bg-red-500/15 border-red-400/30 text-red-300",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
