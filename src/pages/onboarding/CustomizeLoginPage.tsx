import * as React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Palette, Type, Sparkles, Upload, X } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { LoginBrandPanel } from "../../components/auth/LoginBrandPanel";
import { Button } from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Input";
import { Logo } from "../../components/ui/Logo";
import { ImageCropModal } from "../../components/ui/ImageCropModal";
import { Center, LoginTheme } from "../../types";
import {
  LOGIN_TEMPLATES,
  DEFAULT_TEMPLATE_ID,
  getLoginTemplate,
  LoginTemplateMeta,
} from "../../config/loginTemplates";
import { firestoreRepository } from "../../data/firestoreRepository";
import { buildSubdomainUrl } from "../../lib/subdomain";
import { cn } from "../../lib/utils";

// Framer v11 shim
const AP: any = AnimatePresence;

// ── Recommended cover image aspect ratio ──────────────────────────────────────
const COVER_ASPECT = 16 / 10; // matches the live-preview box

function cleanTheme(t: LoginTheme): LoginTheme {
  const out: LoginTheme = { templateId: t.templateId };
  if (t.accent) out.accent = t.accent;
  if (t.headline?.trim()) out.headline = t.headline.trim();
  if (t.tagline?.trim()) out.tagline = t.tagline.trim();
  if (t.backgroundUrl) out.backgroundUrl = t.backgroundUrl;
  if (t.hidePoweredBy) out.hidePoweredBy = true;
  return out;
}

/** Build a minimal Center for template thumbnail rendering. */
function makeThumbCenter(tpl: LoginTemplateMeta, base: Center): Center {
  return {
    ...base,
    loginTheme: {
      templateId: tpl.id,
      accent: tpl.defaultAccent,
    },
  };
}

export function CustomizeLoginPage() {
  const { center, setCenter } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const bgInputRef = React.useRef<HTMLInputElement>(null);

  // ── Image crop state ───────────────────────────────────────────────────────
  const [cropFile, setCropFile] = React.useState<File | null>(null);

  const [draft, setDraft] = React.useState<LoginTheme>(() => ({
    templateId: DEFAULT_TEMPLATE_ID,
    ...(center?.loginTheme ?? {}),
  }));

  React.useEffect(() => {
    if (!center) navigate("/", { replace: true });
  }, [center, navigate]);

  if (!center) return null;

  const activeMeta = getLoginTemplate(draft.templateId);
  const accent = draft.accent || activeMeta.defaultAccent;
  const previewCenter: Center = { ...center, loginTheme: cleanTheme({ ...draft, accent }) };

  const patch = (p: Partial<LoginTheme>) => setDraft(d => ({ ...d, ...p }));

  const pickTemplate = (id: string) => {
    const meta = getLoginTemplate(id);
    setDraft(d => ({
      ...d,
      templateId: id,
      accent:
        d.accent && d.accent !== getLoginTemplate(d.templateId).defaultAccent
          ? d.accent
          : meta.defaultAccent,
    }));
  };

  // ── Background image upload ────────────────────────────────────────────────
  const handleBgFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;

    // Check aspect ratio — if significantly off, show crop modal
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = img.naturalWidth / img.naturalHeight;
      const tolerance = 0.15; // 15%
      if (Math.abs(ratio - COVER_ASPECT) / COVER_ASPECT > tolerance) {
        // Doesn't match — open crop modal
        setCropFile(file);
      } else {
        // Good enough — upload directly
        uploadBgFile(file);
      }
    };
    img.src = url;
  };

  const uploadBgFile = async (file: File | Blob) => {
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

  const handleCropConfirm = async (blob: Blob) => {
    setCropFile(null);
    await uploadBgFile(blob);
  };

  // ── Launch ─────────────────────────────────────────────────────────────────
  const redirect = () => {
    if (center.subdomain) {
      window.location.href = buildSubdomainUrl(center.subdomain) + "/";
    } else {
      navigate("/");
    }
  };

  const handleLaunch = async () => {
    setSaving(true);
    try {
      const loginTheme = cleanTheme({ ...draft, accent });
      const updated = await firestoreRepository.updateCenter(center.id, { loginTheme });
      setCenter(updated);
      redirect();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Crop modal */}
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          aspectRatio={COVER_ASPECT}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}

      <div className="flex min-h-screen flex-col bg-[#05060a]">
        {/* Top bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-4 sm:px-10">
          <div className="flex items-center gap-4">
            <Logo size={24} showText={false} />
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1.5 w-5 rounded-full bg-brand-500" />
              ))}
            </div>
            <span className="hidden text-xs text-white/30 sm:block">Step 3 of 3</span>
          </div>
          <button
            onClick={redirect}
            className="text-sm text-white/35 transition hover:text-white/60"
          >
            Skip →
          </button>
        </header>

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left controls ── */}
          <div className="flex w-full flex-col overflow-y-auto lg:w-[460px] lg:shrink-0 lg:border-r lg:border-white/[0.06]">
            <div className="p-6 sm:p-10">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-400" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
                    Almost there
                  </span>
                </div>
                <h1 className="mt-1 text-2xl font-bold text-white">Оформите страницу входа</h1>
                <p className="mt-1.5 text-sm text-white/40">
                  Именно это увидят студенты и преподаватели, когда придут на{" "}
                  {center.subdomain ? (
                    <span className="font-medium text-white/60">{center.subdomain}.ilmoz.uz</span>
                  ) : (
                    "ваш workspace"
                  )}
                  .
                </p>

                {/* ── Template gallery ── */}
                <div className="mt-8">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                    Выберите шаблон
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {LOGIN_TEMPLATES.map(tpl => {
                      const active = tpl.id === draft.templateId;
                      const thumbCenter = makeThumbCenter(tpl, previewCenter);
                      return (
                        <motion.button
                          key={tpl.id}
                          type="button"
                          onClick={() => pickTemplate(tpl.id)}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            "group relative overflow-hidden rounded-2xl border text-left transition-all duration-200",
                            active
                              ? "border-brand-400/70 ring-2 ring-brand-500/25 shadow-glow"
                              : "border-white/[0.08] hover:border-white/20"
                          )}
                        >
                          {/* Real template preview (scaled) */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden">
                            <div
                              className="pointer-events-none"
                              style={{
                                width: 300,
                                height: 225,
                                transform: "scale(0.5)",
                                transformOrigin: "top left",
                                position: "absolute",
                                top: 0,
                                left: 0,
                              }}
                            >
                              <LoginBrandPanel center={thumbCenter} preview={false} />
                            </div>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                          </div>

                          {/* Active check */}
                          {active && (
                            <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-500 text-white shadow-lg">
                              <Check className="h-3 w-3" />
                            </span>
                          )}

                          <span className="block px-2.5 py-2 text-[11px] font-medium text-white/70">
                            {tpl.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Text customization ── */}
                <div className="mt-8 space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
                    Текст
                  </p>
                  <Field label="Заголовок" hint="По умолчанию — название центра">
                    <Input
                      icon={<Type className="h-4 w-4" />}
                      value={draft.headline ?? ""}
                      onChange={e => patch({ headline: e.target.value })}
                      placeholder={center.name}
                    />
                  </Field>
                  <Field label="Подзаголовок" hint="Короткое приветствие">
                    <Input
                      value={draft.tagline ?? ""}
                      onChange={e => patch({ tagline: e.target.value })}
                      placeholder={center.description ?? "Добро пожаловать!"}
                    />
                  </Field>
                </div>

                {/* ── Accent color ── */}
                <div className="mt-6">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                    Акцентный цвет
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accent}
                      onChange={e => patch({ accent: e.target.value })}
                      className="h-12 w-14 cursor-pointer rounded-2xl border border-white/10 bg-transparent p-1.5"
                    />
                    <Input
                      icon={<Palette className="h-4 w-4" />}
                      value={accent}
                      onChange={e => patch({ accent: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>

                {/* ── Background image (templates that support it) ── */}
                <AP>
                  {activeMeta.supportsImage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 overflow-hidden"
                    >
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/35">
                        Фоновое изображение{" "}
                        <span className="normal-case font-normal text-white/25">
                          (рекомендуется 16:10)
                        </span>
                      </p>

                      {draft.backgroundUrl ? (
                        /* Preview with remove button */
                        <div className="relative overflow-hidden rounded-2xl border border-white/10">
                          <img
                            src={draft.backgroundUrl}
                            alt="background"
                            className="h-32 w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <button
                            type="button"
                            onClick={() => patch({ backgroundUrl: undefined })}
                            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white/70 transition hover:bg-black/80 hover:text-white"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => !uploading && bgInputRef.current?.click()}
                            className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs text-white/70 transition hover:bg-black/80 hover:text-white"
                          >
                            <Upload className="h-3 w-3" /> Заменить
                          </button>
                        </div>
                      ) : (
                        /* Upload area */
                        <div
                          onClick={() => !uploading && bgInputRef.current?.click()}
                          className={cn(
                            "flex h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] transition hover:border-brand-400/40 hover:bg-white/[0.06]",
                            uploading && "pointer-events-none opacity-50"
                          )}
                        >
                          <Upload className="h-5 w-5 text-white/30" />
                          <p className="text-xs text-white/35">
                            {uploading ? "Загружаем…" : "Нажмите чтобы загрузить"}
                          </p>
                          <p className="text-[10px] text-white/20">
                            Если пропорции не совпадают — покажем инструмент обрезки
                          </p>
                        </div>
                      )}

                      <input
                        ref={bgInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleBgFile(f);
                          e.target.value = "";
                        }}
                      />
                    </motion.div>
                  )}
                </AP>

                {/* ── CTA ── */}
                <div className="mt-10">
                  <Button onClick={handleLaunch} loading={saving} size="lg" className="w-full">
                    Запустить workspace
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="mt-3 text-center text-xs text-white/25">
                    Изменить можно в любое время в Настройках → Страница входа
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── Right: live preview ── */}
          <div className="hidden flex-1 flex-col items-center justify-center p-10 lg:flex">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl"
            >
              <p className="mb-3 text-center text-[11px] uppercase tracking-widest text-white/25">
                Live preview
              </p>
              <AP mode="wait">
                <motion.div
                  key={draft.templateId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden rounded-3xl border border-white/10 shadow-glass"
                  style={{ aspectRatio: "16 / 10" }}
                >
                  <LoginBrandPanel center={previewCenter} preview />
                </motion.div>
              </AP>
              {center.subdomain && (
                <p className="mt-3 text-center text-[11px] text-white/20">
                  {center.subdomain}.ilmoz.uz
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
