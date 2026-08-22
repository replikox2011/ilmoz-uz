import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../../components/ui/Logo";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { cn } from "../../lib/utils";

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const { user, fbUser, logout, verifyEmailCode, resendEmailCode, needsEmailVerification } = useAuth();

  const targetEmail = fbUser?.email || user?.email || "";
  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);
  const [resendCountdown, setResendCountdown] = React.useState(60);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // 60-second cooldown timer for resending OTP
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Focus first input box on mount
  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Redirect to home if verification is already done or not needed
  React.useEffect(() => {
    if (!needsEmailVerification && user) {
      navigate("/", { replace: true });
    }
  }, [needsEmailVerification, user, navigate]);

  const handleChange = (index: number, value: string) => {
    // Only take the last character typed
    const digit = value.slice(-1);
    if (digit && !/^\d$/.test(digit)) return; // Only numbers allowed

    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);
    setError(null);

    // Auto-advance focus to next input box
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, automatically submit verification
    if (digit && index === 5 && nextDigits.every(d => d !== "")) {
      handleVerify(nextDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return;

    const nextDigits = pasteData.split("");
    setDigits(nextDigits);
    setError(null);
    inputRefs.current[5]?.focus();
    handleVerify(pasteData);
  };

  const handleVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join("");
    if (code.length !== 6) {
      setError("Введите 6-значный код полностью.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const success = await verifyEmailCode(code);
      if (success) {
        navigate("/", { replace: true });
      } else {
        setError("Неверный или просроченный код подтверждения.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setError(err?.message || "Ошибка верификации кода.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await resendEmailCode();
      setResendCountdown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || "Не удалось отправить новый код.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-10 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-brand-500/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />

      <div className="flex w-full max-w-md flex-col items-center gap-6 relative z-10">
        <Logo size={44} />

        <GlassCard className="w-full p-8 text-center space-y-6">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/30">
            <Mail className="h-7 w-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Подтверждение Email</h1>
            <p className="text-sm text-white/50 leading-relaxed">
              Мы отправили 6-значный код подтверждения на ваш Email адрес:
            </p>
            {targetEmail && (
              <span className="inline-block rounded-xl border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-300">
                {targetEmail}
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 text-left animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2.5 my-4">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={el => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={cn(
                  "h-13 w-11 rounded-2xl border bg-white/[0.04] text-center text-xl font-bold text-white outline-none transition-all duration-200",
                  digit
                    ? "border-brand-400/70 bg-brand-500/15 shadow-lg shadow-brand-500/10 text-brand-200"
                    : "border-white/10 focus:border-brand-400 focus:bg-white/[0.08]"
                )}
              />
            ))}
          </div>

          <Button
            onClick={() => handleVerify()}
            loading={submitting}
            className="w-full py-3.5 text-sm font-semibold"
          >
            <ShieldCheck className="h-4 w-4 mr-2" /> Подтвердить код
          </Button>

          {/* Resend Cooldown */}
          <div className="pt-2 flex items-center justify-between text-xs text-white/45 border-t border-white/[0.08]">
            <span>Не получили код?</span>
            {resendCountdown > 0 ? (
              <span className="text-white/30">Повторить через {resendCountdown} сек</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="flex items-center gap-1 font-semibold text-brand-400 hover:text-brand-300 transition disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3 w-3", resending && "animate-spin")} />
                Отправить снова
              </button>
            )}
          </div>

          {/* Back / Logout */}
          <div className="pt-2">
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Сменить аккаунт / Выйти
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
