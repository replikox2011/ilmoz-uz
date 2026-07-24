import * as React from "react";
import { Building2, Mail, Phone, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { LoginPageCustomizer } from "../../components/settings/LoginPageCustomizer";
import { useI18n } from "../../i18n/I18nContext";

/** Only directors and owners may edit center settings (name, currency, logo, login page). */
const CAN_EDIT_CENTER: string[] = ["owner", "director"];

export function SettingsPage() {
  const { user, center, logout, setCenter } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [savingCenter, setSavingCenter] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const canEditCenter = !!user && CAN_EDIT_CENTER.includes(user.role);

  const centerSchema = React.useMemo(
    () =>
      z.object({
        name: z.string().min(2, t("settings.errorNameMin")),
        currency: z.string().min(1),
      }),
    [t]
  );
  type CenterForm = z.infer<typeof centerSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<CenterForm>({
    resolver: zodResolver(centerSchema),
    defaultValues: { name: center?.name ?? "", currency: center?.currency ?? "USD" },
  });

  const onSaveCenter = async (values: CenterForm) => {
    if (!center) return;
    setSavingCenter(true);
    try {
      const updated = await repo.updateCenter(center.id, { name: values.name, currency: values.currency });
      setCenter(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSavingCenter(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user || !center) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />

      {/* Profile card */}
      <GlassCard className="p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">{t("settings.sectionProfile")}</h2>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} color={user.avatarColor} size="lg" />
          <div>
            <p className="text-base font-semibold text-white">{user.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="brand">{t(`role.${user.role}`)}</Badge>
              {user.email && (
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <Mail className="h-3 w-3" /> {user.email}
                </span>
              )}
              {user.phone && (
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <Phone className="h-3 w-3" /> {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Center settings */}
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">{t("settings.sectionCenter")}</h2>
          {!canEditCenter && (
            <Badge variant="neutral">{t("settings.readOnly")}</Badge>
          )}
        </div>
        <form onSubmit={handleSubmit(onSaveCenter)} className="space-y-4">
          <Field label={t("settings.centerName")} error={errors.name?.message}>
            <Input icon={<Building2 className="h-4 w-4" />} placeholder="Ilmoz Academy" disabled={!canEditCenter} {...register("name")} />
          </Field>
          <Field label={t("settings.currency")} error={errors.currency?.message}>
            <select
              {...register("currency")}
              disabled={!canEditCenter}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#090b11] px-4 text-sm text-white outline-none transition focus:border-brand-400/60 focus:bg-white/[0.06] disabled:opacity-50"
            >
              <option value="USD">USD — Dollar</option>
              <option value="UZS">UZS — So'm</option>
              <option value="RUB">RUB — Ruble</option>
              <option value="KZT">KZT — Tenge</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </Field>
          {canEditCenter && (
            <div className="flex items-center justify-between pt-1">
              {saved && <p className="text-sm text-green-400">{t("settings.saved")}</p>}
              <div className="ml-auto">
                <Button type="submit" loading={savingCenter} size="sm">
                  {t("settings.saveChanges")}
                </Button>
              </div>
            </div>
          )}
        </form>

        <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs text-white/35">
            <Shield className="h-3.5 w-3.5" />
            <span>{t("settings.workspaceId")}: <code className="font-mono text-white/50">{center.id}</code></span>
          </div>
        </div>
      </GlassCard>

      {/* Login page customization — directors & owners only (branding = center identity) */}
      {canEditCenter && <LoginPageCustomizer />}

      {/* Danger zone */}
      <GlassCard className="border-red-500/20 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-400/70">{t("settings.sectionDangerZone")}</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">{t("settings.signOut")}</p>
            <p className="text-xs text-white/40">{t("settings.signOutDesc")}</p>
          </div>
          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> {t("settings.signOutBtn")}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
