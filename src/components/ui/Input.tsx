import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "h-12 w-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-faint)]",
            "transition-all duration-300 outline-none",
            "focus:border-brand-400/60 focus:bg-[var(--color-surface-hover)] focus:ring-4 focus:ring-brand-500/15",
            icon && "pl-11",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, error, hint, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-xs font-medium text-[var(--color-text-muted)]">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--color-text-faint)]">{hint}</p>
      ) : null}
    </div>
  );
}
