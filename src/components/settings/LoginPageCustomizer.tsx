import * as React from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Check, ImagePlus, Loader2, Monitor, X } from "lucide-react";
import { storage } from "../../lib/firebase";
import { Center, LoginTheme } from "../../types";
import {
  LOGIN_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  getLoginTemplate,
} from "../../config/loginTemplates";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { useAuth } from "../../context/AuthContext";
import { useI18n } from "../../i18n/I18nContext";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Field, Input } from "../ui/Input";
import { LoginBrandPanel } from "../auth/LoginBrandPanel";
import { cn } from "../../lib/utils";

// Build a clean LoginTheme with no `undefined`/empty values (Firestore-safe).
function cleanTheme(t: LoginTheme): LoginTheme {
  const out: LoginTheme = { templateId: t.templateId };
  if (t.accent) out.accent = t.accent;
  if (t.headline && t.headline.trim()) out.headline = t.headline.trim();
  if (t.tagline && t.tagline.trim()) out.tagline = t.tagline.trim();
  if (t.backgroundUrl) out.backgroundUrl = t.backgroundUrl;
  if (t.hidePoweredBy) out.hidePoweredBy = true;
  return out;
}

export function LoginPageCustomizer() {
  const { center, setCenter } = useAuth();
  const { t } = useI18n();
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  const [draft, setDraft] = React.useState<LoginTheme>(
    () => center?.loginTheme ?? { templateId: DEFAULT_TEMPLATE_ID }
  );

  if (!center) return null;

  const activeMeta = getLoginTemplate(draft.templateId);
  const accent = draft.accent || activeMeta.defaultAccent;

  // A synthetic center used purely to drive the live preview.
  const previewCenter: Center = { ...center, loginTheme: cleanTheme({ ...draft, accent }) };

  const patch = (p: Partial<LoginTheme>) => setDraft((d) => ({ ...d, ...p }));

  const pickTemplate = (id: string) => {
    const meta = getLoginTemplate(id);
    // If the user hasn't chosen a custom accent, follow the template's default.
    setDraft((d) => ({
      ...d,
      templateId: id,
      accent: d.accent && d.accent !== getLoginTemplate(d.templateId).defaultAccent ? d.accent : meta.defaultAccent,
    }));
  };

  const handleBgFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `centers/${center.id}/login-bg`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      patch({ backgroundUrl: url });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const loginTheme = cleanTheme({ ...draft, accent });
      const updated = await repo.updateCenter(center.id, { loginTheme });
      setCenter(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="mb-1 flex items-center gap-2">
        <Monitor className="h-4 w-4 text-brand-300" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          {t("settings.loginPage.section")}
        </h2>
      </div>
      <p className="mb-5 text-xs text-white/40">{t("settings.loginPage.hint")}</p>

      {/* ── Live preview ── */}
      <div className="mb-6 overflow-hidden rounded-3xl border border-white/10 shadow-glass">
        <div className="aspect-[16/9] w-full">
          <LoginBrandPanel center={previewCenter} preview />
        </div>
      </div>

      {/* ── Template gallery ── */}
      <p className="mb-2 text-xs font-medium text-white/60">{t("settings.loginPage.template")}</p>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {LOGIN_TEMPLATES.map((tpl) => {
          const active = tpl.id === draft.templateId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => pickTemplate(tpl.id)}
              title={tpl.description}
              className={cn(
                "group relative overflow-hidden rounded-2xl border p-0 text-left transition-all",
                active ? "border-brand-400/70 ring-2 ring-brand-500/30" : "border-white/10 hover:border-white/25"
              )}
            >
              <div
                className="aspect-[4/3] w-full"
                style={{ background: `linear-gradient(140deg, ${tpl.swatch[0]}, ${tpl.swatch[1]})` }}
              />
              {active && (
                <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white shadow">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <span className="block px-2 py-1.5 text-[11px] font-medium text-white/80">{tpl.name}</span>
            </button>
          );
        })}
      </div>

      {/* ── Controls ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("settings.loginPage.headline")}>
          <Input
            value={draft.headline ?? ""}
            onChange={(e) => patch({ headline: e.target.value })}
            placeholder={center.name}
          />
        </Field>
        <Field label={t("settings.loginPage.accent")}>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => patch({ accent: e.target.value })}
              className="h-11 w-14 cursor-pointer rounded-xl border border-white/10 bg-transparent p-1"
            />
            <Input
              value={accent}
              onChange={(e) => patch({ accent: e.target.value })}
              className="font-mono"
            />
          </div>
        </Field>
        <Field label={t("settings.loginPage.tagline")} className="sm:col-span-2">
          <Input
            value={draft.tagline ?? ""}
            onChange={(e) => patch({ tagline: e.target.value })}
            placeholder={center.description ?? t("settings.loginPage.taglinePlaceholder")}
          />
        </Field>
      </div>

      {/* ── Background image (only for image templates) ── */}
      {activeMeta.supportsImage && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-medium text-white/60">{t("settings.loginPage.background")}</p>
          <div
            onClick={() => !uploading && bgInputRef.current?.click()}
            className={cn(
              "relative flex h-28 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.03] transition-all hover:border-brand-400/40 hover:bg-white/[0.06]",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {draft.backgroundUrl ? (
              <>
                <img src={draft.backgroundUrl} alt="background" className="absolute inset-0 h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); patch({ backgroundUrl: undefined }); }}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white/70 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white/40" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-white/35">
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">{t("settings.loginPage.uploadImage")}</span>
              </div>
            )}
          </div>
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBgFile(f); }}
          />
        </div>
      )}

      {/* ── Powered-by toggle ── */}
      <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
        <span className="text-sm text-white/70">{t("settings.loginPage.hidePoweredBy")}</span>
        <input
          type="checkbox"
          checked={draft.hidePoweredBy ?? false}
          onChange={(e) => patch({ hidePoweredBy: e.target.checked })}
          className="h-4 w-4 accent-brand-500"
        />
      </label>

      {/* ── Save ── */}
      <div className="mt-5 flex items-center justify-end gap-3">
        {saved && <p className="text-sm text-green-400">{t("settings.saved")}</p>}
        <Button onClick={handleSave} loading={saving} size="sm">
          {t("settings.loginPage.publish")}
        </Button>
      </div>
    </GlassCard>
  );
}
