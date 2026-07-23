import * as React from "react";
import { motion } from "framer-motion";
import { Logo } from "../../components/ui/Logo";
import { Sparkles, ShieldCheck, Zap, Building2, Languages } from "lucide-react";
import { Center } from "../../types";
import { LoginBrandPanel } from "../../components/auth/LoginBrandPanel";
import { useI18n } from "../../i18n/I18nContext";
import { cn } from "../../lib/utils";

const highlights = [
  { icon: Sparkles, title: "Intelligent by design", desc: "AI woven through every workflow." },
  { icon: Zap, title: "Built for speed", desc: "Every action saves you real time." },
  { icon: ShieldCheck, title: "Isolated & secure", desc: "Your center's data stays yours." },
];

interface AuthLayoutProps {
  children: React.ReactNode;
  /** When set, replaces the Ilmoz brand panel with center-specific branding */
  centerBrand?: Center | null;
}

export function AuthLayout({ children, centerBrand }: AuthLayoutProps) {
  const { language, languages, setLanguage } = useI18n();

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Language Switcher */}
      <div className="absolute right-4 top-4 z-50 flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        <Languages className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-white/35" />
        {languages.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            className={cn(
              "rounded-xl px-2 py-1 text-[10px] font-bold transition",
              language === item.code
                ? "bg-white/10 text-white"
                : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"
            )}
            aria-label={item.label}
          >
            {item.short}
          </button>
        ))}
      </div>
      {centerBrand ? (
        // ── Center-specific branding (subdomain login page) — template-driven ──
        <div className="relative hidden overflow-hidden lg:block">
          <LoginBrandPanel center={centerBrand} />
        </div>
      ) : (
        // ── Default Ilmoz branding ──
        <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="absolute -left-20 top-1/4 h-96 w-96 animate-float rounded-full bg-brand-600/25 blur-[100px]" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-400/20 blur-[90px]" />
          <Logo size={40} />

            <div className="relative z-10 max-w-md">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="text-4xl font-bold leading-tight tracking-tight text-gradient xl:text-5xl"
              >
                The operating system for your learning center.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 text-lg text-white/50"
              >
                Teaching, management, finance, analytics and AI — unified in one
                beautifully fast workspace.
              </motion.p>

              <div className="mt-10 space-y-3">
                {highlights.map((h, i) => (
                  <motion.div
                    key={h.title}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
                    className="glass flex items-center gap-4 rounded-3xl p-4"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-500/20 ring-1 ring-brand-400/30">
                      <h.icon className="h-5 w-5 text-brand-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{h.title}</p>
                      <p className="text-xs text-white/45">{h.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          <p className="relative z-10 text-xs text-white/30">
            © 2026 Ilmoz · Education Operating System
          </p>
        </div>
      )}

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            {centerBrand ? (
              <div className="flex items-center gap-2">
                {centerBrand.logoUrl ? (
                  <img src={centerBrand.logoUrl} alt={centerBrand.name} className="h-8 w-8 rounded-lg object-contain" />
                ) : (
                  <Building2 className="h-7 w-7 text-brand-300" />
                )}
                <span className="text-base font-semibold text-white">{centerBrand.name}</span>
              </div>
            ) : (
              <Logo />
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
