import * as React from "react";
import { useParams, Link } from "react-router-dom";
import {
  Building2, Users, Globe, Calendar, DollarSign,
  GraduationCap, UserSquare2, DoorOpen, BookOpen, Wallet, Save, RefreshCw,
} from "lucide-react";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Center, User } from "../../types";
import { AdminHeader } from "./AdminLayout";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";

type Tab = "overview" | "users";

interface CenterCounts {
  students: number;
  teachers: number;
  groups: number;
  rooms: number;
  payments: number;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.04]">
        <Icon className="h-3.5 w-3.5 text-white/40" />
      </div>
      <span className="w-32 shrink-0 text-xs text-white/40">{label}</span>
      <span className="text-sm text-white/80">{value}</span>
    </div>
  );
}

export function AdminCenterDetailPage() {
  const { centerId } = useParams<{ centerId: string }>();
  const [center, setCenter] = React.useState<Center | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [counts, setCounts] = React.useState<CenterCounts | null>(null);
  const [loadingCenter, setLoadingCenter] = React.useState(true);
  const [loadingUsers, setLoadingUsers] = React.useState(false);
  const [tab, setTab] = React.useState<Tab>("overview");
  const [error, setError] = React.useState<string | null>(null);

  // Edit state for inline center name / description
  const [editName, setEditName] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [savedMsg, setSavedMsg] = React.useState(false);

  const loadCenter = React.useCallback(async () => {
    if (!centerId) return;
    setLoadingCenter(true);
    setError(null);
    try {
      const [c, students, teachers, groups, rooms, payments] = await Promise.all([
        repo.getCenter(centerId),
        repo.listStudents(centerId),
        repo.listUsers(centerId),
        repo.listGroups(centerId),
        repo.listRooms(centerId),
        repo.listPayments(centerId),
      ]);
      setCenter(c);
      if (c) { setEditName(c.name); setEditDesc(c.description ?? ""); }
      setCounts({
        students: students.length,
        teachers: teachers.filter((u) => u.role === "teacher").length,
        groups: groups.length,
        rooms: rooms.length,
        payments: payments.length,
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load center");
    } finally {
      setLoadingCenter(false);
    }
  }, [centerId]);

  const loadUsers = React.useCallback(async () => {
    if (!centerId) return;
    setLoadingUsers(true);
    try {
      const u = await repo.adminListUsersOfCenter(centerId);
      setUsers(u);
    } catch { /* swallow */ }
    finally { setLoadingUsers(false); }
  }, [centerId]);

  React.useEffect(() => { loadCenter(); }, [loadCenter]);
  React.useEffect(() => { if (tab === "users") loadUsers(); }, [tab, loadUsers]);

  const handleSave = async () => {
    if (!centerId) return;
    setSaving(true);
    try {
      const updated = await repo.adminUpdateCenter(centerId, {
        name: editName.trim() || center!.name,
        description: editDesc.trim() || undefined,
      });
      setCenter(updated);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loadingCenter) {
    return (
      <div>
        <AdminHeader title="Loading…" crumbs={[{ label: "Centers", to: "/ilmoz-admin/centers" }]} />
        <div className="p-8 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !center) {
    return (
      <div>
        <AdminHeader title="Error" crumbs={[{ label: "Centers" }]} />
        <div className="p-8">
          <p className="text-sm text-red-400">{error ?? "Center not found"}</p>
          <Link to="/ilmoz-admin/centers" className="mt-3 inline-block text-sm text-brand-300 hover:text-brand-200">
            ← Back to centers
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: `Users${users.length ? ` (${users.length})` : ""}` },
  ];

  return (
    <div>
      <AdminHeader
        title={center.name}
        subtitle={center.description}
        crumbs={[
          { label: "Centers", to: "/ilmoz-admin/centers" },
          { label: center.name },
        ]}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/[0.06] px-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition border-b-2 -mb-px",
              tab === t.id
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-white/40 hover:text-white/70"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-8">
        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Info card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-3">
                {center.logoUrl ? (
                  <img src={center.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-contain" />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15">
                    <Building2 className="h-7 w-7 text-amber-400" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-white">{center.name}</p>
                  <p className="text-xs font-mono text-white/30">{center.id}</p>
                </div>
              </div>

              <InfoRow icon={Globe}     label="Subdomain"  value={center.subdomain ? `${center.subdomain}.ilmoz.uz` : "—"} />
              <InfoRow icon={DollarSign} label="Currency"  value={center.currency} />
              <InfoRow icon={Calendar}  label="Created"    value={new Date(center.createdAt).toLocaleString()} />
            </div>

            {/* Quick-edit card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="mb-4 text-sm font-semibold text-white/50 uppercase tracking-wider">Quick edit</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs text-white/50">Name</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-amber-400/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-white/50">Description</label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-amber-400/50 resize-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-1">
                  {savedMsg && <span className="text-xs text-emerald-400">✓ Saved</span>}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/30 disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            {(
              [
                { icon: GraduationCap, label: "Students",  color: "text-sky-400 bg-sky-500/15",      value: counts?.students  },
                { icon: UserSquare2,   label: "Teachers",  color: "text-violet-400 bg-violet-500/15", value: counts?.teachers  },
                { icon: BookOpen,      label: "Groups",    color: "text-emerald-400 bg-emerald-500/15", value: counts?.groups  },
                { icon: DoorOpen,      label: "Rooms",     color: "text-orange-400 bg-orange-500/15", value: counts?.rooms    },
                { icon: Wallet,        label: "Payments",  color: "text-rose-400 bg-rose-500/15",     value: counts?.payments },
                { icon: Users,         label: "All users", color: "text-amber-400 bg-amber-500/15",   value: users.length || undefined },
              ] as const
            ).map(({ icon: Icon, label, color, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className={cn("grid h-10 w-10 place-items-center rounded-xl", color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-white/40">{label}</p>
                  {loadingCenter ? (
                    <div className="mt-1 h-4 w-8 animate-pulse rounded-full bg-white/[0.06]" />
                  ) : (
                    <p className="text-lg font-semibold text-white">{value ?? 0}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Users ── */}
        {tab === "users" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-white/50">{users.length} user{users.length !== 1 ? "s" : ""} in this center</p>
              <button
                onClick={loadUsers}
                disabled={loadingUsers}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition disabled:opacity-40"
              >
                <RefreshCw className={cn("h-3 w-3", loadingUsers && "animate-spin")} />
                Refresh
              </button>
            </div>

            {loadingUsers ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-white/[0.03]" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <p className="py-16 text-center text-sm text-white/30">No users found</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-5 py-3 text-left text-xs font-medium text-white/40">User</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Role</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-white/40">Email / Phone</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-white/40">UID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-white/[0.04] hover:bg-white/[0.01] transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} color={u.avatarColor} size="sm" />
                            <span className="font-medium text-white">{u.name}</span>
                            {u.isadm && (
                              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                                ADM
                              </span>
                            )}
                            {u.ismod && (
                              <span className="rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">
                                MOD
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={u.role === "owner" ? "brand" : "neutral"}>
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-xs text-white/45">
                          {u.email ?? u.phone ?? "—"}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-white/25">{u.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
