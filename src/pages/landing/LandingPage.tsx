import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  BarChart3,
  CreditCard,
  Bot,
  Check,
  CheckCircle2,
  Globe,
  AtSign,
  ArrowRight,
  CalendarDays,
  GraduationCap,
  Sparkles,
  TrendingUp,
  WalletCards,
  ChevronDown,
  Users,
  Zap,
  Shield,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { Logo } from '../../components/ui/Logo';
import { MagneticCard } from '../../components/ui/MagneticCard';
import { cn } from '../../lib/utils';
import LineWaves from './LineWaves';
import { InteractiveHoverButton } from '../../components/ui/InteractiveHoverButton';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const MAX = 'mx-auto w-full max-w-[1440px] px-6 lg:px-10';

// ── Orbital System ──────────────────────────────────────────────

function OrbitalSystem() {
  const containerRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Subtle parallax on the orbital rings as you scroll
    gsap.to('.orbit-ring-1', {
      yPercent: -15,
      ease: 'none',
      scrollTrigger: { trigger: containerRef.current, scrub: true, start: 'top top', end: 'bottom top' },
    });
    gsap.to('.orbit-ring-2', {
      yPercent: -8,
      ease: 'none',
      scrollTrigger: { trigger: containerRef.current, scrub: true, start: 'top top', end: 'bottom top' },
    });
    gsap.to('.orbit-ring-3', {
      yPercent: -5,
      ease: 'none',
      scrollTrigger: { trigger: containerRef.current, scrub: true, start: 'top top', end: 'bottom top' },
    });
  }, { scope: containerRef });

  const orbitDots = [
    // Ring 1 dots
    { ring: 1, angle: 0, size: 'md', color: '#3b6bff' },
    { ring: 1, angle: 120, size: 'sm', color: '#8b5cf6' },
    { ring: 1, angle: 240, size: 'lg', color: '#22d3ee' },
    // Ring 2 dots
    { ring: 2, angle: 45, size: 'sm', color: '#3b6bff' },
    { ring: 2, angle: 165, size: 'md', color: '#10b981' },
    { ring: 2, angle: 285, size: 'sm', color: '#8b5cf6' },
    // Ring 3 dots
    { ring: 3, angle: 30, size: 'sm', color: '#22d3ee' },
    { ring: 3, angle: 150, size: 'lg', color: '#3b6bff' },
    { ring: 3, angle: 270, size: 'md', color: '#ec4899' },
  ];

  const ringRadius = { 1: 300, 2: 450, 3: 600 };

  return (
    <div ref={containerRef} className="orbital-system" aria-hidden>
      {/* Orbit rings */}
      <div className="orbit-ring orbit-ring-1" />
      <div className="orbit-ring orbit-ring-2" />
      <div className="orbit-ring orbit-ring-3" />

      {/* Glowing dots positioned on rings */}
      {orbitDots.map((dot, i) => {
        const r = ringRadius[dot.ring as keyof typeof ringRadius];
        const rad = (dot.angle * Math.PI) / 180;
        const x = Math.cos(rad) * r;
        const y = Math.sin(rad) * r;
        return (
          <div
            key={i}
            className={cn('orbit-dot', `orbit-dot-${dot.size}`)}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              background: dot.color,
              boxShadow: `0 0 20px ${dot.color}80, 0 0 60px ${dot.color}30`,
            }}
          />
        );
      })}

      {/* Extra ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 400,
          height: 400,
          background: 'radial-gradient(circle, rgba(59,107,255,0.08), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
}

// ── Aurora Background ───────────────────────────────────────────

function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('aurora-bg', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(59,107,255,0.25),transparent_60%)]" />
    </div>
  );
}

// ── Blur Orb ────────────────────────────────────────────────────

function BlurOrb({
  className,
  color = 'rgba(59,107,255,0.12)',
  size = 600,
}: {
  className?: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute -z-10 animate-orb-drift rounded-full',
        className
      )}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${Math.max(60, size * 0.1)}px)`,
      }}
    />
  );
}

// ── Morphing Blob ───────────────────────────────────────────────

function MorphBlob({
  className,
  color = 'rgba(59,107,255,0.12)',
  size = 400,
}: {
  className?: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute -z-10 morph-blob', className)}
      style={{ width: size, height: size, background: color }}
    />
  );
}

// ── Spinning Ring ───────────────────────────────────────────────

function SpinRing({
  className,
  size = 500,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute -z-10 animate-spin-slow rounded-full opacity-[0.06] blur-3xl',
        className
      )}
      style={{
        width: size,
        height: size,
        background:
          'conic-gradient(from 0deg, #5f90ff, #8b5cf6, #ec4899, #22d3ee, #10b981, #5f90ff)',
      }}
    />
  );
}

// ── Marquee Logos ───────────────────────────────────────────────

function MarqueeLogos() {
  const logos = ['STUDENTOS', 'ORBIT ACADEMY', 'MENTOR', 'PROGRESS', 'ILMHUB', 'TALIMOT', 'EDUPRO', 'GENIUS'];
  const doubled = [...logos, ...logos];
  return (
    <div className="marquee-fade overflow-hidden">
      <div className="marquee-track">
        {doubled.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="mx-6 whitespace-nowrap text-sm font-medium tracking-[0.05em] text-white/30 sm:mx-10 sm:text-base"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Glowing Chart ───────────────────────────────────────────────

function GlowChart() {
  const chartRef = React.useRef<SVGSVGElement>(null);
  const path = 'M0,150 Q40,130 90,90 T180,70 T270,105 T360,20';

  useGSAP(() => {
    const strokePath = chartRef.current?.querySelector('.chart-stroke') as SVGPathElement | null;
    const fillPath = chartRef.current?.querySelector('.chart-fill') as SVGPathElement | null;
    if (!strokePath || !fillPath) return;

    const length = strokePath.getTotalLength();
    gsap.set(strokePath, { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(fillPath, { autoAlpha: 0 });

    gsap.to(strokePath, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: 'power2.inOut',
      scrollTrigger: { trigger: chartRef.current, start: 'top 80%', once: true },
    });

    gsap.to(fillPath, {
      autoAlpha: 1,
      duration: 1,
      delay: 0.4,
      scrollTrigger: { trigger: chartRef.current, start: 'top 80%', once: true },
    });
  }, { scope: chartRef });

  return (
    <svg
      ref={chartRef}
      viewBox="0 0 360 170"
      preserveAspectRatio="none"
      className="block h-full w-full"
      role="img"
      aria-label="Progress chart"
    >
      <defs>
        <linearGradient id="landing-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b6bff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3b6bff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="landing-chart-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3b6bff" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <path
        className="chart-fill"
        d={`${path} L360,170 L0,170 Z`}
        fill="url(#landing-chart-fill)"
      />
      <path
        className="chart-stroke"
        d={path}
        fill="none"
        stroke="url(#landing-chart-stroke)"
        strokeWidth={3}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 18px rgba(59,107,255,0.8))' }}
      />
    </svg>
  );
}

// ── Liquid Button ───────────────────────────────────────────────

function LiquidButton({
  children,
  onClick,
  large,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  large?: boolean;
}) {
  const btnRef = React.useRef<HTMLButtonElement>(null);

  useGSAP(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const handleEnter = () => gsap.to(btn, { scale: 1.06, boxShadow: '0 0 50px rgba(59,107,255,0.4)', duration: 0.4, ease: 'power2.out' });
    const handleLeave = () => gsap.to(btn, { scale: 1, boxShadow: '0 0 20px rgba(59,107,255,0.25)', duration: 0.4, ease: 'power2.out' });
    const handleDown = () => gsap.to(btn, { scale: 0.96, duration: 0.15 });
    const handleUp = () => gsap.to(btn, { scale: 1.06, duration: 0.3, ease: 'back.out(1.7)' });
    btn.addEventListener('mouseenter', handleEnter);
    btn.addEventListener('mouseleave', handleLeave);
    btn.addEventListener('mousedown', handleDown);
    btn.addEventListener('mouseup', handleUp);
    return () => {
      btn.removeEventListener('mouseenter', handleEnter);
      btn.removeEventListener('mouseleave', handleLeave);
      btn.removeEventListener('mousedown', handleDown);
      btn.removeEventListener('mouseup', handleUp);
    };
  }, { scope: btnRef });

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-full bg-brand-500 font-medium tracking-wide text-white shadow-glow-sm cursor-pointer',
        large ? 'px-10 py-4 text-base' : 'px-6 py-2.5 text-sm'
      )}
    >
      <span className="relative z-10">{children}</span>
      {/* Shimmer sweep */}
      <span className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      {/* Ring glow on hover */}
      <span className="absolute inset-0 rounded-full opacity-0 ring-2 ring-brand-400/40 transition-opacity duration-500 group-hover:opacity-100" />
      {/* Gradient overlay */}
      <span className="absolute inset-0 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
    </button>
  );
}


// ── Feature Card ────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  desc,
  orbColor,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  orbColor?: string;
  index: number;
}) {
  return (
    <MagneticCard className="h-full">
      <div className="feature-card bento-card group p-10 h-full">
        <div className="noise-overlay" />
        <div className="relative z-10">
        {/* Background orb */}
        {orbColor && (
          <div
            aria-hidden
            className="absolute -right-8 -top-8 h-40 w-40 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle, ${orbColor}, transparent 70%)`,
              filter: 'blur(40px)',
            }}
          />
        )}
        <div className="relative mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/[0.08] ring-1 ring-brand-400/20 transition-transform duration-400 group-hover:scale-110 group-hover:rotate-[5deg]">
          <Icon className="h-7 w-7 text-brand-400/80 transition-colors duration-500 group-hover:text-brand-300" />
          {/* Icon glow */}
          <div className="absolute inset-0 rounded-2xl bg-brand-400/0 transition-all duration-500 group-hover:bg-brand-400/10 group-hover:shadow-[0_0_30px_rgba(59,107,255,0.3)]" />
        </div>
        <h3 className="mb-4 text-xl font-light tracking-tight text-white/90">
          {title}
        </h3>
        <p className="font-extralight leading-relaxed tracking-wide text-white/45">
          {desc}
        </p>
        <FeaturePreview index={index} />
      </div>
    </div>
    </MagneticCard>
  );
}

function FeaturePreview({ index }: { index: number }) {
  const barRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (index !== 0 || !barRef.current) return;
    const bars = barRef.current.querySelectorAll('.bar-item');
    gsap.from(bars, {
      height: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: barRef.current, start: 'top 85%', once: true },
    });
  }, { scope: barRef });

  if (index === 0)
    return (
      <div ref={barRef} className="mt-8 flex h-14 items-end gap-1.5 rounded-xl border border-white/[.06] bg-black/20 p-3 backdrop-blur-sm">
        {[38, 54, 43, 72, 60, 86, 76].map((height, i) => (
          <span
            key={i}
            className="bar-item flex-1 rounded-t-sm bg-gradient-to-t from-brand-600/45 to-brand-300/75"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  if (index === 1)
    return (
      <div className="mt-8 rounded-xl border border-white/[.06] bg-black/20 p-3 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>Monthly revenue</span>
          <TrendingUp className="h-3 w-3 text-brand-300" />
        </div>
        <div className="mt-2 text-lg font-medium tracking-tight">
          $48,240{' '}
          <span className="text-[10px] font-medium text-brand-300">+18.4%</span>
        </div>
      </div>
    );
  return (
    <div className="mt-8 flex items-center gap-3 rounded-xl border border-white/[.06] bg-black/20 p-3 backdrop-blur-sm">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15">
        <Sparkles className="h-3.5 w-3.5 text-brand-300" />
      </div>
      <div className="space-y-1.5">
        <div className="progress-line-1 h-1.5 rounded-full bg-white/30" style={{ width: 112 }} />
        <div className="progress-line-2 h-1.5 rounded-full bg-white/10" style={{ width: 80 }} />
      </div>
    </div>
  );
}

// ── Price Card ──────────────────────────────────────────────────

function PriceCard({
  name,
  price,
  per,
  features,
  cta,
  onClick,
  highlighted,
  badge,
}: {
  name: string;
  price: string;
  per?: string;
  features: string[];
  cta: string;
  onClick?: () => void;
  highlighted?: boolean;
  badge?: string;
}) {
  return (
    <MagneticCard className="price-card h-full">
      <div
        className={cn(
          'bento-card relative h-full p-10',
          highlighted &&
            'border-brand-500/40 bg-brand-500/[0.03] shadow-glow-sm md:scale-105',
          highlighted && 'glow-ring glow-ring-visible'
        )}
      >
        {badge && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-medium uppercase tracking-[0.15em] text-white shadow-glow-sm">
            {badge}
          </div>
        )}
        <div className="relative z-10">
          <div className="mb-8">
            <h4
              className={cn(
                'mb-2 text-xs font-medium uppercase tracking-[0.2em]',
                highlighted ? 'text-brand-300/80' : 'text-white/45'
              )}
            >
              {name}
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extralight tracking-tight text-white">
                {price}
              </span>
              {per && (
                <span className="font-extralight text-white/40">{per}</span>
              )}
            </div>
          </div>
          <ul className="mb-10 space-y-4 text-white/50">
            {features.map((f) => (
              <li key={f} className="price-feature flex items-center gap-2 font-light">
                <Check
                  className={cn(
                    'h-4 w-4 shrink-0',
                    highlighted ? 'text-brand-400/80' : 'text-white/40'
                  )}
                />
                {f}
              </li>
            ))}
          </ul>
          {highlighted ? (
            <LiquidButton onClick={onClick} large>
              {cta}
            </LiquidButton>
          ) : (
            <button
              onClick={onClick}
              className="w-full rounded-2xl border border-white/[0.08] py-4 font-light tracking-wide backdrop-blur-sm transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {cta}
            </button>
          )}
        </div>
      </div>
    </MagneticCard>
  );
}

// ── Footer Column ───────────────────────────────────────────────

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h5 className="mb-6 text-sm font-medium tracking-wide text-white/80">
        {title}
      </h5>
      <ul className="space-y-4 text-sm font-light text-white/40">
        {links.map((l) => (
          <li key={l}>
            <button
              type="button"
              className="transition-colors duration-300 hover:text-brand-200/80 cursor-pointer"
            >
              {l}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Mock Dashboard ──────────────────────────────────────────────

function MockDashboard({ t }: { t: (k: string) => string }) {
  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/[.07] bg-[#090b13] text-left shadow-[0_28px_80px_rgba(0,0,0,.45)]">
      <div className="flex h-11 items-center justify-between border-b border-white/[.06] bg-white/[.02] px-4 md:px-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-5 w-5 place-items-center rounded-md bg-brand-500 shadow-[0_0_18px_rgba(59,107,255,.45)]">
            <GraduationCap className="h-3 w-3" />
          </div>
          <span className="text-[10px] font-semibold tracking-wide text-white/80">
            ILMOZ
          </span>
          <span className="hidden text-[10px] text-white/25 sm:inline">
            / Overview
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/[.08] px-2 py-1 text-[9px] text-white/45 sm:inline">
            June 2026
          </span>
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-brand-200 to-brand-600 ring-2 ring-white/[.08]" />
        </div>
      </div>
      <div className="grid min-h-[360px] grid-cols-[38px_1fr] md:min-h-[460px] md:grid-cols-[54px_1fr]">
        <aside className="flex flex-col items-center gap-4 border-r border-white/[.06] bg-black/10 py-4 text-white/30">
          <BarChart3 className="h-3.5 w-3.5 text-brand-300" />
          <CalendarDays className="h-3.5 w-3.5" />
          <GraduationCap className="h-3.5 w-3.5" />
          <WalletCards className="h-3.5 w-3.5" />
        </aside>
        <div className="p-3 md:p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[.16em] text-white/35">
                Good morning, Akmal
              </p>
              <h3 className="mt-1 text-sm font-semibold tracking-[-.035em] text-white md:text-lg">
                Your center is growing beautifully.
              </h3>
            </div>
            <span className="rounded-full bg-emerald-400/[.09] px-2 py-1 text-[8px] font-semibold text-emerald-300">
              +12.4% this month
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {[
              { l: 'Active students', v: '1,284', d: '+48' },
              { l: 'Attendance', v: '94.8%', d: '+2.1%' },
              { l: 'Monthly revenue', v: '$48.2k', d: '+18.4%' },
              { l: 'At risk', v: '12', d: '−5' },
            ].map((s) => (
              <div
                key={s.l}
                className="rounded-xl border border-white/[.06] bg-white/[.025] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]"
              >
                <p className="text-[8px] text-white/35">{s.l}</p>
                <p className="mt-1 text-sm font-semibold tracking-[-.04em] md:text-base">
                  {s.v}
                </p>
                <p className="mt-1 text-[8px] text-brand-300">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-[1.45fr_.9fr]">
            <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-white/65">
                    {t('landing.showcase.chartLabel')}
                  </p>
                  <p className="mt-1 text-[8px] text-white/30">Last 6 months</p>
                </div>
                <span className="rounded-full bg-brand-500/10 px-2 py-1 text-[8px] text-brand-200">
                  88.5% avg
                </span>
              </div>
              <div className="mt-2 h-28 md:h-36">
                <GlowChart />
              </div>
            </div>
            <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-3 md:p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-white/65">
                  Today&apos;s schedule
                </p>
                <CalendarDays className="h-3 w-3 text-white/35" />
              </div>
              <div className="mt-3 space-y-2">
                {[
                  ['09:00', 'IELTS · A2'],
                  ['11:30', 'Math · B1'],
                  ['14:00', 'Design · B2'],
                ].map(([time, name], i) => (
                  <div key={time} className="flex gap-2 border-l border-brand-400/70 pl-2">
                    <span className="text-[8px] text-white/35">{time}</span>
                    <span className="truncate text-[8px] text-white/65">
                      {name}
                    </span>
                    {i === 0 && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-brand-400/[.16] bg-brand-500/[.055] p-2.5">
            <div className="grid h-6 w-6 place-items-center rounded-lg bg-brand-500/20">
              <Sparkles className="h-3 w-3 text-brand-200" />
            </div>
            <p className="text-[9px] text-white/65">
              <span className="font-semibold text-brand-200">NexoGPT</span>{' '}
              found 3 students ready for an advanced group.
            </p>
            <ArrowRight className="ml-auto h-3 w-3 shrink-0 text-brand-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chat Mock ───────────────────────────────────────────────────

function ChatMock({ t }: { t: (k: string) => string }) {
  const chatRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const msgs = chatRef.current?.querySelectorAll('.chat-msg');
    if (!msgs) return;
    gsap.from(msgs, {
      x: (i: number) => (i === 0 ? 40 : -40),
      autoAlpha: 0,
      duration: 0.7,
      stagger: 0.25,
      ease: 'power3.out',
      scrollTrigger: { trigger: chatRef.current, start: 'top 80%', once: true },
    });
  }, { scope: chatRef });

  return (
    <MagneticCard>
      <div ref={chatRef} className="bento-card group/chat overflow-hidden rounded-[2rem] bg-bg-elevated/60 p-5 text-left shadow-glass-lg">
        <div className="noise-overlay" />
        <div className="relative z-10">
        <div className="mb-5 flex items-center gap-2 border-b border-white/[0.04] pb-4">
          <div className="bot-icon grid h-8 w-8 place-items-center rounded-xl bg-brand-500/15 ring-1 ring-brand-400/20">
            <Bot className="h-4 w-4 text-brand-300/80" />
          </div>
          <span className="text-sm font-light tracking-wide text-white/80">
            NexoGPT
          </span>
          <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
        </div>
        <div className="space-y-3">
          <div className="chat-msg ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-500/80 px-4 py-2.5 text-sm font-light text-white backdrop-blur-sm">
            {t('landing.copilot.userMsg')}
          </div>
          <div className="chat-msg max-w-[85%] rounded-2xl rounded-tl-sm bg-white/[0.05] px-4 py-2.5 text-sm font-light text-white/70 backdrop-blur-sm">
            {t('landing.copilot.botMsg')}
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-2">
          <TypingDots />
          <span className="text-xs font-light text-white/40">
            {t('landing.copilot.typing')}
          </span>
        </div>
      </div>
      </div>
    </MagneticCard>
  );
}

function TypingDots() {
  const dotsRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const dots = dotsRef.current?.querySelectorAll('.typing-dot');
    if (!dots) return;
    gsap.to(dots, {
      scale: 1.6,
      autoAlpha: 0.4,
      duration: 0.5,
      stagger: { each: 0.16, repeat: -1, yoyo: true },
      ease: 'sine.inOut',
    });
  }, { scope: dotsRef });

  return (
    <div ref={dotsRef} className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-brand-300/80" />
      ))}
    </div>
  );
}

// ── Animated Counter (GSAP) ─────────────────────────────────────

function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const countRef = React.useRef({ val: 0 });

  useGSAP(() => {
    gsap.to(countRef.current, {
      val: target,
      duration: 2,
      ease: 'power3.out',
      scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.floor(countRef.current.val).toLocaleString()}${suffix}`;
        }
      },
    });
  }, { scope: ref });

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// ── Nav Links ───────────────────────────────────────────────────

const NAV_LINKS: { key: string; href: string }[] = [
  { key: 'landing.nav.platform', href: '#features' },
  { key: 'landing.nav.curriculum', href: '#showcase' },
  { key: 'landing.nav.aiFeatures', href: '#copilot' },
  { key: 'landing.nav.pricing', href: '#pricing' },
];

// ═══════════════════════════════════════════════════════════════
//  MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════

export function LandingPage() {
  const { t, languages, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const goSignIn = () => navigate('/login');
  const goStart = () => navigate('/register');

  const landingRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLElement>(null);
  const progressRef = React.useRef<HTMLDivElement>(null);
  const dashboardRef = React.useRef<HTMLDivElement>(null);
  const featuresRef = React.useRef<HTMLElement>(null);
  const showcaseRef = React.useRef<HTMLElement>(null);
  const copilotRef = React.useRef<HTMLElement>(null);
  const statsRef = React.useRef<HTMLElement>(null);
  const pricingRef = React.useRef<HTMLElement>(null);
  const ctaRef = React.useRef<HTMLElement>(null);
  const footerRef = React.useRef<HTMLElement>(null);
  const chatFloatRef = React.useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: '(min-width: 768px)',
        isMobile: '(max-width: 767px)',
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, reduceMotion } = context.conditions!;
        const dur = reduceMotion ? 0 : undefined;

        // ── Scroll Progress ─────────────────────────────────
        if (progressRef.current) {
          gsap.to(progressRef.current, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: document.body,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.3,
            },
          });
        }

        // ── Hero Timeline ───────────────────────────────────
        if (heroRef.current) {
          const heroTl = gsap.timeline({
            defaults: { duration: dur ?? 0.9, ease: 'power3.out' },
          });

          heroTl
            .from('.hero-badge', { autoAlpha: 0, y: 30, filter: 'blur(10px)' })
            .from('.hero-title-line', {
              autoAlpha: 0,
              y: 60,
              filter: 'blur(12px)',
              stagger: 0.12,
              duration: dur ?? 1,
            }, '-=0.5')
            .from('.hero-subtitle', { autoAlpha: 0, y: 30, filter: 'blur(8px)' }, '-=0.5')
            .from('.hero-cta', {
              autoAlpha: 0,
              y: 30,
              scale: 0.9,
              stagger: 0.1,
            }, '-=0.4')
            .from('.hero-scroll-hint', { autoAlpha: 0, duration: dur ?? 0.6 }, '-=0.2');

          // Dashboard 3D entrance
          if (dashboardRef.current) {
            gsap.from(dashboardRef.current, {
              autoAlpha: 0,
              y: 120,
              rotateX: 15,
              scale: 0.92,
              duration: dur ?? 1.4,
              ease: 'power3.out',
              delay: 0.8,
            });

            // Float animation
            if (!reduceMotion) {
              gsap.to(dashboardRef.current, {
                y: -10,
                rotateX: 0.6,
                rotateY: -0.35,
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
              });
            }
          }
        }

        // ── Features stagger ────────────────────────────────
        if (featuresRef.current) {
          gsap.from(featuresRef.current.querySelectorAll('.section-heading'), {
            autoAlpha: 0,
            y: 50,
            filter: 'blur(10px)',
            duration: dur ?? 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: featuresRef.current, start: 'top 80%', once: true },
          });

          const cards = featuresRef.current.querySelectorAll('.feature-card');
          if (cards.length) {
            gsap.from(cards, {
              autoAlpha: 0,
              y: 40,
              scale: 0.95,
              filter: 'blur(10px)',
              duration: dur ?? 1.2,
              stagger: 0.12,
              ease: 'power3.out',
              immediateRender: false,
              scrollTrigger: {
                trigger: featuresRef.current,
                start: 'top 75%',
                once: true,
              },
            });
          }
        }

        // ── Showcase pinned scroll (desktop only) ───────────
        if (showcaseRef.current && isDesktop && !reduceMotion) {
          const showcaseTl = gsap.timeline({
            scrollTrigger: {
              trigger: showcaseRef.current,
              start: 'top top',
              end: '+=100%',
              scrub: 1,
              pin: true,
              pinSpacing: true,
            },
          });

          showcaseTl
            .from('.showcase-overline', { autoAlpha: 0, x: -30 })
            .from('.showcase-title', { autoAlpha: 0, y: 40, filter: 'blur(8px)' }, '<0.1')
            .from('.showcase-desc', { autoAlpha: 0, y: 30 }, '<0.15')
            .from('.showcase-point', { autoAlpha: 0, x: -20, stagger: 0.1 }, '<0.1')
            .from('.showcase-chart', { autoAlpha: 0, scale: 0.9, x: 60 }, '<0.1');
        } else if (showcaseRef.current) {
          // Mobile: simple reveal
          gsap.from(showcaseRef.current.querySelectorAll('.showcase-overline, .showcase-title, .showcase-desc, .showcase-point, .showcase-chart'), {
            autoAlpha: 0,
            y: 40,
            duration: dur ?? 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: showcaseRef.current, start: 'top 80%', once: true },
          });
        }

        // ── AI Copilot section ──────────────────────────────
        if (copilotRef.current) {
          gsap.from(copilotRef.current.querySelectorAll('.section-heading'), {
            autoAlpha: 0,
            y: 50,
            filter: 'blur(10px)',
            duration: dur ?? 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: copilotRef.current, start: 'top 80%', once: true },
          });

          // Floating chat mock
          if (chatFloatRef.current && !reduceMotion) {
            gsap.to(chatFloatRef.current, {
              y: -16,
              duration: 3.5,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          }

          // Bot icon wiggle
          const botIcon = copilotRef.current.querySelector('.bot-icon');
          if (botIcon && !reduceMotion) {
            gsap.to(botIcon, {
              rotation: 5,
              duration: 2,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          }
        }

        // ── Stats stagger ──────────────────────────────────
        if (statsRef.current) {
          ScrollTrigger.batch('.stat-card', {
            start: 'top 85%',
            onEnter: (elements) => {
              elements.forEach((el, i) => {
                gsap.from(el, {
                  autoAlpha: 0,
                  y: 40,
                  scale: 0.95,
                  filter: 'blur(10px)',
                  duration: dur ?? 1,
                  delay: i * 0.12,
                  ease: 'power3.out',
                });
                const inner = el.querySelectorAll('.relative.z-10 > *');
                if (inner.length) {
                  gsap.from(inner, {
                    autoAlpha: 0,
                    y: 20,
                    filter: 'blur(8px)',
                    duration: dur ?? 0.8,
                    stagger: 0.1,
                    delay: i * 0.12 + 0.15,
                    ease: 'power3.out',
                  });
                }
              });
            },
            once: true,
          });
        }

        // ── Pricing stagger ─────────────────────────────────
        if (pricingRef.current) {
          gsap.from(pricingRef.current.querySelectorAll('.section-heading'), {
            autoAlpha: 0,
            y: 50,
            filter: 'blur(10px)',
            duration: dur ?? 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: pricingRef.current, start: 'top 80%', once: true },
          });

          ScrollTrigger.batch('.price-card', {
            start: 'top 85%',
            onEnter: (elements) => {
              elements.forEach((el, i) => {
                gsap.from(el, {
                  autoAlpha: 0,
                  y: 40,
                  scale: 0.95,
                  filter: 'blur(10px)',
                  duration: dur ?? 1.2,
                  delay: i * 0.15,
                  ease: 'power3.out',
                });
                const inner = el.querySelectorAll('.relative.z-10 > *');
                if (inner.length) {
                  gsap.from(inner, {
                    autoAlpha: 0,
                    y: 20,
                    filter: 'blur(8px)',
                    duration: dur ?? 0.8,
                    stagger: 0.1,
                    delay: i * 0.15 + 0.2,
                    ease: 'power3.out',
                  });
                }
              });
            },
            once: true,
          });

          // Price features stagger inside each card
          ScrollTrigger.batch('.price-feature', {
            start: 'top 90%',
            onEnter: (elements) => {
              gsap.from(elements, {
                autoAlpha: 0,
                x: -10,
                duration: dur ?? 0.5,
                stagger: 0.06,
                ease: 'power2.out',
              });
            },
            once: true,
          });
        }

        // ── Final CTA ──────────────────────────────────────
        if (ctaRef.current) {
          const ctaBox = ctaRef.current.querySelector('.cta-box');
          if (ctaBox) {
            gsap.from(ctaBox, {
              autoAlpha: 0,
              scale: 0.95,
              y: 40,
              filter: 'blur(10px)',
              duration: dur ?? 1.2,
              ease: 'power3.out',
              scrollTrigger: { trigger: ctaRef.current, start: 'top 80%', once: true },
            });
            const inner = ctaBox.querySelectorAll('.relative.z-10 > *');
            if (inner.length) {
              gsap.from(inner, {
                autoAlpha: 0,
                y: 20,
                filter: 'blur(8px)',
                duration: dur ?? 0.8,
                stagger: 0.1,
                delay: 0.2,
                ease: 'power3.out',
                scrollTrigger: { trigger: ctaRef.current, start: 'top 80%', once: true },
              });
            }
          }
        }

        // ── Footer ─────────────────────────────────────────
        if (footerRef.current) {
          gsap.from(footerRef.current.querySelectorAll('.footer-col'), {
            autoAlpha: 0,
            y: 30,
            duration: dur ?? 0.6,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: { trigger: footerRef.current, start: 'top 90%', once: true },
          });
        }

        // ── Parallax layers ─────────────────────────────────
        if (!reduceMotion) {
          document.querySelectorAll('.parallax-slow').forEach((el) => {
            gsap.to(el, {
              yPercent: -10,
              ease: 'none',
              scrollTrigger: { trigger: el, scrub: true },
            });
          });
          document.querySelectorAll('.parallax-fast').forEach((el) => {
            gsap.to(el, {
              yPercent: -20,
              ease: 'none',
              scrollTrigger: { trigger: el, scrub: true },
            });
          });
        }
      }
    );
  }, { scope: landingRef });

  return (
    <div ref={landingRef} className="landing-page min-h-screen overflow-x-hidden bg-bg text-white">
      {/* Scroll Progress */}
      <div ref={progressRef} className="scroll-progress-gsap" />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.04] bg-bg/30 backdrop-blur-3xl">
        <div className={cn(MAX, 'flex h-20 items-center justify-between')}>
          <div className="flex items-center gap-10">
            <Logo size={30} />
            <div className="hidden gap-8 md:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.key}
                  href={l.href}
                  className="group relative text-sm font-light tracking-wide text-white/50 transition-colors duration-300 hover:text-white"
                >
                  {t(l.key)}
                  <span className="absolute -bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-brand-400 to-purple-400 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={goSignIn}
              className="rounded-full px-5 py-2.5 text-sm font-light tracking-wide text-white/70 transition-all duration-300 hover:bg-white/[0.04] hover:text-white cursor-pointer"
            >
              {t('landing.nav.signIn')}
            </button>
            <LiquidButton onClick={goStart}>
              {t('landing.nav.getStarted')}
            </LiquidButton>
          </div>
        </div>
      </nav>

      <main className="relative">
        {/* ── Global atmospheric layers ──────────────────────── */}
        <AuroraBackground />
        <OrbitalSystem />

        {/* Ambient blur orbs */}
        <BlurOrb className="left-[-18%] top-[-5%] parallax-slow" color="rgba(59, 107, 255, 0.15)" size={800} />
        <BlurOrb className="right-[-12%] top-[15%] parallax-fast" color="rgba(139, 92, 246, 0.10)" size={700} />
        <BlurOrb className="left-[25%] top-[35%] parallax-slow" color="rgba(34, 211, 238, 0.07)" size={600} />
        <BlurOrb className="right-[15%] top-[55%]" color="rgba(59, 107, 255, 0.08)" size={500} />
        <BlurOrb className="left-[-5%] top-[75%] parallax-fast" color="rgba(139, 92, 246, 0.06)" size={650} />

        {/* Spinning rings */}
        <SpinRing className="left-1/2 top-[5%] -translate-x-1/2 parallax-slow" size={700} />
        <SpinRing className="right-[-10%] top-[50%]" size={500} />

        {/* Morphing blobs */}
        <MorphBlob className="left-[10%] top-[8%] parallax-fast" color="rgba(59, 107, 255, 0.08)" size={500} />
        <MorphBlob className="right-[5%] top-[45%]" color="rgba(139, 92, 246, 0.06)" size={400} />
        <MorphBlob className="left-[40%] top-[80%] parallax-slow" color="rgba(34, 211, 238, 0.05)" size={350} />

        {/* ── Hero ──────────────────────────────────────────── */}
        <section ref={heroRef} className={cn(MAX, 'relative pb-28 pt-40 text-center md:pt-48')}>
          <div
            className="absolute inset-x-0 top-0 z-0 h-[520px] overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent, black 20%, black 48%, transparent 82%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent, black 20%, black 48%, transparent 82%)',
            }}
          >
            <LineWaves
              speed={0.3}
              innerLineCount={32}
              outerLineCount={36}
              warpIntensity={1}
              rotation={-45}
              edgeFadeWidth={0}
              colorCycleSpeed={1}
              brightness={0.08}
              color1="#ffffff"
              color2="#ffffff"
              color3="#ffffff"
              enableMouseInteraction
              mouseInfluence={2}
            />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[620px]"
            style={{
              background:
                'radial-gradient(ellipse 55% 60% at 50% 35%, rgba(5,6,10,0.92), rgba(5,6,10,0.6) 50%, transparent 78%)',
            }}
          />
          <div className="relative z-10">
            <div className="hero-badge mb-9 inline-flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.045] px-4 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_10px_35px_rgba(0,0,0,.16)] backdrop-blur-xl">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-400 shadow-[0_0_8px_rgba(59,107,255,0.6)]" />
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-brand-300/80">
                {t('landing.hero.badge')}
              </span>
            </div>

            <h1 className="mx-auto max-w-6xl text-[3.1rem] font-medium leading-[0.96] tracking-[-0.065em] sm:text-7xl md:text-[6.5rem]">
              <span className="hero-title-line text-gradient">{t('landing.hero.titleA')}</span>
              <span className="hero-title-line block pt-2 font-semibold md:pt-4">
                <span className="text-gradient-animated">
                  {t('landing.hero.titleAccent')}
                </span>
              </span>
            </h1>

            <p className="hero-subtitle mx-auto mt-8 max-w-2xl text-base leading-7 tracking-[-0.01em] text-white/60 md:text-lg">
              {t('landing.hero.subtitle')}
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <InteractiveHoverButton
                onClick={goStart}
                className="hero-cta"
              >
                {t('landing.hero.ctaPrimary')}
              </InteractiveHoverButton>
            </div>
          </div>

          {/* 3D Product Mockup */}
          <div
            ref={dashboardRef}
            className="landing-product-frame group relative z-20 mx-auto mt-20 max-w-6xl [perspective:1600px]"
          >
            <div className="relative liquid-glass liquid-reflection rounded-[2rem] p-2.5 transition-transform duration-700 ease-out [transform:rotateX(9deg)_rotateY(-2deg)_scale(.97)] group-hover:[transform:rotateX(2deg)_rotateY(1deg)_scale(1)]">
              <div className="absolute inset-0 rounded-[2rem] bg-[#05060a]" />
              <div className="relative z-10">
                <MockDashboard t={t} />
              </div>
            </div>
            {/* Deep glow behind mockup */}
            <div className="absolute inset-0 -z-10 translate-y-8 scale-90 rounded-full bg-brand-500/15 blur-[120px] transition-all duration-700 group-hover:translate-y-4 group-hover:scale-95 group-hover:bg-brand-500/25" />
          </div>

          {/* Scroll indicator */}
          <div className="hero-scroll-hint mt-16 flex justify-center">
            <ChevronDown className="h-6 w-6 animate-bounce-scroll text-white/30" />
          </div>
        </section>

        {/* ── Logo Marquee ──────────────────────────────────── */}
        <section className="relative py-12">
          {/* Glass background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent backdrop-blur-xl border-y border-white/[0.05]" />
          <div className="relative z-10">
            <p className="mb-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
              {t('landing.logos.title')}
            </p>
            <MarqueeLogos />
          </div>
        </section>

        {/* Gradient divider */}
        <div className="section-divider" />

        {/* ── Features ──────────────────────────────────────── */}
        <section ref={featuresRef} id="features" className={cn(MAX, 'relative py-32')}>
          <div className="mb-20 text-center">
            <h2 className="section-heading text-4xl font-semibold tracking-[-0.055em] md:text-6xl">
              <span className="text-gradient-animated">
                {t('landing.features.title')}
              </span>
            </h2>
            <p className="section-heading mx-auto mt-6 max-w-xl font-extralight tracking-wide text-white/45">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BarChart3,
                tk: 'gradebook',
                orb: 'rgba(59,107,255,0.12)',
              },
              {
                icon: CreditCard,
                tk: 'payments',
                orb: 'rgba(139,92,246,0.12)',
              },
              {
                icon: Bot,
                tk: 'copilot',
                orb: 'rgba(16,185,129,0.12)',
              },
            ].map((f, i) => (
              <FeatureCard
                key={f.tk}
                icon={f.icon}
                title={t(`landing.features.${f.tk}.title`)}
                desc={t(`landing.features.${f.tk}.desc`)}
                orbColor={f.orb}
                index={i}
              />
            ))}
          </div>
        </section>

        {/* Gradient divider */}
        <div className="section-divider" />

        {/* ── Showcase ──────────────────────────────────────── */}
        <section ref={showcaseRef} id="showcase" className="relative overflow-hidden py-32">
          <div className={MAX}>
            <MagneticCard>
              <div className="bento-card rounded-[2rem] p-8 md:p-16">
                <div className="noise-overlay" />
                <div className="relative z-10 flex flex-col items-center gap-14 lg:flex-row">
                <div className="lg:w-1/2">
                  <span className="showcase-overline mb-4 block text-xs font-medium uppercase tracking-[0.2em] text-brand-300/70">
                    {t('landing.showcase.overline')}
                  </span>
                  <h2 className="showcase-title text-4xl font-semibold leading-[1.02] tracking-[-0.055em] md:text-6xl">
                    <span className="text-gradient-animated">
                      {t('landing.showcase.title')}
                    </span>
                  </h2>
                  <p className="showcase-desc mt-6 text-lg font-extralight tracking-wide text-white/50">
                    {t('landing.showcase.desc')}
                  </p>
                  <ul className="mt-8 space-y-4">
                    {['point1', 'point2', 'point3'].map((p) => (
                      <li
                        key={p}
                        className="showcase-point flex items-center gap-3 font-light text-white/75"
                      >
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400/80" />
                        {t(`landing.showcase.${p}`)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="showcase-chart w-full lg:w-1/2">
                  <div className="bento-card group/chart rounded-[1.5rem] bg-black/30 p-6">
                    <div className="relative z-10">
                      <div className="mb-8 flex items-center justify-between">
                        <h4 className="font-light tracking-wide">
                          {t('landing.showcase.chartLabel')}
                        </h4>
                        <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-medium text-brand-200/80">
                          88.5%
                        </span>
                      </div>
                      <GlowChart />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </MagneticCard>
          </div>
        </section>

        {/* Gradient divider */}
        <div className="section-divider" />

        {/* ── AI Copilot ────────────────────────────────────── */}
        <section ref={copilotRef} id="copilot" className={cn(MAX, 'relative py-32 text-center')}>
          <div className="mx-auto mb-16 max-w-2xl">
            <h2 className="section-heading text-4xl font-semibold tracking-[-0.055em] md:text-6xl">
              <span className="text-gradient-animated">
                {t('landing.copilot.title')}
              </span>
            </h2>
            <p className="section-heading mt-6 text-lg font-extralight tracking-wide text-white/50">
              {t('landing.copilot.desc')}
            </p>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute inset-0 scale-50 rounded-full bg-brand-500/15 blur-[140px]" />
            <div ref={chatFloatRef} className="relative z-10 w-full max-w-md">
              <ChatMock t={t} />
            </div>
          </div>
        </section>

        {/* Gradient divider */}
        <div className="section-divider" />

        {/* ── Stats / Numbers ───────────────────────────────── */}
        <section ref={statsRef} className={cn(MAX, 'relative py-32')}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, value: 1284, suffix: '+', label: 'Active Students' },
              { icon: Zap, value: 95, suffix: '%', label: 'Uptime' },
              { icon: Globe, value: 100, suffix: '+', label: 'Education Centers' },
              { icon: Shield, value: 4, suffix: '.9★', label: 'User Rating' },
            ].map((stat) => (
              <div key={stat.label} className="stat-card">
                <MagneticCard>
                  <div className="bento-card glow-ring group rounded-[1.5rem] p-8 text-center">
                    <div className="noise-overlay" />
                    <div className="relative z-10">
                    <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/[0.08] ring-1 ring-brand-400/20 transition-transform duration-400 group-hover:scale-[1.2] group-hover:rotate-[10deg]">
                      <stat.icon className="h-6 w-6 text-brand-400/80" />
                    </div>
                    <div className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <p className="mt-2 text-sm font-extralight tracking-wide text-white/45">
                      {stat.label}
                    </p>
                  </div>
                </div>
                </MagneticCard>
              </div>
            ))}
          </div>
        </section>

        {/* Gradient divider */}
        <div className="section-divider" />

        {/* ── Pricing ───────────────────────────────────────── */}
        <section ref={pricingRef} id="pricing" className={cn(MAX, 'relative py-32')}>
          <div className="mb-20 text-center">
            <h2 className="section-heading text-4xl font-semibold tracking-[-0.055em] md:text-6xl">
              <span className="text-gradient-animated">
                {t('landing.pricing.title')}
              </span>
            </h2>
            <p className="section-heading mt-4 font-extralight tracking-wide text-white/45">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
          <div className="grid items-start gap-6 md:grid-cols-3">
            <PriceCard
              name={t('landing.pricing.starter')}
              price="$49"
              per={t('landing.pricing.perMonth')}
              features={[
                t('landing.pricing.starter.f1'),
                t('landing.pricing.starter.f2'),
                t('landing.pricing.starter.f3'),
              ]}
              cta={t('landing.pricing.starter.cta')}
              onClick={goStart}
            />
            <PriceCard
              highlighted
              badge={t('landing.pricing.popular')}
              name={t('landing.pricing.pro')}
              price="$149"
              per={t('landing.pricing.perMonth')}
              features={[
                t('landing.pricing.pro.f1'),
                t('landing.pricing.pro.f2'),
                t('landing.pricing.pro.f3'),
                t('landing.pricing.pro.f4'),
              ]}
              cta={t('landing.pricing.pro.cta')}
              onClick={goStart}
            />
            <PriceCard
              name={t('landing.pricing.enterprise')}
              price={t('landing.pricing.enterprise.price')}
              features={[
                t('landing.pricing.enterprise.f1'),
                t('landing.pricing.enterprise.f2'),
                t('landing.pricing.enterprise.f3'),
              ]}
              cta={t('landing.pricing.enterprise.cta')}
              onClick={goSignIn}
            />
          </div>
        </section>

        {/* Gradient divider */}
        <div className="section-divider" />

        {/* ── Final CTA ─────────────────────────────────────── */}
        <section ref={ctaRef} className={cn(MAX, 'py-32')}>
          <MagneticCard>
            <div className="cta-box bento-card relative overflow-hidden rounded-[2rem] p-12 text-center md:p-24">
              <div className="noise-overlay" />
              {/* Aurora inside CTA */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,107,255,0.18),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.10),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(34,211,238,0.08),transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] md:text-6xl">
                <span className="text-gradient-animated">
                  {t('landing.cta.title')}
                </span>
              </h2>
              <p className="mx-auto mt-8 max-w-xl text-lg font-extralight tracking-wide text-white/50">
                {t('landing.cta.desc')}
              </p>
              <div className="mt-14 flex flex-col justify-center gap-4 sm:flex-row">
                <LiquidButton onClick={goStart} large>
                  {t('landing.cta.primary')}
                  <ArrowRight className="ml-2 inline h-4 w-4" />
                </LiquidButton>
                <button
                  onClick={goSignIn}
                  className="rounded-full border border-white/[0.08] px-12 py-4 font-light tracking-wide backdrop-blur-sm transition-all duration-400 hover:border-white/20 hover:bg-white/[0.04] hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                >
                  {t('landing.cta.secondary')}
                </button>
              </div>
            </div>
            </div>
          </MagneticCard>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer ref={footerRef} className="relative border-t border-white/[0.04] py-20">
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-80" />
        <div className={cn(MAX, 'relative z-10')}>
          <div className="mb-16 grid grid-cols-2 gap-10 md:grid-cols-6">
            <div className="footer-col col-span-2">
              <Logo size={30} />
              <p className="mt-6 max-w-xs text-sm font-extralight leading-relaxed tracking-wide text-white/40">
                {t('landing.footer.tagline')}
              </p>
              <div className="mt-8 flex gap-4">
                {[Globe, AtSign].map((Icon, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={i === 0 ? 'Website' : 'Email'}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:border-white/15 hover:bg-white/[0.04] hover:scale-110 active:scale-95 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-white/50" />
                  </button>
                ))}
              </div>
            </div>
            <div className="footer-col">
              <FooterCol
                title={t('landing.footer.product')}
                links={[
                  t('landing.nav.platform'),
                  t('landing.nav.aiFeatures'),
                  t('landing.nav.pricing'),
                ]}
              />
            </div>
            <div className="footer-col">
              <FooterCol
                title={t('landing.footer.resources')}
                links={['Docs', 'API', 'Help']}
              />
            </div>
            <div className="footer-col">
              <FooterCol
                title={t('landing.footer.company')}
                links={['About', 'Careers', 'Privacy']}
              />
            </div>
            <div className="footer-col">
              <h5 className="mb-6 text-sm font-medium tracking-wide text-white/80">
                {t('landing.footer.language')}
              </h5>
              <div className="flex flex-col gap-2">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={cn(
                      'text-left text-sm font-light tracking-wide transition-all duration-300 cursor-pointer',
                      language === l.code
                        ? 'text-brand-300'
                        : 'text-white/40 hover:text-white/70'
                    )}
                  >
                    {l.label} ({l.short})
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.04] pt-8 text-center text-sm font-extralight tracking-wide text-white/30">
            {t('landing.footer.rights')}
          </div>
        </div>
      </footer>
    </div>
  );
}
