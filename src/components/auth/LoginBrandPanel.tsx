import * as React from "react";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Center } from "../../types";
import { getLoginTemplate, LoginTemplateId } from "../../config/loginTemplates";
import { cn } from "../../lib/utils";

// ---------------------------------------------------------------------------
// LoginBrandPanel — renders the "brand" side of the login screen using the
// center's chosen template (`center.loginTheme.templateId`) + customizations.
// One render function per template id; all share the small helpers below.
// ---------------------------------------------------------------------------

interface LoginBrandPanelProps {
  center: Center;
  /** Render in a compact preview box (used by the Settings builder). */
  preview?: boolean;
  className?: string;
}

// hex (#rrggbb) → "r, g, b" for use inside rgba()
function hexRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full || "3b6bff", 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Resolved, defaulted view-model for a template render function. */
interface View {
  center: Center;
  accent: string;
  rgb: string; // "r, g, b"
  headline: string;
  tagline?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  hidePoweredBy: boolean;
  preview: boolean;
}

// ── shared pieces ──────────────────────────────────────────────────────────

function LogoMark({ v, className }: { v: View; className?: string }) {
  if (v.logoUrl) {
    return (
      <img
        src={v.logoUrl}
        alt={v.center.name}
        className={cn("rounded-2xl object-contain", className)}
      />
    );
  }
  return (
    <div
      className={cn("grid place-items-center rounded-2xl", className)}
      style={{ background: `rgba(${v.rgb}, 0.18)`, boxShadow: `inset 0 0 0 1px rgba(${v.rgb}, 0.35)` }}
    >
      <Building2 style={{ color: v.accent }} className="h-1/2 w-1/2" />
    </div>
  );
}

function Headline({ v }: { v: View }) {
  return (
    <div className="relative z-10 max-w-md">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "font-bold leading-tight tracking-tight text-white",
          v.preview ? "text-xl" : "text-4xl xl:text-5xl"
        )}
      >
        {v.headline}
      </motion.h1>
      {v.tagline && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={cn("text-white/55", v.preview ? "mt-2 text-xs" : "mt-4 text-lg")}
        >
          {v.tagline}
        </motion.p>
      )}
    </div>
  );
}

function PoweredBy({ v, className }: { v: View; className?: string }) {
  if (v.hidePoweredBy) return null;
  return (
    <p className={cn("relative z-10 text-xs text-white/35", className)}>
      Powered by Ilmoz
    </p>
  );
}

/** Common flex frame: logo top, headline middle, powered-by bottom. */
function Frame({ v, children, className }: { v: View; children?: React.ReactNode; className?: string }) {
  const logoSize = v.preview ? "h-9 w-9" : "h-11 w-11";
  return (
    <div className={cn("relative flex h-full flex-col justify-between overflow-hidden", v.preview ? "p-5" : "p-12", className)}>
      {children}
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark v={v} className={logoSize} />
        {v.hidePoweredBy && <span className="text-sm font-semibold text-white/70">{v.center.name}</span>}
      </div>
      <Headline v={v} />
      <PoweredBy v={v} />
    </div>
  );
}

// ── template renderers ─────────────────────────────────────────────────────

function Aurora(v: View) {
  return (
    <Frame v={v}>
      <div className="absolute -left-20 top-1/4 h-96 w-96 animate-float rounded-full blur-[100px]" style={{ background: `rgba(${v.rgb}, 0.30)` }} />
      <div className="absolute right-0 top-0 h-72 w-72 rounded-full blur-[90px]" style={{ background: `rgba(${v.rgb}, 0.20)` }} />
    </Frame>
  );
}

function Minimal(v: View) {
  return (
    <div className={cn("relative flex h-full flex-col items-center justify-center gap-6 bg-[#05060a] text-center", v.preview ? "p-5" : "p-12")}>
      <LogoMark v={v} className={v.preview ? "h-12 w-12" : "h-16 w-16"} />
      <div className="max-w-xs">
        <h1 className={cn("font-semibold tracking-tight text-white", v.preview ? "text-lg" : "text-3xl")}>{v.headline}</h1>
        {v.tagline && <p className={cn("text-white/45", v.preview ? "mt-1.5 text-xs" : "mt-3 text-base")}>{v.tagline}</p>}
      </div>
      <div className="h-px w-16" style={{ background: `rgba(${v.rgb}, 0.6)` }} />
      {!v.hidePoweredBy && <p className="absolute bottom-5 text-xs text-white/25">Powered by Ilmoz</p>}
    </div>
  );
}

function Cover(v: View) {
  return (
    <div className={cn("relative flex h-full flex-col justify-end overflow-hidden", v.preview ? "p-5" : "p-12")}>
      {v.backgroundUrl ? (
        <img src={v.backgroundUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
      <div className="relative z-10 mb-auto flex items-center gap-3">
        <LogoMark v={v} className={v.preview ? "h-9 w-9" : "h-11 w-11"} />
      </div>
      <Headline v={v} />
      <PoweredBy v={v} className="mt-6" />
    </div>
  );
}

function Mesh(v: View) {
  return (
    <div className={cn("relative flex h-full flex-col justify-between overflow-hidden", v.preview ? "p-5" : "p-12")}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(at 20% 20%, rgba(${v.rgb}, 0.55) 0px, transparent 50%),
            radial-gradient(at 80% 10%, rgba(236, 72, 153, 0.45) 0px, transparent 50%),
            radial-gradient(at 70% 80%, rgba(99, 102, 241, 0.50) 0px, transparent 50%),
            radial-gradient(at 10% 90%, rgba(34, 211, 238, 0.40) 0px, transparent 50%),
            #0a0c14`,
        }}
      />
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark v={v} className={v.preview ? "h-9 w-9" : "h-11 w-11"} />
      </div>
      <Headline v={v} />
      <PoweredBy v={v} />
    </div>
  );
}

function Spotlight(v: View) {
  return (
    <div className={cn("relative flex h-full flex-col items-center justify-center overflow-hidden bg-[#05060a] text-center", v.preview ? "p-5" : "p-12")}>
      <div
        className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, rgba(${v.rgb}, 0.35) 0%, transparent 55%)` }}
      />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="relative z-10 flex flex-col items-center gap-5">
        <LogoMark v={v} className={cn(v.preview ? "h-14 w-14" : "h-20 w-20")} />
        <h1 className={cn("font-bold tracking-tight text-white", v.preview ? "text-lg" : "text-4xl")}>{v.headline}</h1>
        {v.tagline && <p className={cn("max-w-xs text-white/50", v.preview ? "text-xs" : "text-lg")}>{v.tagline}</p>}
      </motion.div>
      {!v.hidePoweredBy && <p className="absolute bottom-5 z-10 text-xs text-white/30">Powered by Ilmoz</p>}
    </div>
  );
}

function Glass(v: View) {
  return (
    <div className={cn("relative flex h-full flex-col justify-between overflow-hidden", v.preview ? "p-5" : "p-12")}>
      <div className="absolute -left-10 top-10 h-72 w-72 rounded-full blur-[80px]" style={{ background: `rgba(${v.rgb}, 0.35)` }} />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full blur-[80px]" style={{ background: `rgba(${v.rgb}, 0.25)` }} />
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark v={v} className={v.preview ? "h-9 w-9" : "h-11 w-11"} />
      </div>
      <div className="relative z-10">
        <div
          className={cn("rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-2xl", v.preview ? "p-4" : "p-7")}
          style={{ boxShadow: `0 8px 40px rgba(${v.rgb}, 0.25)` }}
        >
          <h1 className={cn("font-bold tracking-tight text-white", v.preview ? "text-lg" : "text-4xl")}>{v.headline}</h1>
          {v.tagline && <p className={cn("text-white/60", v.preview ? "mt-1.5 text-xs" : "mt-3 text-lg")}>{v.tagline}</p>}
        </div>
      </div>
      <PoweredBy v={v} />
    </div>
  );
}

function Geometric(v: View) {
  return (
    <div className={cn("relative flex h-full flex-col justify-between overflow-hidden bg-[#070810]", v.preview ? "p-5" : "p-12")}>
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `linear-gradient(rgba(${v.rgb},0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(${v.rgb},0.6) 1px, transparent 1px)`,
          backgroundSize: v.preview ? "24px 24px" : "44px 44px",
        }}
      />
      <div className="absolute -right-8 top-16 h-40 w-40 rotate-12 rounded-3xl" style={{ background: `rgba(${v.rgb}, 0.25)` }} />
      <div className="absolute bottom-24 left-10 h-16 w-16 rounded-full border-2" style={{ borderColor: `rgba(${v.rgb}, 0.5)` }} />
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark v={v} className={v.preview ? "h-9 w-9" : "h-11 w-11"} />
      </div>
      <Headline v={v} />
      <PoweredBy v={v} />
    </div>
  );
}

function Wave(v: View) {
  return (
    <div className={cn("relative flex h-full flex-col justify-between overflow-hidden bg-[#070a14]", v.preview ? "p-5" : "p-12")}>
      <svg className="absolute inset-x-0 bottom-0 h-2/3 w-full" preserveAspectRatio="none" viewBox="0 0 400 300">
        <path d="M0 120 C 100 60, 300 200, 400 120 L400 300 L0 300 Z" fill={`rgba(${v.rgb}, 0.35)`} />
        <path d="M0 180 C 120 120, 280 260, 400 180 L400 300 L0 300 Z" fill={`rgba(${v.rgb}, 0.55)`} />
        <path d="M0 240 C 140 190, 260 300, 400 240 L400 300 L0 300 Z" fill={`rgba(${v.rgb}, 0.8)`} />
      </svg>
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark v={v} className={v.preview ? "h-9 w-9" : "h-11 w-11"} />
      </div>
      <Headline v={v} />
      <PoweredBy v={v} />
    </div>
  );
}

function Corporate(v: View) {
  return (
    <div
      className={cn("relative flex h-full flex-col justify-between overflow-hidden", v.preview ? "p-5" : "p-12")}
      style={{ background: `linear-gradient(145deg, ${v.accent} 0%, rgba(${v.rgb}, 0.55) 100%)` }}
    >
      <div className="absolute right-0 top-0 h-full w-1/2 bg-white/[0.04]" style={{ clipPath: "polygon(40% 0, 100% 0, 100% 100%, 0% 100%)" }} />
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark v={v} className={v.preview ? "h-9 w-9" : "h-11 w-11"} />
      </div>
      <div className="relative z-10 max-w-md">
        <h1 className={cn("font-bold leading-tight tracking-tight text-white", v.preview ? "text-xl" : "text-4xl xl:text-5xl")}>{v.headline}</h1>
        {v.tagline && <p className={cn("text-white/80", v.preview ? "mt-2 text-xs" : "mt-4 text-lg")}>{v.tagline}</p>}
      </div>
      {!v.hidePoweredBy && <p className="relative z-10 text-xs text-white/60">Powered by Ilmoz</p>}
    </div>
  );
}

function Neon(v: View) {
  return (
    <div className={cn("relative flex h-full flex-col justify-between overflow-hidden bg-[#05060a]", v.preview ? "p-5" : "p-12")}>
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: `linear-gradient(rgba(${v.rgb},0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(${v.rgb},0.5) 1px, transparent 1px)`,
          backgroundSize: v.preview ? "22px 22px" : "40px 40px",
          maskImage: "radial-gradient(circle at 50% 40%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 40%, black, transparent 75%)",
        }}
      />
      <div className="absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]" style={{ background: `rgba(${v.rgb}, 0.45)` }} />
      <div className="relative z-10 flex items-center gap-3">
        <LogoMark v={v} className={v.preview ? "h-9 w-9" : "h-11 w-11"} />
      </div>
      <div className="relative z-10 max-w-md">
        <h1
          className={cn("font-bold leading-tight tracking-tight text-white", v.preview ? "text-xl" : "text-4xl xl:text-5xl")}
          style={{ textShadow: `0 0 24px rgba(${v.rgb}, 0.8)` }}
        >
          {v.headline}
        </h1>
        {v.tagline && <p className={cn("text-white/60", v.preview ? "mt-2 text-xs" : "mt-4 text-lg")}>{v.tagline}</p>}
      </div>
      <PoweredBy v={v} />
    </div>
  );
}

const RENDERERS: Record<LoginTemplateId, (v: View) => React.ReactElement> = {
  aurora: Aurora,
  minimal: Minimal,
  cover: Cover,
  mesh: Mesh,
  spotlight: Spotlight,
  glass: Glass,
  geometric: Geometric,
  wave: Wave,
  corporate: Corporate,
  neon: Neon,
};

export function LoginBrandPanel({ center, preview = false, className }: LoginBrandPanelProps) {
  const template = getLoginTemplate(center.loginTheme?.templateId);
  const theme = center.loginTheme;
  const accent = theme?.accent || template.defaultAccent;

  const v: View = {
    center,
    accent,
    rgb: hexRgb(accent),
    headline: theme?.headline?.trim() || center.name,
    tagline: theme?.tagline?.trim() || center.description || undefined,
    logoUrl: center.logoUrl,
    backgroundUrl: theme?.backgroundUrl,
    hidePoweredBy: theme?.hidePoweredBy ?? false,
    preview,
  };

  const render = RENDERERS[template.id];
  return <div className={cn("h-full w-full", className)}>{render(v)}</div>;
}
