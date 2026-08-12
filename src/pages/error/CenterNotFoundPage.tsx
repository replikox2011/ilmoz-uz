import * as React from "react";
import { Building2, ArrowRight, Home, PlusCircle, HelpCircle, Search, ExternalLink } from "lucide-react";
import { buildRootUrl, buildSubdomainUrl } from "../../lib/subdomain";
import { Logo } from "../../components/ui/Logo";
import { useI18n } from "../../i18n/I18nContext";

interface CenterNotFoundPageProps {
  subdomain: string;
}

export function CenterNotFoundPage({ subdomain }: CenterNotFoundPageProps) {
  const { language } = useI18n();
  const [searchSubdomain, setSearchSubdomain] = React.useState("");

  const content = React.useMemo(() => {
    if (language === "ru") {
      return {
        badge: "404 • ЦЕНТР НЕ НАЙДЕН",
        title: "Учебный центр не найден",
        desc: "Субдомен, на который вы перешли, не зарегистрирован или был удален из системы Ilmoz.",
        searchLabel: "Знаете точный субдомен вашего центра?",
        placeholder: "например: ideal-study",
        goBtn: "Перейти",
        homeBtn: "На главную страницу",
        registerBtn: "Зарегистрировать новый центр",
        supportBtn: "Служба поддержки",
      };
    }
    if (language === "en") {
      return {
        badge: "404 • CENTER NOT FOUND",
        title: "Learning Center Not Found",
        desc: "The subdomain you visited is not registered or may have been deleted from Ilmoz.",
        searchLabel: "Know your center's exact subdomain?",
        placeholder: "e.g. ideal-study",
        goBtn: "Go",
        homeBtn: "Go to Main Page",
        registerBtn: "Register a New Center",
        supportBtn: "Support Service",
      };
    }
    // Uzbek (default)
    return {
      badge: "404 • MARKAZ TOPILMADI",
      title: "O'quv markazi topilmadi",
      desc: "Siz tashrif buyurgan subdomen ro'yxatdan o'tmagan yoki Ilmoz tizimidan o'chirilgan bo'lishi mumkin.",
      searchLabel: "Markazni izlash (subdomen nomini kiriting):",
      placeholder: "masalan: ideal-study",
      goBtn: "O'tish",
      homeBtn: "Bosh sahifaga o'tish",
      registerBtn: "Yangi markaz ochish",
      supportBtn: "Qo'llab-quvvatlash xizmati",
    };
  }, [language]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = searchSubdomain.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "");
    if (!slug) return;
    window.location.href = buildSubdomainUrl(slug) + "/";
  };

  const handleGoHome = () => {
    window.location.href = buildRootUrl() + "/";
  };

  const handleGoRegister = () => {
    window.location.href = buildRootUrl() + "/register";
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060A] text-white flex flex-col items-center justify-center p-4 selection:bg-brand-500/30 selection:text-brand-200 font-sans">
      {/* Background ambient glowing gradients */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-red-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-brand-600/10 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />

      {/* Grid pattern overlay */}
      <div 
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" 
      />

      <main className="relative z-10 flex w-full max-w-lg flex-col items-center">
        {/* Top Logo Header */}
        <div className="mb-8 flex items-center gap-3">
          <Logo size={40} showText={true} />
        </div>

        {/* Main 404 Glass Card */}
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:p-10 shadow-2xl backdrop-blur-2xl text-center flex flex-col items-center">
          
          {/* Animated Glowing Icon Ring */}
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 via-brand-500/10 to-purple-500/20 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Building2 className="h-10 w-10 text-red-400" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
            </span>
          </div>

          {/* Status Badge */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-red-400">
            {content.badge}
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
            {content.title}
          </h1>

          {/* Subdomain Pill */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-black/40 border border-white/10 px-3.5 py-1.5 text-xs sm:text-sm font-mono text-white/70">
            <span className="text-white/40">https://</span>
            <span className="font-bold text-red-400 underline decoration-red-500/50 underline-offset-4">{subdomain}</span>
            <span className="text-white/40">.ilmoz.uz</span>
          </div>

          {/* Description */}
          <p className="text-sm sm:text-base text-white/60 leading-relaxed mb-8 max-w-md">
            {content.desc}
          </p>

          {/* Subdomain Jump Box */}
          <form onSubmit={handleSearchSubmit} className="w-full mb-8 text-left">
            <label className="block text-xs font-medium text-white/50 mb-2">
              {content.searchLabel}
            </label>
            <div className="relative flex items-center">
              <div className="pointer-events-none absolute left-3.5 text-white/40">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchSubdomain}
                onChange={(e) => setSearchSubdomain(e.target.value)}
                placeholder={content.placeholder}
                className="w-full rounded-xl border border-white/10 bg-black/50 py-2.5 pl-10 pr-24 text-sm text-white placeholder-white/30 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition"
              />
              <button
                type="submit"
                disabled={!searchSubdomain.trim()}
                className="absolute right-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 flex items-center gap-1"
              >
                {content.goBtn}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={handleGoHome}
              className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:shadow-brand-500/40 hover:scale-[1.01] active:scale-[0.99]"
            >
              <Home className="h-4 w-4" />
              <span>{content.homeBtn}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={handleGoRegister}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white active:scale-[0.99]"
            >
              <PlusCircle className="h-4 w-4 text-brand-400" />
              <span>{content.registerBtn}</span>
            </button>
          </div>
        </div>

        {/* Footer Support Link */}
        <div className="mt-8 flex items-center justify-between w-full px-2 text-xs text-white/40">
          <span>© 2026 Ilmoz EOS</span>
          <a
            href="https://t.me/ilmoz_support"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white/80 transition"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{content.supportBtn}</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>
      </main>
    </div>
  );
}
