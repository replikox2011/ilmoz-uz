import * as React from "react";
import { ShieldCheck, Plus, Pencil, Ban, Trash2, KeyRound, ShieldAlert, RefreshCw } from "lucide-react";
import { AdminHeader } from "./AdminLayout";
import {
  PageBody,
  Table,
  Th,
  Td,
  Tr,
  Pill,
  Toggle,
  EmptyState,
  ErrorBanner,
  SkeletonRows,
} from "./adminUi";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Moderator, PermissionKey, PERMISSION_LABELS, ALL_PERMISSIONS } from "../../types/admin";
import { cn } from "../../lib/utils";

export function AdminModeratorsPage() {
  const [mods, setMods] = React.useState<Moderator[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<Moderator | null>(null);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.adminListModerators();
      setMods(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load moderators");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const upsert = (m: Moderator) =>
    setMods((prev) => {
      const exists = prev.some((x) => x.id === m.id);
      return exists ? prev.map((x) => (x.id === m.id ? m : x)) : [...prev, m];
    });

  const toggleBlock = async (m: Moderator) => {
    const next = !m.blocked;
    setMods((prev) => prev.map((x) => x.id === m.id ? { ...x, blocked: next } : x));
    await repo.adminUpdateModerator(m.id, { blocked: next });
  };

  const toggle2fa = async (m: Moderator) => {
    const next = !m.twoFactor;
    setMods((prev) => prev.map((x) => x.id === m.id ? { ...x, twoFactor: next } : x));
    await repo.adminUpdateModerator(m.id, { twoFactor: next });
  };

  const remove = async (id: string) => {
    setMods((prev) => prev.filter((m) => m.id !== id));
    await repo.adminDeleteModerator(id);
  };

  return (
    <div>
      <AdminHeader
        title="Moderators"
        subtitle="The Nexo operations team with fine-grained RBAC permissions."
        crumbs={[{ label: "Moderators" }]}
      />

      <PageBody>
        {error && <ErrorBanner error={error} onRetry={load} />}

        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-white/40">{loading ? "…" : `${mods.length} moderators`}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30"
            >
              <Plus className="h-3.5 w-3.5" /> Add moderator
            </button>
          </div>
        </div>

        <Table
          head={
            <>
              <Th>Moderator</Th>
              <Th>Permissions</Th>
              <Th>2FA</Th>
              <Th>Status</Th>
              <Th>Last active</Th>
              <Th className="text-right">Actions</Th>
            </>
          }
        >
          {loading ? (
            <SkeletonRows cols={6} />
          ) : (
            mods.map((m) => (
              <Tr key={m.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} color={m.avatarColor} size="sm" />
                    <div>
                      <p className="font-medium text-white">{m.name}</p>
                      <p className="text-[11px] text-white/35">{m.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {m.permissions.slice(0, 3).map((p) => (
                      <Pill key={p} tone="sky">{PERMISSION_LABELS[p]}</Pill>
                    ))}
                    {m.permissions.length > 3 && <Pill tone="neutral">+{m.permissions.length - 3}</Pill>}
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Toggle checked={m.twoFactor} onChange={() => toggle2fa(m)} />
                    {m.twoFactor ? (
                      <span className="text-xs text-emerald-400">on</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <ShieldAlert className="h-3 w-3" /> off
                      </span>
                    )}
                  </div>
                </Td>
                <Td>{m.blocked ? <Pill tone="red">Blocked</Pill> : <Pill tone="emerald">Active</Pill>}</Td>
                <Td className="text-xs text-white/40">{new Date(m.lastActive).toLocaleDateString()}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <IconBtn title="Edit permissions" onClick={() => setEditing(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn title={m.blocked ? "Unblock" : "Block"} onClick={() => toggleBlock(m)}>
                      <Ban className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn title="Delete" tone="red" onClick={() => remove(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Table>
        {!loading && mods.length === 0 && <EmptyState icon={ShieldCheck} message="No moderators yet" />}

        {(editing || creating) && (
          <ModeratorModal
            moderator={editing}
            onClose={() => { setEditing(null); setCreating(false); }}
            onSave={async (m) => {
              upsert(m);
              await repo.adminUpdateModerator(m.id, m);
              setEditing(null);
              setCreating(false);
            }}
          />
        )}
      </PageBody>
    </div>
  );
}

function IconBtn({
  children, onClick, title, tone = "neutral",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  tone?: "neutral" | "red";
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-lg p-1.5 transition",
        tone === "red"
          ? "text-red-300/70 hover:bg-red-500/10 hover:text-red-300"
          : "text-white/40 hover:bg-white/[0.06] hover:text-white/80"
      )}
    >
      {children}
    </button>
  );
}

function ModeratorModal({
  moderator, onClose, onSave,
}: {
  moderator: Moderator | null;
  onClose: () => void;
  onSave: (m: Moderator) => void;
}) {
  const [name, setName] = React.useState(moderator?.name ?? "");
  const [email, setEmail] = React.useState(moderator?.email ?? "");
  const [perms, setPerms] = React.useState<Set<PermissionKey>>(
    new Set(moderator?.permissions ?? ["organizations.view"])
  );
  const [twoFactor, setTwoFactor] = React.useState(moderator?.twoFactor ?? false);

  const togglePerm = (p: PermissionKey) =>
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });

  const save = () => {
    if (!name.trim() || !email.trim()) return;
    onSave({
      id: moderator?.id ?? `md_${email.replace(/[^a-z0-9]/gi, "").slice(0, 8)}`,
      name: name.trim(),
      email: email.trim(),
      avatarColor: moderator?.avatarColor ?? "#3b6bff",
      permissions: Array.from(perms),
      twoFactor,
      blocked: moderator?.blocked ?? false,
      lastActive: moderator?.lastActive ?? new Date().toISOString(),
      createdAt: moderator?.createdAt ?? new Date().toISOString(),
    });
  };

  return (
    <Modal open onClose={onClose} title={moderator ? "Edit moderator" : "Add moderator"} description="Grant only the permissions this teammate needs (RBAC).">
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="h-11 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="h-11 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-white/25 focus:border-amber-400/40 focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Permissions</p>
          <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
            {ALL_PERMISSIONS.map((p) => {
              const active = perms.has(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePerm(p)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition",
                    active
                      ? "border-amber-400/30 bg-amber-500/[0.08] text-amber-100"
                      : "border-white/[0.06] bg-white/[0.02] text-white/55 hover:text-white/80"
                  )}
                >
                  <KeyRound className={cn("h-3.5 w-3.5 shrink-0", active ? "text-amber-300" : "text-white/25")} />
                  {PERMISSION_LABELS[p]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-sm text-white">Require 2FA</p>
            <p className="text-xs text-white/40">Enforce two-factor authentication for this moderator</p>
          </div>
          <Toggle checked={twoFactor} onChange={setTwoFactor} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/50 transition hover:text-white/80">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!name.trim() || !email.trim()}
            className="rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30 disabled:opacity-40"
          >
            {moderator ? "Save changes" : "Create moderator"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
