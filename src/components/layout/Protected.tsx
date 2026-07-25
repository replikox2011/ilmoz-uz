import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Logo } from "../ui/Logo";
import { useI18n } from "../../i18n/I18nContext";

export function Protected({ children }: { children: React.ReactNode }) {
  const { fbUser, user, loading, needsCenterSetup, activeSubdomain } = useAuth();

  if (loading) return <BootScreen />;

  // Not signed in at all → landing page (on main domain) or login page (on subdomain)
  if (!fbUser) {
    if (activeSubdomain) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/landing" replace />;
  }

  // Signed in via Google/Phone but hasn't created a center yet → onboarding
  if (needsCenterSetup) return <Navigate to="/setup" replace />;

  // Firestore profile still resolving (rare flash)
  if (!user) return <BootScreen />;

  return <>{children}</>;
}

export function BootScreen() {
  const { t } = useI18n();
  const { activeSubdomain } = useAuth();

  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex flex-col items-center gap-6">
        <div className="animate-pulse-glow">
          <Logo size={48} showText={false} />
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-shimmer rounded-full brand-gradient" />
        </div>
        <p className="text-sm text-white/40">
          {activeSubdomain ? t("boot.loading") : t("boot.loadingNormal")}
        </p>
      </div>
    </div>
  );
}
