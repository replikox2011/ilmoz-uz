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

// ==========================================================================
export function LoginPage() {
  const { signInWithGoogle, signInWithApple, signInWithLogin, activeSubdomain, subdomainCenterId } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  // ── Load center branding if on subdomain ─────────────────────────────────
  const [centerBrand, setCenterBrand] = React.useState<Center | null>(null);
  React.useEffect(() => {
    if (!subdomainCenterId) return;
    firestoreRepository.getCenter(subdomainCenterId).then(c => setCenterBrand(c));
  }, [subdomainCenterId]);

  // email/username/phone + password flow
  const [login, setLogin]     = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);
  const [emailLoading, setEmailLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [appleLoading, setAppleLoading]   = React.useState(false);

  // ── email / username / phone + password ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  // ── google sign-in ───────────────────────────────────────────────────────
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

  // ── apple sign-in ────────────────────────────────────────────────────────
  const handleApple = async () => {
    setAppleLoading(true);
    setError(null);
    try {
      await signInWithApple();
      navigate("/");
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setError(err?.message ?? t("auth.login.errorApple"));
      }
    } finally {
      setAppleLoading(false);
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

      {/* ── Login (email / username / phone) + Password ── */}
      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Field label="Email, username or phone">
          <Input
            icon={<AtSign className="h-4 w-4" />}
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="you@center.com"
            autoComplete="username"
            required
          />
        </Field>
        <Field label={t("auth.login.fieldPassword")} error={error ?? undefined}>
          <div className="relative">
            <Input
              icon={<Lock className="h-4 w-4" />}
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35 hover:text-white/70 transition"
            >
              {showPwd ? t("auth.login.hidePassword") : t("auth.login.showPassword")}
            </button>
          </div>
        </Field>
        <Button type="submit" loading={emailLoading} className="w-full" size="lg">
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
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="glass"
          type="button"
          loading={googleLoading}
          onClick={handleGoogle}
        >
          <GoogleGlyph /> {t("auth.login.google")}
        </Button>
        <Button
          variant="glass"
          type="button"
          loading={appleLoading}
          onClick={handleApple}
        >
          <AppleGlyph /> {t("auth.login.apple")}
        </Button>
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

function AppleGlyph() {
  return (
    <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.29.07 2.18.74 2.93.8 1.11-.21 2.17-.9 3.36-.77 1.43.17 2.51.74 3.21 1.87-2.87 1.74-2.19 5.57.49 6.65-.57 1.5-1.31 3-1.99 4.31zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
