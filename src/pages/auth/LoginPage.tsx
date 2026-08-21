import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtSign, Lock, ExternalLink } from "lucide-react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../i18n/I18nContext";
import { firestoreRepository } from "../../data/firestoreRepository";
import { Center } from "../../types";
import { buildRootUrl } from "../../lib/subdomain";
import { Turnstile } from "../../components/ui/Turnstile";
export function LoginPage() {
  const { signInWithGoogle, signInWithLogin, activeSubdomain, subdomainCenterId } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [centerBrand, setCenterBrand] = React.useState<Center | null>(null);
  const [captchaToken, setCaptchaToken] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!subdomainCenterId) return;
    firestoreRepository.getCenter(subdomainCenterId).then(c => setCenterBrand(c));
  }, [subdomainCenterId]);
  const [login, setLogin] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailLoading, setEmailLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError("Iltimos, Turnstile tekshiruvidan o'ting.");
      return;
    }
    setError(null);
    setEmailLoading(true);
    try {
      await signInWithLogin(login.trim(), password);
      navigate("/");
    } catch (err: any) {
      const code: string = err?.code ?? "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setError(t("auth.login.errorNotFound"));
      } else if (code === "auth/wrong-password") {
        setError(t("auth.login.errorWrongPassword"));
      } else if (code === "auth/too-many-requests") {
        setError(t("auth.login.errorTooManyRequests"));
      } else {
        setError(err?.message ?? t("auth.login.errorDefault"));
      }
    } finally {
      setEmailLoading(false);
    }
  };
  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(err?.message ?? t("auth.login.errorGoogle"));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <AuthLayout centerBrand={activeSubdomain ? centerBrand : null}>
      {/* Show center name on mobile (subdomain) */}
      {centerBrand && (
        <p className="mb-2 text-xs font-medium text-brand-300">{centerBrand.name}</p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-white">{t("auth.login.heading")}</h2>
      <p className="mt-1 text-sm text-white/45">{t("auth.login.subheading")}</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/25">
          {error}
        </div>
      )}

      {/* ── Login (email / username / phone) + Password ── */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label={t("auth.login.fieldEmail")}>
          <div className="relative">
            <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <Input
              type="text"
              required
              placeholder="you@center.com"
              className="pl-10"
              value={login}
              onChange={e => setLogin(e.target.value)}
            />
          </div>
        </Field>
        <Field label={t("auth.login.fieldPassword")}>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <Input
              type={showPwd ? "text" : "password"}
              required
              placeholder="••••••••"
              className="pl-10 pr-10"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-2.5 text-xs text-white/30 transition hover:text-white/60"
            >
              {showPwd ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
            </button>
          </div>
        </Field>
        <Turnstile onVerify={setCaptchaToken} />
        <Button type="submit" className="w-full" loading={emailLoading} disabled={!captchaToken}>
          {t("auth.login.submit")}
        </Button>
      </form>

      {/* ── Divider ── */}
      <div className="my-6 flex items-center gap-3 text-xs text-white/30">
        <div className="h-px flex-1 bg-white/10" />
        {t("auth.login.orContinueWith")}
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* ── Social buttons ── */}
      <div className="flex flex-col gap-2">
        <Button
          variant="glass"
          type="button"
          loading={googleLoading}
          onClick={handleGoogle}
          className="w-full"
        >
          <GoogleGlyph /> {t("auth.login.google")}
        </Button>
        <p className="text-center text-[11px] text-white/35">
          Egalari, o'qituvchilar, o'quvchilar va ota-onalar uchun Google bilan 1-klikda kirish
        </p>
      </div>

      {/* Hide "Create account" on subdomain — registration not available there */}
      {!activeSubdomain && (
        <p className="mt-8 text-center text-sm text-white/45">
          {t("auth.login.newToIlmoz")}{" "}
          <Link to="/register" className="font-medium text-brand-300 hover:text-brand-200">
            {t("auth.login.createCenter")}
          </Link>
        </p>
      )}

      {/* On subdomain — link to the main platform site */}
      {activeSubdomain && (
        <div className="mt-8 flex justify-center">
          <a
            href={buildRootUrl()}
            className="inline-flex items-center gap-1.5 text-xs text-white/30 transition hover:text-white/55"
          >
            <ExternalLink className="h-3 w-3" />
            Перейти на главный сайт Ilmoz
          </a>
        </div>
      )}
    </AuthLayout>
  );
}

function GoogleGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.9 2.5 2.8 6.6 2.8 12S6.9 21.5 12 21.5c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z"
      />
    </svg>
  );
}
