import * as React from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { Phone, ShieldCheck, ArrowLeft, ChevronRight } from "lucide-react";
import { auth } from "../../lib/firebase";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
let recaptchaVerifier: RecaptchaVerifier | null = null;
function getRecaptcha(): RecaptchaVerifier {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-verify", {
      size: "invisible",
    });
  }
  return recaptchaVerifier;
}
type Step = "send" | "otp";
export function VerifyPhonePage() {
  const { user, markPhoneVerified, logout } = useAuth();
  const [step, setStep] = React.useState<Step>("send");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<ConfirmationResult | null>(null);
  const [sent, setSent] = React.useState(false);

  const phone = user?.phone ?? "";

  const handleSend = async () => {
    if (!phone) return;
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, phone, getRecaptcha());
      setConfirmation(result);
      setStep("otp");
      setSent(true);
    } catch (err: any) {
      recaptchaVerifier = null;
      const code: string = err?.code ?? "";
      if (code === "auth/invalid-phone-number") {
        setError("Некорректный номер телефона. Обратитесь к администратору центра.");
      } else if (code === "auth/too-many-requests") {
        setError("Слишком много попыток. Подождите несколько минут.");
      } else {
        setError(err?.message ?? "Не удалось отправить код.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!confirmation || otp.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      await confirmation.confirm(otp.trim());
      await markPhoneVerified();
      // AuthContext now sets needsPhoneVerification = false → redirect happens in App.tsx
    } catch (err: any) {
      const code: string = err?.code ?? "";
      if (code === "auth/invalid-verification-code") {
        setError("Неверный код. Проверьте SMS и попробуйте снова.");
      } else {
        setError(err?.message ?? "Ошибка подтверждения.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div id="recaptcha-verify" />

      {/* Icon */}
      <div className="mb-6 flex justify-center">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-500/15 ring-1 ring-brand-400/25">
          <ShieldCheck className="h-8 w-8 text-brand-300" />
        </div>
      </div>

      {step === "send" && (
        <>
          <h2 className="text-2xl font-bold tracking-tight text-white text-center">
            Подтвердите телефон
          </h2>
          <p className="mt-2 text-sm text-white/45 text-center">
            Для завершения входа нужно подтвердить ваш номер телефона.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <p className="text-xs text-white/40">Номер телефона</p>
            <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-white">
              <Phone className="h-4 w-4 text-brand-300" />
              {phone || "Не указан"}
            </p>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}

          {!phone ? (
            <p className="mt-4 text-sm text-red-400 text-center">
              Номер телефона не найден. Обратитесь к администратору центра.
            </p>
          ) : (
            <Button
              className="mt-6 w-full"
              size="lg"
              loading={loading}
              onClick={handleSend}
            >
              Отправить SMS-код <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </>
      )}

      {step === "otp" && (
        <>
          <button
            onClick={() => { setStep("send"); setOtp(""); setError(null); }}
            className="mb-5 flex items-center gap-1 text-sm text-white/50 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" /> Назад
          </button>

          <h2 className="text-2xl font-bold tracking-tight text-white">
            Введите код
          </h2>
          <p className="mt-1 text-sm text-white/45">
            6-значный SMS-код отправлен на{" "}
            <span className="text-white/70">{phone}</span>
          </p>

          <div className="mt-7 space-y-4">
            <Field label="Код из SMS" error={error ?? undefined}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                autoComplete="one-time-code"
                autoFocus
                className="h-14 w-full rounded-3xl border border-white/10 bg-white/[0.04] px-5 text-center text-3xl font-bold tracking-[0.5em] text-white placeholder:text-white/20 outline-none transition focus:border-brand-400/50 focus:bg-white/[0.07]"
              />
            </Field>

            <Button
              className="w-full"
              size="lg"
              loading={loading}
              disabled={otp.length !== 6}
              onClick={handleVerify}
            >
              Подтвердить и войти
            </Button>
          </div>

          {sent && (
            <button
              onClick={() => { setStep("send"); setOtp(""); setError(null); setSent(false); }}
              className="mt-4 w-full text-center text-sm text-white/40 hover:text-white/70 transition"
            >
              Отправить код повторно
            </button>
          )}
        </>
      )}

      {/* Logout link */}
      <button
        onClick={logout}
        className="mt-8 w-full text-center text-xs text-white/25 hover:text-white/50 transition"
      >
        Войти под другим аккаунтом
      </button>
    </AuthLayout>
  );
}
