import * as React from "react";
import { motion } from "framer-motion";
import { GitBranch, Plus, ExternalLink, Trash2, Building2, Users, Globe, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { firestoreRepository } from "../../data/firestoreRepository";
import { Center, CenterNetwork } from "../../types";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";

// ─── Create Branch Modal ──────────────────────────────────────────────────────
interface CreateBranchModalProps {
  networkId: string;
  currency: string;
  onClose: () => void;
  onCreated: (branch: Center) => void;
}
// ─── Create Branch Modal ──────────────────────────────────────────────────────
interface CreateBranchModalProps {
  networkId: string;
  currency: string;
  onClose: () => void;
  onCreated: (branch: Center) => void;
}
function CreateBranchModal({ networkId, currency, onClose, onCreated }: CreateBranchModalProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!name.trim()) {
        setError("Filial nomini kiriting");
        setLoading(false);
        return;
      }
      const branch = await firestoreRepository.createBranch(networkId, {
        name: name.trim(),
        description: description.trim() || undefined,
        currency,
      });
      onCreated(branch);
    } catch (err: any) {
      setError(err?.message ?? "Xato yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-brand-500/15 flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Yangi filial qo'shish</h2>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Filial nomi *</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition"
                placeholder="Star Academy — Nukus filiali"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Tavsif (ixtiyoriy)</label>
              <textarea
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition"
                placeholder="Nukus shahridagi filialimiz..."
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="glass" className="flex-1" onClick={onClose}>
                Bekor qilish
              </Button>
              <Button type="submit" className="flex-1" loading={loading}>
                Filial yaratish
              </Button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}

// ─── Branch Card ──────────────────────────────────────────────────────────────
interface BranchCardProps {
  branch: Center;
  isHQ: boolean;
  branchIndex: number;
  onRemove?: (id: string) => void;
}
function BranchCard({ branch, isHQ, branchIndex, onRemove }: BranchCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <GlassCard className={cn("p-5 transition-all hover:border-white/15", isHQ && "border-brand-500/30 bg-brand-500/5")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center",
              isHQ ? "bg-brand-500/20" : "bg-white/[0.06]"
            )}>
              {isHQ ? (
                <Building2 className="h-5 w-5 text-brand-400" />
              ) : (
                <GitBranch className="h-5 w-5 text-white/40" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">{branch.name}</h3>
                {isHQ && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                    HQ
                  </span>
                )}
              </div>
              {branch.description && (
                <p className="mt-0.5 text-xs text-white/40">{branch.description}</p>
              )}
              <a
                href={`/${branchIndex}`}
                className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 px-2 py-0.5 text-[10px] font-medium text-brand-400 transition"
              >
                <Globe className="h-3 w-3" />
                Manzil: /{branchIndex}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {!isHQ && onRemove && (
            <button
              onClick={() => onRemove(branch.id)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
              title="Filialdan o'chirish"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function BranchNetworkPage() {
  const { user, center, network: authNetwork } = useAuth();

  const [network, setNetwork] = React.useState<CenterNetwork | null>(authNetwork);
  const [branches, setBranches] = React.useState<Center[]>([]);
  const [hqCenter, setHqCenter] = React.useState<Center | null>(null);
  const [loadingBranches, setLoadingBranches] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [initLoading, setInitLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Keep network in sync with auth
  React.useEffect(() => { setNetwork(authNetwork); }, [authNetwork]);

  // Load branches when network is available
  React.useEffect(() => {
    if (!network) return;
    setLoadingBranches(true);
    Promise.all([
      firestoreRepository.getNetworkBranches(network.id),
      firestoreRepository.getCenter(network.headquartersCenterId),
    ]).then(([brs, hq]) => {
      setBranches(brs);
      setHqCenter(hq);
    }).finally(() => setLoadingBranches(false));
  }, [network]);

  const handleInitNetwork = async () => {
    if (!user || !center) return;
    setInitLoading(true);
    setError(null);
    try {
      const net = await firestoreRepository.createNetwork({
        name: `${center.name} Network`,
        ownerId: user.id,
        headquartersCenterId: center.id,
      });
      setNetwork(net);
      setHqCenter(center);
      setBranches([]);
    } catch (err: any) {
      setError(err?.message ?? "Xato yuz berdi");
    } finally {
      setInitLoading(false);
    }
  };

  const handleBranchCreated = (branch: Center) => {
    setBranches(prev => [...prev, branch]);
    setShowCreateModal(false);
    // Update network's branchIds list locally
    if (network) {
      setNetwork({ ...network, branchIds: [...network.branchIds, branch.id] });
    }
  };

  const handleRemoveBranch = async (branchId: string) => {
    if (!network) return;
    if (!window.confirm("Bu filialni tarmoqdan olib tashlamoqchimisiz?")) return;
    try {
      await firestoreRepository.removeBranchFromNetwork(network.id, branchId);
      setBranches(prev => prev.filter(b => b.id !== branchId));
      setNetwork({ ...network, branchIds: network.branchIds.filter(id => id !== branchId) });
    } catch (err: any) {
      setError(err?.message ?? "Xato yuz berdi");
    }
  };

  // ── Guard: only owner of HQ ──────────────────────────────────────────────
  if (user?.role !== "owner") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-white/20" />
        <p className="text-white/40">Bu sahifa faqat markaz egasi uchun mavjud.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Filiallar Tarmog'i</h1>
            <p className="mt-1 text-sm text-white/45">
              Barcha filiallarni bitta paneldan boshqaring
            </p>
          </div>
          {network && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Filial qo'shish
            </Button>
          )}
        </div>
      </motion.div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* No network yet */}
      {!network && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-10 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
              <GitBranch className="h-8 w-8 text-brand-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Tarmoq hali yo'q</h2>
            <p className="text-sm text-white/45 max-w-sm mx-auto mb-6">
              Filiallar tarmog'ini yaratib, bir nechta o'quv markazlarini bitta hisobdan boshqaring.
              Har bir filial o'zining alohida subdomeni va jamoasiga ega bo'ladi.
            </p>
            <div className="mb-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[
                { icon: Building2, label: "Bosh markaz (HQ)" },
                { icon: GitBranch, label: "Filiallar" },
                { icon: Users, label: "Alohida jamoalar" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white/40" />
                  </div>
                  <span className="text-[11px] text-white/40 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
            <Button loading={initLoading} onClick={handleInitNetwork}>
              <GitBranch className="mr-2 h-4 w-4" />
              Tarmoqni boshlash
            </Button>
          </GlassCard>
        </motion.div>
      )}

      {/* Network overview */}
      {network && (
        <>
          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: "Jami filiallar", value: network.branchIds.length + 1, icon: GitBranch, color: "text-brand-400" },
              { label: "Tarmoq nomi", value: network.name, icon: Building2, color: "text-purple-400" },
              { label: "Tashkil etilgan", value: new Date(network.createdAt).toLocaleDateString("uz-Latn"), icon: CheckCircle2, color: "text-emerald-400" },
            ].map(({ label, value, icon: Icon, color }) => (
              <GlassCard key={label} className="p-4">
                <div className={cn("mb-2", color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/40 mt-0.5">{label}</div>
              </GlassCard>
            ))}
          </motion.div>

          {/* Centers list */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              Barcha markazlar
            </h2>

            {loadingBranches ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* HQ card */}
                {hqCenter && <BranchCard branch={hqCenter} isHQ={true} branchIndex={0} />}
                {/* Branch cards */}
                {branches.map((branch, idx) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    isHQ={false}
                    branchIndex={idx + 1}
                    onRemove={handleRemoveBranch}
                  />
                ))}
                {branches.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/30">
                    Hali filiallar yo'q. "Filial qo'shish" tugmasini bosing.
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Create Branch Modal */}
      {showCreateModal && network && (
        <CreateBranchModal
          networkId={network.id}
          currency={center?.currency ?? "USD"}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBranchCreated}
        />
      )}
    </div>
  );
}
