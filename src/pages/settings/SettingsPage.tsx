import * as React from "react";
import { Building2, Mail, Phone, Shield, LogOut, Trash2 } from "lucide-react";
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
import { Modal } from "../../components/ui/Modal";
import { LoginPageCustomizer } from "../../components/settings/LoginPageCustomizer";
import { useI18n } from "../../i18n/I18nContext";
const CAN_EDIT_CENTER: string[] = ["owner", "director"];
export function SettingsPage() {
  const { user, center, logout, setCenter } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [savingCenter, setSavingCenter] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deletingWorkspace, setDeletingWorkspace] = React.useState(false);

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

  const handleDeleteWorkspace = async () => {
    if (!center || !canEditCenter) return;
    if (confirmText.trim().toLowerCase() !== center.name.trim().toLowerCase()) {
      alert(`Iltimos, tasdiqlash uchun markaz nomini («${center.name}») to'g me'yorida kiriting.`);
      return;
    }
    setDeletingWorkspace(true);
    try {
      await repo.deleteCenter(center.id);
      await logout();
      navigate("/login");
    } catch (err: any) {
      alert(err?.message ?? "Markazni o'chirishda xatolik yuz berdi.");
      setDeletingWorkspace(false);
    }
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


      {/* Plans & Billing */}
      <GlassCard className="p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Tarif Rejalari (Plans & Billing)</h2>
          <p className="text-xs text-white/35 mt-0.5">Kengaytirilgan imkoniyatlar va limitlarni boshqarish</p>
        </div>

        {/* Current Plan Stats */}
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div>
            <p className="text-xs text-white/40">Joriy tarif</p>
            <p className="text-lg font-bold text-brand-300">Start (Tekin)</p>
          </div>
          <div>
            <p className="text-xs text-white/40">O'quvchilar limiti</p>
            <p className="text-lg font-bold text-white">12 / 15</p>
          </div>
          <div className="col-span-2 border-t border-white/[0.06] pt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40">SMS Balans</p>
              <p className="text-sm font-semibold text-white">0 SMS (0.00 USD)</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] border border-white/10 hover:bg-white/5">
              SMS Balansni to'ldirish
            </Button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Start Plan */}
          <div className="rounded-2xl border border-brand-500/20 bg-brand-500/[0.02] p-4 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-500/20 px-2 py-0.5 text-[9px] font-medium text-brand-300 rounded-bl-lg">
              Faol
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Start</h3>
              <p className="mt-1 text-xs text-white/50">Kichik guruhlar va yakka tartibdagi o'qituvchilar uchun</p>
            </div>
            <div className="mt-4">
              <p className="text-lg font-bold text-white">0 USD <span className="text-[10px] font-normal text-white/40">/oy</span></p>
              <ul className="mt-2 space-y-1 text-[11px] text-white/60">
                <li>• 15 tagacha o'quvchi</li>
                <li>• 1 ta filial (markaz)</li>
                <li>• Asosiy jurnal va hisobotlar</li>
              </ul>
            </div>
          </div>

          {/* Growth Plan */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-4 flex flex-col justify-between hover:border-brand-500/30 transition">
            <div>
              <h3 className="text-sm font-bold text-white">Rivojlanish (Growth)</h3>
              <p className="mt-1 text-xs text-white/50">Rivojlanayotgan o'quv markazlari uchun</p>
            </div>
            <div className="mt-4">
              <p className="text-lg font-bold text-brand-300">19 USD <span className="text-[10px] font-normal text-white/40">/oy</span></p>
              <ul className="mt-2 space-y-1 text-[11px] text-white/60">
                <li>• 100 tagacha o'quvchi</li>
                <li>• 2 ta filial (markaz)</li>
                <li>• SMS xabarnomalar</li>
                <li>• Telegram-bot orqali davomat</li>
              </ul>
              <Button className="mt-3 w-full h-8 text-[11px]" size="sm" variant="ghost">
                Tanlash
              </Button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-4 flex flex-col justify-between hover:border-brand-500/30 transition">
            <div>
              <h3 className="text-sm font-bold text-white">Professional (Pro)</h3>
              <p className="mt-1 text-xs text-white/50">Katta o'quv markazlari va maktablar uchun</p>
            </div>
            <div className="mt-4">
              <p className="text-lg font-bold text-brand-300">49 USD <span className="text-[10px] font-normal text-white/40">/oy</span></p>
              <ul className="mt-2 space-y-1 text-[11px] text-white/60">
                <li>• Cheksiz o'quvchi</li>
                <li>• Cheksiz filial</li>
                <li>• Brendlashtirish (Logo & Ranglar)</li>
                <li>• Moliyaviy tahlillar</li>
              </ul>
              <Button className="mt-3 w-full h-8 text-[11px]" size="sm" variant="ghost">
                Tanlash
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Login page customization — directors & owners only (branding = center identity) */}
      {canEditCenter && <LoginPageCustomizer />}

      {/* Danger zone */}
      <GlassCard className="border-red-500/20 p-6 space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-400/70">{t("settings.sectionDangerZone")}</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">{t("settings.signOut")}</p>
            <p className="text-xs text-white/40">{t("settings.signOutDesc")}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1.5" /> {t("settings.signOutBtn")}
          </Button>
        </div>

        {canEditCenter && (
          <div className="border-t border-white/[0.06] pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-400">O'quv markazni o'chirish (Delete Workspace)</p>
              <p className="text-xs text-white/40">Barcha ma'lumotlar (guruhlar, talabalar, to'lovlar) butunlay o'chib ketadi.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Markazni o'chirish
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Delete Workspace Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setConfirmText(""); }}
        title="O'quv markazni o'chirishni tasdiqlang"
        description={`Siz haqiqatan ham «${center.name}» markazini va uning barcha ma'lumotlarini o'chirib tashlamoqchimisiz? Bu harakatni ortga qaytarib bo'lmaydi.`}
      >
        <div className="space-y-4 pt-2">
          <Field label={`Tasdiqlash uchun markaz nomini kiriting: "${center.name}"`}>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={center.name}
              autoFocus
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => { setShowDeleteModal(false); setConfirmText(""); }} disabled={deletingWorkspace}>
              Bekor qilish
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={handleDeleteWorkspace}
              loading={deletingWorkspace}
              disabled={confirmText.trim().toLowerCase() !== center.name.trim().toLowerCase()}
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Butunlay o'chirish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
