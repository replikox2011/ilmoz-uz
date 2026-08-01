import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2, User as UserIcon, AtSign, Lock,
  ArrowLeft, ChevronRight, Globe, Check, Loader2, X,
  FileText, Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../i18n/I18nContext";
import { slugifySubdomain } from "../../lib/subdomain";
import { useSubdomainAvailability } from "../../hooks/useSubdomainAvailability";
import { LogoUpload } from "../../components/ui/LogoUpload";
import { uid, cn } from "../../lib/utils";

// Framer v11 shim
const AP = AnimatePresence as any as React.FC<{
  mode?: string; children?: React.ReactNode;
}>;

// ── Steps ─────────────────────────────────────────────────────────────────────
type Step = "method" | "center" | "account";

// slide direction for animations
const SLIDE = {
  enter: (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: -dir * 40, opacity: 0 }),
};
const TRANSITION = { type: "spring" as const, stiffness: 380, damping: 30 };

// =============================================================================
export function RegisterPage() {
  const { registerWithEmail, signInWithGoogle, activeSubdomain } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (activeSubdomain) navigate("/login", { replace: true });
  }, [activeSubdomain, navigate]);

  // ── Schema ────────────────────────────────────────────────────────────────
  const schema = React.useMemo(
    () =>
      z.object({
        centerName: z.string().min(2, t("auth.register.validationCenterName")),
        ownerName:  z.string().min(2, t("auth.register.validationOwnerName")),
        email:      z.string().email(t("auth.register.validationEmail")),
        password:   z.string().min(8, t("auth.register.validationPassword")),
        confirm:    z.string(),
      }).refine(d => d.password === d.confirm, {
        message: t("auth.register.validationPasswordMatch"),
        path: ["confirm"],
      }),
    [t]
  );
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, watch, trigger, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { centerName: "", ownerName: "", email: "", password: "", confirm: "" },
    });

  // ── Local state ───────────────────────────────────────────────────────────
  const [step, setStep]           = React.useState<Step>("method");
  const [dir, setDir]             = React.useState(1);   // 1 = forward, -1 = back
  const [showPwd, setShowPwd]     = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const [subdomain, setSubdomain]         = React.useState("");
  const [subdomainEdited, setSubdomainEdited] = React.useState(false);
  const [description, setDescription]    = React.useState("");
  const [logoUrl, setLogoUrl]             = React.useState("");
  const tempCenterId = React.useRef(uid("tmp"));

  const { available, checking, suggestions } = useSubdomainAvailability(subdomain);
  const watchedCenterName = watch("centerName");

  React.useEffect(() => {
    if (!subdomainEdited) setSubdomain(slugifySubdomain(watchedCenterName));
  }, [watchedCenterName, subdomainEdited]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const go = (next: Step, direction = 1) => {
    setDir(direction);
    setStep(next);
    setServerError(null);
  };

  // ── Step 1 → Step 2: validate center name ─────────────────────────────────
  const handleCenterNext = async () => {
    const ok = await trigger("centerName");
    if (!ok) return;
    if (available === false) {
      setServerError("That subdomain is already taken. Please choose another.");
      return;
    }
    go("account");
  };

  // ── Final submit ──────────────────────────
  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (available === false) {
      setServerError("That subdomain is already taken. Please choose another.");
      return;
    }
    
    try {
      await registerWithEmail(
        values.centerName, values.ownerName,
        values.email, values.password,
        subdomain || undefined, description || undefined, logoUrl || undefined,
      );
      navigate("/onboarding/customize");
    } catch (err: any) {
      const code: string = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setServerError(t("auth.register.errorEmailInUse"));
      } else {
        setServerError(err?.message ?? t("auth.register.errorDefault"));
      }
    }
  };

  // ── Google ────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true);
    setServerError(null);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setServerError(err?.message ?? t("auth.register.errorGoogle"));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Progress indicator (shown on steps 2-3 of the email flow) ─────────────
  const emailStepIndex = step === "center" ? 1 : step === "account" ? 2 : null;

  return (
    <AuthLayout>
      {/* Step progress dots (email flow steps 1–2) */}
      {emailStepIndex !== null && (
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => go(emailStepIndex === 2 ? "center" : "method", -1)}
            className="mr-1 grid h-7 w-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {[1, 2].map(i => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === emailStepIndex ? "w-6 bg-brand-400" : "w-4 bg-white/20"
              )}
            />
          ))}
          <span className="ml-auto text-xs text-white/30">{emailStepIndex} / 2</span>
        </div>
      )}

      {/* ── Animated step container ── */}
      <div className="overflow-hidden">
        <AP mode="wait">
          <motion.div
            key={step}
            custom={dir}
            variants={SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
          >

            {/* ─── METHOD STEP ─────────────────────────────────────────────── */}
            {step === "method" && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {t("auth.register.heading")}
                </h2>
                <p className="mt-1 text-sm text-white/45">{t("auth.register.subheading")}</p>

                <div className="mt-8 space-y-3">
                  {/* Google */}
                  <MethodCard
                    icon={<GoogleGlyph />}
                    label={t("auth.register.methodGoogle")}
                    desc="Быстрый вход через Google аккаунт"
                    loading={googleLoading}
                    onClick={handleGoogle}
                  />
                  {/* Email */}
                  <MethodCard
                    icon={<Mail className="h-5 w-5 text-brand-300" />}
                    label={t("auth.register.methodEmail")}
                    desc="Зарегистрировать новый учебный центр"
                    onClick={() => go("center")}
                  />
                </div>

                {serverError && (
                  <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{serverError}</p>
                )}

                <p className="mt-8 text-center text-sm text-white/45">
                  {t("auth.register.hasAccount")}{" "}
                  <Link to="/login" className="font-medium text-brand-300 hover:text-brand-200">
                    {t("auth.register.signIn")}
                  </Link>
                </p>
              </div>
            )}

            {/* ─── CENTER STEP ─────────────────────────────────────────────── */}
            {step === "center" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white">Ваш учебный центр</h2>
                  <p className="mt-1 text-sm text-white/40">Расскажите немного о вашем центре</p>
                </div>

                <Field label={t("auth.register.fieldCenterName")} error={errors.centerName?.message}>
                  <Input
                    icon={<Building2 className="h-4 w-4" />}
                    placeholder="Ilmoz Academy"
                    autoComplete="organization"
                    autoFocus
                    {...register("centerName")}
                  />
                </Field>

                <SubdomainField
                  value={subdomain}
                  available={available}
                  checking={checking}
                  suggestions={suggestions}
                  onChange={val => { setSubdomain(val); setSubdomainEdited(true); }}
                />

                <Field label="Описание центра" hint="Показывается на вашей странице входа (необязательно)">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-3.5 text-white/40">
                      <FileText className="h-4 w-4" />
                    </span>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Краткое описание вашего центра…"
                      rows={2}
                      maxLength={200}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/60 focus:bg-white/[0.06]"
                    />
                  </div>
                </Field>

                {serverError && (
                  <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{serverError}</p>
                )}

                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  onClick={handleCenterNext}
                  disabled={checking}
                >
                  Продолжить <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* ─── ACCOUNT STEP ────────────────────────────────────────────── */}
            {step === "account" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Ваш аккаунт</h2>
                  <p className="mt-1 text-sm text-white/40">Данные владельца центра</p>
                </div>

                {/* Logo */}
                <LogoUpload
                  centerId={tempCenterId.current}
                  value={logoUrl}
                  onChange={setLogoUrl}
                />

                <Field label={t("auth.register.fieldOwnerName")} error={errors.ownerName?.message}>
                  <Input
                    icon={<UserIcon className="h-4 w-4" />}
                    placeholder={t("auth.register.placeholderOwnerName")}
                    autoComplete="name"
                    autoFocus
                    {...register("ownerName")}
                  />
                </Field>

                <Field label={t("auth.register.fieldEmail")} error={errors.email?.message}>
                  <Input
                    icon={<AtSign className="h-4 w-4" />}
                    type="email"
                    placeholder="you@center.com"
                    autoComplete="email"
                    {...register("email")}
                  />
                </Field>

                <Field label={t("auth.register.fieldPassword")} error={errors.password?.message}>
                  <div className="relative">
                    <Input
                      icon={<Lock className="h-4 w-4" />}
                      type={showPwd ? "text" : "password"}
                      placeholder={t("auth.register.placeholderPassword")}
                      autoComplete="new-password"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35 transition hover:text-white/70"
                    >
                      {showPwd ? t("common.hide") : t("common.show")}
                    </button>
                  </div>
                </Field>

                <Field
                  label={t("auth.register.fieldConfirm")}
                  error={errors.confirm?.message ?? serverError ?? undefined}
                >
                  <Input
                    icon={<Lock className="h-4 w-4" />}
                    type={showPwd ? "text" : "password"}
                    placeholder={t("auth.register.placeholderConfirm")}
                    autoComplete="new-password"
                    {...register("confirm")}
                  />
                </Field>

                <Button type="submit" loading={isSubmitting} className="w-full mt-1" size="lg">
                  {t("auth.register.submitEmail")}
                </Button>
                <p className="text-center text-xs text-white/30">{t("auth.register.terms")}</p>
              </form>
            )}

          </motion.div>
        </AP>
      </div>
    </AuthLayout>
  );
}

// ── Method card ───────────────────────────────────────────────────────────────
function MethodCard({
  icon, label, desc, loading, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-left transition hover:border-white/20 hover:bg-white/[0.06] active:scale-[0.99] disabled:opacity-60"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-white/50" /> : icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-white/25" />
    </button>
  );
}

// ── Subdomain field (also used in SetupCenterPage) ────────────────────────────
interface SubdomainFieldProps {
  value: string;
  available: boolean | null;
  checking: boolean;
  suggestions: string[];
  onChange: (val: string) => void;
}

export function SubdomainField({ value, available, checking, suggestions, onChange }: SubdomainFieldProps) {
  const suffix = window.location.hostname.includes("localhost")
    ? `.localhost:${window.location.port}`
    : ".ilmoz.uz";

  const statusIcon = checking
    ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
    : available === true
      ? <Check className="h-3.5 w-3.5 text-emerald-400" />
      : available === false
        ? <X className="h-3.5 w-3.5 text-red-400" />
        : null;

  const statusText = checking
    ? <span className="text-white/40">Checking…</span>
    : available === true
      ? <span className="text-emerald-400">Available</span>
      : available === false
        ? <span className="text-red-400">Already taken</span>
        : null;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/60">
        Subdomain <span className="text-white/30">(your workspace URL)</span>
      </label>
      <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] transition-all focus-within:border-brand-400/60 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-brand-500/15">
        <span className="pointer-events-none pl-4 text-white/35">
          <Globe className="h-4 w-4" />
        </span>
        <input
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^a-z0-9-]/g, "").slice(0, 40))}
          placeholder="my-center"
          className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/35 outline-none"
        />
        <span className="shrink-0 pr-4 text-xs text-white/35">{suffix}</span>
      </div>
      {value.length >= 2 && (
        <div className="flex items-center gap-1.5">
          {statusIcon}
          <span className="text-xs">{statusText}</span>
        </div>
      )}
      {available === false && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span className="text-xs text-white/35">Try:</span>
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/70 transition hover:border-brand-400/40 hover:bg-white/[0.08] hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Google glyph ──────────────────────────────────────────────────────────────
function GoogleGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 12S6.9 21.5 12 21.5c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z" />
    </svg>
  );
}

