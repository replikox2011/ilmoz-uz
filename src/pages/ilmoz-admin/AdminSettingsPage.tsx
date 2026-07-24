import * as React from "react";
import { Globe, Mail, Bot, UserPlus, Fingerprint, LogIn } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import { PageBody, SectionCard, Toggle, ErrorBanner } from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import type { PlatformSettings } from "../../types/admin";

const FIELD =
  "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none";

const EMPTY_SETTINGS: PlatformSettings = {
  rootDomain: "",
  supportEmail: "",
  smtpHost: "",
  smtpPort: 587,
  aiModel: "openai/gpt-4o",
  registrationOpen: true,
  googleAuth: true,
  emailAuth: true,
  enforce2faOwners: true,
  enforce2faModerators: true,
  loginNotifications: true,
};

export function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<PlatformSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const s = await repo.adminGetPlatformSettings();
        if (s) setSettings(s);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load platform settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set<K extends keyof PlatformSettings>(key: K, val: PlatformSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: val }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await repo.adminUpdatePlatformSettings(settings);
      setToast("Settings saved");
      setTimeout(() => setToast(null), 3200);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Platform Settings"
        subtitle="Domains, email, AI, authentication, and security defaults"
      />
      <PageBody>
        {error && <ErrorBanner error={error} />}
        {loading ? (
          <p className="py-16 text-center text-sm text-white/30">Loading settings…</p>
        ) : (
          <>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <SectionCard title="Domains">
                <Field icon={<Globe className="h-4 w-4" />} label="Root domain">
                  <input
                    className={FIELD}
                    value={settings.rootDomain}
                    onChange={(e) => set("rootDomain", e.target.value)}
                    placeholder="ilmoz.uz"
                  />
                  <p className="mt-1.5 text-xs text-white/40">
                    Tenant subdomains are provisioned under this domain.
                  </p>
                </Field>
              </SectionCard>

              <SectionCard title="Email / SMTP">
                <Field icon={<Mail className="h-4 w-4" />} label="Support email">
                  <input
                    className={FIELD}
                    value={settings.supportEmail}
                    onChange={(e) => set("supportEmail", e.target.value)}
                    placeholder="support@ilmoz.uz"
                  />
                </Field>
                <div className="mt-4 grid grid-cols-[1fr_120px] gap-3">
                  <Field label="SMTP host">
                    <input
                      className={FIELD}
                      value={settings.smtpHost}
                      onChange={(e) => set("smtpHost", e.target.value)}
                      placeholder="smtp.mailgun.org"
                    />
                  </Field>
                  <Field label="Port">
                    <input
                      className={FIELD}
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => set("smtpPort", Number(e.target.value))}
                      placeholder="587"
                    />
                  </Field>
                </div>
              </SectionCard>

              <SectionCard title="AI">
                <Field icon={<Bot className="h-4 w-4" />} label="Default AI model">
                  <input
                    className={FIELD}
                    value={settings.aiModel}
                    onChange={(e) => set("aiModel", e.target.value)}
                    placeholder="openai/gpt-4o"
                  />
                  <p className="mt-1.5 text-xs text-white/40">
                    Used by the Copilot and AI Analytics across all tenants.
                  </p>
                </Field>
              </SectionCard>

              <SectionCard title="Authentication">
                <div className="space-y-1">
                  <ToggleRow
                    icon={<UserPlus className="h-4 w-4" />}
                    label="Open registration"
                    hint="Allow new education centers to sign up."
                    checked={settings.registrationOpen}
                    onChange={(v) => set("registrationOpen", v)}
                  />
                  <ToggleRow
                    icon={<LogIn className="h-4 w-4" />}
                    label="Google sign-in"
                    hint="Allow Google popup authentication."
                    checked={settings.googleAuth}
                    onChange={(v) => set("googleAuth", v)}
                  />
                  <ToggleRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Email + password sign-in"
                    hint="Allow email/password authentication."
                    checked={settings.emailAuth}
                    onChange={(v) => set("emailAuth", v)}
                  />
                </div>
              </SectionCard>

              <SectionCard title="Security defaults" className="lg:col-span-2">
                <div className="grid gap-1 md:grid-cols-3">
                  <ToggleRow
                    icon={<Fingerprint className="h-4 w-4" />}
                    label="Enforce 2FA — Owners"
                    hint="Mandatory second factor for all owners."
                    checked={settings.enforce2faOwners}
                    onChange={(v) => set("enforce2faOwners", v)}
                  />
                  <ToggleRow
                    icon={<Fingerprint className="h-4 w-4" />}
                    label="Enforce 2FA — Moderators"
                    hint="Mandatory second factor for all moderators."
                    checked={settings.enforce2faModerators}
                    onChange={(v) => set("enforce2faModerators", v)}
                  />
                  <ToggleRow
                    icon={<LogIn className="h-4 w-4" />}
                    label="Login notifications"
                    hint="Alert on sign-in from a new device."
                    checked={settings.loginNotifications}
                    onChange={(v) => set("loginNotifications", v)}
                  />
                </div>
              </SectionCard>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-xl bg-amber-500/90 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save settings"}
              </button>
              {toast && (
                <span className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {toast}
                </span>
              )}
            </div>
          </>
        )}
      </PageBody>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-white/45">
        {icon && <span className="text-amber-300/80">{icon}</span>}
        {label}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.05] py-3 last:border-0 md:border-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
          {icon}
        </span>
        <div>
          <div className="text-sm text-white/90">{label}</div>
          <div className="text-xs text-white/45">{hint}</div>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
