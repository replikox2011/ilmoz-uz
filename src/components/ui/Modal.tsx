import * as React from "react";
import { AnimatePresence as _AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

// Framer Motion v11 returns Element|undefined; TypeScript 4 JSX wants Element|null.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnimatePresence = _AnimatePresence as any as React.FC<{
  initial?: boolean;
  onExitComplete?: () => void;
  children?: React.ReactNode;
}>;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) {
      window.addEventListener("keydown", onKey);
      // Lock page scroll while modal is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        /* Outer: fills viewport, scrollable, centres content */
        <div className="fixed inset-0 z-50 overflow-y-auto p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Centering flex wrapper */}
          <div className="relative z-10 flex min-h-full items-center justify-center">
            <motion.div
              className={cn(
                "glass-strong relative w-full max-w-lg rounded-4xl p-6 shadow-glass-lg my-4",
                className
              )}
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <button
                onClick={onClose}
                className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              {title && (
                <h2 className="text-xl font-semibold text-white">{title}</h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-white/50">{description}</p>
              )}
              <div className={cn(title && "mt-5")}>{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
