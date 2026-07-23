import * as React from "react";
import { ShieldCheck, KeyRound, Monitor, LogOut, Bell } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import {
  PageBody,
  SectionCard,
  Toggle,
  Pill,
  Table,
  Th,
  Td,
  Tr,
  StatCard,
  ErrorBanner,
  SkeletonRows,
} from "./adminUi";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import type { ActiveSession, LogEntry, LogResult, PlatformSettings } from "../../types/admin";

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

const RESULT_TONE: Record<LogResult, "emerald" | "rose"> = {
  success: "emerald",
  failure: "rose",
};

function splitAt(iso: string): [string, string] {
  const [d, rest = ""] = iso.split("T");
  return [d, rest.slice(0, 5)];
}

export function AdminSecurityPage() {
  const [settings, setSettings] = React.useState<PlatformSettings>(EMPTY_SETTINGS);
  const [securityLogs, setSecurityLogs] = React.useState<LogEntry[]>([]);
  const [sessions] = React.useState<ActiveSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, allLogs] = await Promise.all([
        repo.adminGetPlatformSettings(),
        repo.adminListLogs(200),
      ]);
      if (s) setSettings(s);
      const filtered = allLogs.filter((l) =>
        /login|logout|2fa|password|session|device|security/i.test(`${l.action} ${l.target ?? ""}`)
      );
      setSecurityLogs(filtered.length ? filtered : allLogs.slice(0, 50));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load security data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function toggle2fa(field: "enforce2faOwners" | "enforce2faModerators", next: boolean) {
    if (saving) return;
    setSaving(true);
    setSettings((prev) => ({ ...prev, [field]: next }));
    try {
      await repo.adminUpdatePlatformSettings({ [field]: next });
      flash(next ? `2FA enforced` : `2FA relaxed`);
    } catch {
      setSettings((prev) => ({ ...prev, [field]: !next }));
    } finally {
      setSaving(false);
    }
  }

  async function toggleNotifs(next: boolean) {
    if (saving) return;
    setSaving(true);
    setSettings((prev) => ({ ...prev, loginNotifications: next }));
    try {
      await repo.adminUpdatePlatformSettings({ loginNotifications: next });
      flash(next ? "Login notifications on" : "Login notifications off");
    } catch {
      setSettings((prev) => ({ ...prev, loginNotifications: !next }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <AdminHeader
        title="Security"
        subtitle="Two-factor enforcement, active sessions, and the security audit trail"
      />
      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={ShieldCheck}
            label="2FA — Owners"
            value={settings.enforce2faOwners ? "Enforced" : "Optional"}
            sub="Required for all owner accounts"
            color={settings.enforce2faOwners ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}
          />
          <StatCard
            icon={ShieldCheck}
            label="2FA — Moderators"
            value={settings.enforce2faModerators ? "Enforced" : "Optional"}
            sub="Required for all moderator accounts"
            color={settings.enforce2faModerators ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}
          />
          <StatCard
            icon={Monitor}
            label="Active sessions"
            value={String(sessions.length)}
            sub="Signed-in devices"
          />
          <StatCard
            icon={Bell}
            label="Login alerts"
            value={settings.loginNotifications ? "On" : "Off"}
            sub="New-device notifications"
            color={settings.loginNotifications ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white/50"}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionCard title="Two-factor authentication">
            <div className="space-y-1">
              <ToggleRow
                icon={<KeyRound className="h-4 w-4" />}
                label="Require 2FA for Owners"
                hint="Mandatory. Owners must complete a second factor at every sign-in."
                checked={settings.enforce2faOwners}
                disabled={saving}
                onChange={(v) => toggle2fa("enforce2faOwners", v)}
              />
              <ToggleRow
                icon={<KeyRound className="h-4 w-4" />}
                label="Require 2FA for Moderators"
                hint="Mandatory. Moderators must complete a second factor at every sign-in."
                checked={settings.enforce2faModerators}
                disabled={saving}
                onChange={(v) => toggle2fa("enforce2faModerators", v)}
              />
              <ToggleRow
                icon={<Bell className="h-4 w-4" />}
                label="New-device login notifications"
                hint="Email the account when a sign-in comes from an unrecognized device."
                checked={settings.loginNotifications}
                disabled={saving}
                onChange={toggleNotifs}
              />
            </div>
            {toast && (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {toast}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Active sessions">
            {sessions.length === 0 ? (
              <p className="py-8 text-center text-xs text-white/30">
                Session tracking requires a backend integration.
              </p>
            ) : (
              <Table head={<><Th>User</Th><Th>Device</Th><Th>Location</Th><Th>Last seen</Th><Th /></>}>
                {sessions.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="text-white/90">{s.user}</span>
                        {s.current && <Pill tone="emerald">This device</Pill>}
                      </div>
                      <div className="text-xs text-white/40">{s.role}</div>
                    </Td>
                    <Td>
                      <div className="text-white/80">{s.device}</div>
                      <div className="text-xs text-white/40">{s.browser} · {s.ip}</div>
                    </Td>
                    <Td>{s.location}</Td>
                    <Td>{s.lastSeen.replace("T", " ").slice(0, 16)}</Td>
                    <Td className="text-right">
                      {s.current ? (
                        <span className="text-xs text-white/30">—</span>
                      ) : (
                        <button className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/20">
                          <LogOut className="h-3.5 w-3.5" /> Revoke
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </SectionCard>
        </div>

        <div className="mt-6">
          <SectionCard title="Security log">
            <Table head={<><Th>Actor</Th><Th>Action</Th><Th>IP / Device</Th><Th>When</Th><Th>Result</Th></>}>
              {loading ? (
                <SkeletonRows cols={5} />
              ) : (
                securityLogs.map((l) => (
                  <Tr key={l.id}>
                    <Td>
                      <div className="text-white/90">{l.actor}</div>
                      <div className="text-xs text-white/40">{l.role}</div>
                    </Td>
                    <Td>
                      <div className="text-white/80">{l.action}</div>
                      {l.target && <div className="text-xs text-white/40">{l.target}</div>}
                    </Td>
                    <Td>
                      <div className="text-white/70">{l.ip}</div>
                      <div className="text-xs text-white/40">{l.device} · {l.browser}</div>
                    </Td>
                    <Td>{splitAt(l.at)[0]} · {splitAt(l.at)[1]}</Td>
                    <Td>
                      <Pill tone={RESULT_TONE[l.result]}>{l.result}</Pill>
                    </Td>
                  </Tr>
                ))
              )}
            </Table>
            {!loading && securityLogs.length === 0 && (
              <p className="py-8 text-center text-xs text-white/30">No security events in audit logs yet.</p>
            )}
          </SectionCard>
        </div>
      </PageBody>
    </div>
  );
}

function ToggleRow({
  icon, label, hint, checked, onChange, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.05] py-3 last:border-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-300">
          {icon}
        </span>
        <div>
          <div className="text-sm text-white/90">{label}</div>
          <div className="text-xs text-white/45">{hint}</div>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}
