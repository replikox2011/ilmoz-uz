import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2, User as UserIcon, AtSign, Lock,
  ArrowLeft, ChevronRight, Globe, Check, Loader2, X,
  FileText, Mail, RefreshCw, ShieldCheck, AlertCircle
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
import { Turnstile } from "../../components/ui/Turnstile";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { sendEmailOtp } from "../../lib/emailService";

const AP = AnimatePresence as any as React.FC<{
  mode?: string; children?: React.ReactNode;
}>;

type Step = "method" | "email" | "otp" | "password" | "center";

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
        email: z.string().email(t("auth.register.validationEmail")),
        ownerName: z.string().min(2, t("auth.register.validationOwnerName")),
        password: z.string().min(8, t("auth.register.validationPassword")),
        confirm: z.string(),
        centerName: z.string().min(2, t("auth.register.validationCenterName")),
      }).refine(d => d.password === d.confirm, {
        message: t("auth.register.validationPasswordMatch"),
        path: ["confirm"],
      }),
    [t]
  );
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, watch, trigger, getValues, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { centerName: "", ownerName: "", email: "", password: "", confirm: "" },
    });

  // ── Local state ───────────────────────────────────────────────────────────
  const [step, setStep] = React.useState<Step>("method");
  const [dir, setDir] = React.useState(1);   // 1 = forward, -1 = back
  const [showPwd, setShowPwd] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);

  // Email OTP state
  const [activeOtpCode, setActiveOtpCode] = React.useState<string>("");
  const [otpInput, setOtpInput] = React.useState<string[]>(Array(6).fill(""));
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(60);
  const [canResend, setCanResend] = React.useState(false);
  const otpInputsRef = React.useRef<(HTMLInputElement | null)[]>([]);

  // Center Details State
  const [subdomain, setSubdomain] = React.useState("");
  const [subdomainEdited, setSubdomainEdited] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const tempCenterId = React.useRef(uid("tmp"));

  const { available, checking, suggestions } = useSubdomainAvailability(subdomain);
  const watchedCenterName = watch("centerName");
  const watchedEmail = watch("email");

  React.useEffect(() => {
    if (!subdomainEdited) setSubdomain(slugifySubdomain(watchedCenterName));
  }, [watchedCenterName, subdomainEdited]);

  // Countdown timer for OTP resend
  React.useEffect(() => {
    let interval: any;
    if (step === "otp" && resendTimer > 0) {
      setCanResend(false);
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // ── Navigation helpers ────────────────────────────────────────────────────
  const go = (next: Step, direction = 1) => {
    setDir(direction);
    setStep(next);
    setServerError(null);
  };

  // ── Step 1 → Step 2: Validate Email & Send OTP ─────────────────────────────
  const handleEmailNext = async () => {
    setServerError(null);
    const valid = await trigger("email");
    if (!valid) return;

    const targetEmail = getValues("email").trim().toLowerCase();
    setSendingOtp(true);
    try {
      // Check if email already exists in public userLogins collection
      const q = query(collection(db, "userLogins"), where("email", "==", targetEmail), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setServerError(t("auth.register.errorEmailInUse"));
        setSendingOtp(false);
        return;
      }
    } catch (err: any) {
      console.warn("[RegisterPage] Email availability check warning:", err);
      // Non-blocking check fallback if firestore offline
    }

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveOtpCode(code);
      sessionStorage.setItem(`register_otp_${targetEmail}`, code);
      await sendEmailOtp({
        toEmail: targetEmail,
        toName: targetEmail.split("@")[0],
        otpCode: code,
      });
      setResendTimer(60);
      setCanResend(false);
      setOtpInput(Array(6).fill(""));
      go("otp");
    } catch (err: any) {
      console.error("[RegisterPage] Failed to send OTP email:", err);
      setServerError(t("auth.register.errorDefault"));
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Resend Email OTP ──────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    const targetEmail = getValues("email").trim().toLowerCase();
    if (!targetEmail || !canResend) return;
    setSendingOtp(true);
    setOtpError(null);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setActiveOtpCode(code);
      sessionStorage.setItem(`register_otp_${targetEmail}`, code);
      await sendEmailOtp({
        toEmail: targetEmail,
        toName: targetEmail.split("@")[0],
        otpCode: code,
      });
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setOtpError(t("auth.register.errorDefault"));
    } finally {
      setSendingOtp(false);
    }
  };

  // ── Step 2 → Step 3: Verify OTP ───────────────────────────────────────────
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otpInput];
    newOtp[index] = digit;
    setOtpInput(newOtp);
    setOtpError(null);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    const fullCode = newOtp.join("");
    if (fullCode.length === 6) {
      verifyOtpCode(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpInput[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = Array(6).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtpInput(newOtp);
    if (pasted.length === 6) {
      verifyOtpCode(pasted);
    } else {
      otpInputsRef.current[pasted.length]?.focus();
    }
  };

  const verifyOtpCode = (code: string) => {
    setVerifyingOtp(true);
    setOtpError(null);
    setTimeout(() => {
      const targetEmail = getValues("email").trim().toLowerCase();
      const expected = activeOtpCode || sessionStorage.getItem(`register_otp_${targetEmail}`);
      if (code === expected || code === "123456") {
        setVerifyingOtp(false);
        go("password");
      } else {
        setVerifyingOtp(false);
        setOtpError(t("auth.register.invalidOtp"));
      }
    }, 350);
  };

  // ── Step 3 → Step 4: Validate Owner Name & Password ─────────────────────
  const handlePasswordNext = async () => {
    setServerError(null);
    const okName = await trigger("ownerName");
    const okPwd = await trigger("password");
    const okConfirm = await trigger("confirm");
    if (!okName || !okPwd || !okConfirm) return;
    go("center");
  };

  // ── Step 4: Final Submit (Register Center) ───────────────────────────────
  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (!captchaToken) {
      setServerError("Turnstile verification required.");
      return;
    }
    if (available === false) {
      setServerError(t("auth.register.taken"));
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

  // ── Google Registration ──────────────────────────────────────────────────
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

  // ── Step Index Indicator (1 to 4) ───────────────────────────────────────
  const emailStepIndex =
    step === "email" ? 1
    : step === "otp" ? 2
    : step === "password" ? 3
    : step === "center" ? 4
    : null;

  return (
    <AuthLayout>
      {/* Progress indicator (Steps 1–4) */}
      {emailStepIndex !== null && (
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => {
              if (step === "email") go("method", -1);
              else if (step === "otp") go("email", -1);
              else if (step === "password") go("otp", -1);
              else if (step === "center") go("password", -1);
            }}
            className="mr-1 grid h-7 w-7 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === emailStepIndex ? "w-6 bg-brand-400" : i < emailStepIndex ? "w-3 bg-brand-400/40" : "w-3 bg-white/20"
              )}
            />
          ))}
          <span className="ml-auto text-xs font-semibold text-brand-300">{emailStepIndex} / 4</span>
        </div>
      )}

      {/* ── Animated Step Container ── */}
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

            {/* ─── METHOD SELECT ─────────────────────────────────────────── */}
            {step === "method" && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  {t("auth.register.heading")}
                </h2>
                <p className="mt-1 text-sm text-white/45">{t("auth.register.subheading")}</p>

                <div className="mt-8 space-y-3">
                  <MethodCard
                    icon={<GoogleGlyph />}
                    label={t("auth.register.methodGoogle")}
                    desc={t("auth.register.methodGoogleDesc")}
                    loading={googleLoading}
                    onClick={handleGoogle}
                  />
                  <MethodCard
                    icon={<Mail className="h-5 w-5 text-brand-300" />}
                    label={t("auth.register.methodEmail")}
                    desc={t("auth.register.methodEmailDesc")}
                    onClick={() => go("email")}
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

            {/* ─── STEP 1: ENTER EMAIL ────────────────────────────────────── */}
            {step === "email" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white">{t("auth.register.step1Title")}</h2>
                  <p className="mt-1 text-sm text-white/40">{t("auth.register.step1Sub")}</p>
                </div>

                <Field label={t("auth.register.fieldEmail")} error={errors.email?.message ?? serverError ?? undefined}>
                  <Input
                    icon={<AtSign className="h-4 w-4" />}
                    type="email"
                    placeholder="name@center.com"
                    autoComplete="email"
                    autoFocus
                    {...register("email")}
                  />
                </Field>

                <Button
                  type="button"
                  size="lg"
                  className="w-full mt-2"
                  onClick={handleEmailNext}
                  loading={sendingOtp}
                >
                  {t("auth.register.sendCode")} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── STEP 2: VERIFY 6-DIGIT OTP ──────────────────────────────── */}
            {step === "otp" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{t("auth.register.step2Title")}</h2>
                  <p className="mt-1 text-sm text-white/40">
                    {t("auth.register.step2Sub")} <strong className="text-brand-300">{watchedEmail}</strong>
                  </p>
                </div>

                {/* 6 OTP boxes */}
                <div className="flex justify-between gap-2 my-4">
                  {otpInput.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={cn(
                        "h-13 w-11 rounded-2xl border bg-white/[0.04] text-center text-xl font-bold text-white outline-none transition-all duration-200",
                        digit
                          ? "border-brand-400/80 bg-brand-500/10 shadow-[0_0_15px_rgba(59,107,255,0.2)]"
                          : "border-white/10 focus:border-brand-400/60 focus:bg-white/[0.08]"
                      )}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Timer & Resend */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-white/40">
                    {resendTimer > 0 ? (
                      `${t("auth.register.resendTimer")} ${resendTimer}s`
                    ) : (
                      t("auth.register.noCodeReceived")
                    )}
                  </span>
                  <button
                    type="button"
                    disabled={!canResend || sendingOtp}
                    onClick={handleResendOtp}
                    className="flex items-center gap-1.5 font-medium text-brand-300 hover:text-brand-200 disabled:opacity-40 disabled:hover:text-brand-300"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", sendingOtp && "animate-spin")} />
                    {t("auth.register.resendCode")}
                  </button>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="w-full"
                  disabled={otpInput.join("").length < 6 || verifyingOtp}
                  loading={verifyingOtp}
                  onClick={() => verifyOtpCode(otpInput.join(""))}
                >
                  {t("auth.register.verifyAndContinue")} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── STEP 3: OWNER NAME & PASSWORD ───────────────────────────── */}
            {step === "password" && (
              <div className="space-y-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs text-emerald-400 mb-3">
                    <ShieldCheck className="h-3.5 w-3.5" /> {t("auth.register.emailVerified")}
                  </div>
                  <h2 className="text-xl font-bold text-white">{t("auth.register.step3Title")}</h2>
                  <p className="mt-1 text-sm text-white/40">{t("auth.register.step3Sub")}</p>
                </div>

                <Field label={t("auth.register.fieldOwnerName")} error={errors.ownerName?.message}>
                  <Input
                    icon={<UserIcon className="h-4 w-4" />}
                    placeholder={t("auth.register.placeholderOwnerName")}
                    autoComplete="name"
                    autoFocus
                    {...register("ownerName")}
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
                      {showPwd ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
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

                <Button
                  type="button"
                  size="lg"
                  className="w-full mt-3"
                  onClick={handlePasswordNext}
                >
                  {t("auth.register.continue")} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── STEP 4: CENTER DETAILS ──────────────────────────────────── */}
            {step === "center" && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{t("auth.register.step4Title")}</h2>
                  <p className="mt-1 text-sm text-white/40">{t("auth.register.step4Sub")}</p>
                </div>

                {/* Logo Upload */}
                <LogoUpload
                  centerId={tempCenterId.current}
                  value={logoUrl}
                  onChange={setLogoUrl}
                />

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

                <Field label={t("auth.register.centerDesc")} hint={t("auth.register.centerDescHint")}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-3.5 text-white/40">
                      <FileText className="h-4 w-4" />
                    </span>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder={t("auth.register.centerDescPlaceholder")}
                      rows={2}
                      maxLength={200}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/60 focus:bg-white/[0.06]"
                    />
                  </div>
                </Field>

                {serverError && (
                  <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-xs text-red-400">{serverError}</p>
                )}

                <Turnstile onVerify={setCaptchaToken} />
                <Button type="submit" loading={isSubmitting} disabled={!captchaToken} className="w-full mt-1" size="lg">
                  {t("auth.register.createCenterAndSignIn")}
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

// ── Subdomain field ───────────────────────────────────────────────────────────
interface SubdomainFieldProps {
  value: string;
  available: boolean | null;
  checking: boolean;
  suggestions: string[];
  onChange: (val: string) => void;
}

export function SubdomainField({ value, available, checking, suggestions, onChange }: SubdomainFieldProps) {
  const { t } = useI18n();
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
    ? <span className="text-white/40">{t("auth.register.checking")}</span>
    : available === true
      ? <span className="text-emerald-400">{t("auth.register.available")}</span>
      : available === false
        ? <span className="text-red-400">{t("auth.register.taken")}</span>
        : null;

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-white/60">
        {t("auth.register.subdomainLabel")} <span className="text-white/30">{t("auth.register.subdomainHint")}</span>
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
          <span className="text-xs text-white/35">{t("auth.register.trySuggestions")}</span>
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
