import * as React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'group relative w-44 cursor-pointer overflow-hidden rounded-full border border-white/15 bg-white/[0.04] px-6 py-4 text-center text-sm font-semibold text-white backdrop-blur-xl',
        className
      )}
      {...props}
    >
      {/* Expanding dot that fills the button background on hover */}
      <div className="absolute left-[18%] top-1/2 z-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 transition-all duration-300 ease-out group-hover:left-0 group-hover:top-0 group-hover:h-full group-hover:w-full group-hover:translate-x-0 group-hover:translate-y-0 group-hover:rounded-none" />

      {/* Default label */}
      <span className="relative z-10 ml-4 inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {children}
      </span>

      {/* Hover label with arrow */}
      <div className="absolute inset-0 z-20 flex translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        <span>{children}</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </button>
  );
});

InteractiveHoverButton.displayName = 'InteractiveHoverButton';
