import * as React from "react";
import { Wallet, Plus, CheckCircle2, Clock, AlertCircle, Trash2, GraduationCap, Coins } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { useI18n } from "../../i18n/I18nContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { formatMoney, cn } from "../../lib/utils";
import { Payment, PaymentStatus, PaymentType } from "../../types";

const STATUS_BADGE: Record<PaymentStatus, "success" | "warning" | "danger"> = {
  paid: "success",
  pending: "warning",
  overdue: "danger",
};

const schema = z.object({
  studentId: z.string().min(1),
  type: z.enum(["tuition", "registration", "material", "other"]),
  amount: z.coerce.number().min(1),
  dueDate: z.string().min(1),
  note: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FinancePage() {
  const { t } = useI18n();
  const { center } = useAuth();
  const data = useCenterData();
  const currency = center?.currency ?? "USD";

  const TYPE_LABELS: Record<PaymentType, string> = {
    tuition: t("finance.type.tuition"),
    registration: t("finance.type.registration"),
    material: t("finance.type.material"),
    other: t("finance.type.other"),
  };

  const STATUS_LABELS: Record<PaymentStatus, string> = {
    paid: t("finance.status.paid"),
    pending: t("finance.status.pending"),
    overdue: t("finance.status.overdue"),
  };

  const FILTERS: { key: PaymentStatus | "all"; label: string }[] = [
    { key: "all", label: t("finance.filter.all") },
    { key: "paid", label: t("finance.status.paid") },
    { key: "pending", label: t("finance.status.pending") },
    { key: "overdue", label: t("finance.status.overdue") },
  ];

  const [filter, setFilter] = React.useState<PaymentStatus | "all">("all");
  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Realtime: useCenterData subscribes via onSnapshot, so data.payments is always live.
  const payments = data.payments;

  // ── KPIs ──
  const kpis = React.useMemo(() => {
    const sum = (ps: Payment[]) => ps.reduce((a, p) => a + p.amount, 0);
    return {
      billed: sum(payments),
      paid: sum(payments.filter(p => p.status === "paid")),
      pending: sum(payments.filter(p => p.status === "pending")),
      overdue: sum(payments.filter(p => p.status === "overdue")),
    };
  }, [payments]);

  const filtered = filter === "all" ? payments : payments.filter(p => p.status === filter);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { studentId: "", type: "tuition", amount: 0, dueDate: today(), note: "" },
  });

  const onAdd = async (values: FormValues) => {
    if (!center) return;
    setSaving(true);
    try {
      await repo.createPayment({
        centerId: center.id,
        studentId: values.studentId,
        type: values.type,
        amount: values.amount,
        currency,
        status: "pending",
        dueDate: values.dueDate,
        note: values.note || undefined,
        createdAt: new Date().toISOString(),
      });
      setShowModal(false);
      reset({ studentId: "", type: "tuition", amount: 0, dueDate: today(), note: "" });
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (p: Payment) => {
    if (!center) return;
    setBusyId(p.id);
    try {
      await repo.updatePayment(center.id, p.id, { status: "paid", paidDate: today() });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p: Payment) => {
    if (!center) return;
    setBusyId(p.id);
    try {
      await repo.deletePayment(center.id, p.id);
    } finally {
      setBusyId(null);
    }
  };

  const studentName = (id: string) => data.students.find(s => s.id === id)?.name ?? t("finance.studentFallback");
  const studentColor = (id: string) => data.students.find(s => s.id === id)?.avatarColor ?? "#3b6bff";

  return (
    <div>
      <PageHeader
        title={t("finance.title")}
        subtitle={t("finance.subtitle")}
        actions={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" /> {t("finance.newPayment")}
          </Button>
        }
      />

      {/* KPIs */}
      <Stagger className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("finance.kpi.billed")}  value={formatMoney(kpis.billed, currency)}  icon={Coins}        accent="#3b6bff" />
        <StatCard label={t("finance.kpi.paid")}     value={formatMoney(kpis.paid, currency)}    icon={CheckCircle2} accent="#10b981" />
        <StatCard label={t("finance.kpi.pending")}  value={formatMoney(kpis.pending, currency)} icon={Clock}        accent="#f59e0b" />
        <StatCard label={t("finance.kpi.overdue")}  value={formatMoney(kpis.overdue, currency)} icon={AlertCircle}  accent="#ef4444" />
      </Stagger>

      <GlassCard className="p-5">
        {/* Filters */}
        <div className="mb-5 flex w-fit rounded-2xl bg-white/[0.03] p-1">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                filter === f.key ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {data.loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="mx-auto mb-3 h-10 w-10 text-white/20" />
            <p className="text-sm font-medium text-white/50">
              {filter === "all" ? t("finance.empty.all") : t("finance.empty.category")}
            </p>
            {filter === "all" && (
              <p className="mt-1 text-xs text-white/30">{t("finance.empty.hint")}</p>
            )}
          </div>
        ) : (
          <Stagger className="space-y-2">
            {filtered.map(p => (
              <FadeItem key={p.id}>
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <Avatar name={studentName(p.studentId)} color={studentColor(p.studentId)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{studentName(p.studentId)}</p>
                    <p className="text-xs text-white/40">
                      {TYPE_LABELS[p.type]} · {t("finance.dueUntil")} {p.dueDate}
                      {p.note ? ` · ${p.note}` : ""}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold text-white">
                    {formatMoney(p.amount, p.currency)}
                  </p>

                  <Badge variant={STATUS_BADGE[p.status]}>{STATUS_LABELS[p.status]}</Badge>

                  <div className="flex shrink-0 items-center gap-1">
                    {p.status !== "paid" && (
                      <button
                        onClick={() => markPaid(p)}
                        disabled={busyId === p.id}
                        title={t("finance.action.markPaid")}
                        className="grid h-8 w-8 place-items-center rounded-xl text-white/40 transition hover:bg-emerald-500/15 hover:text-emerald-400 disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => remove(p)}
                      disabled={busyId === p.id}
                      title={t("finance.action.delete")}
                      className="grid h-8 w-8 place-items-center rounded-xl text-white/40 transition hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </FadeItem>
            ))}
          </Stagger>
        )}
      </GlassCard>

      {/* Add payment modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={t("finance.modal.title")} description={t("finance.modal.description")}>
        <form onSubmit={handleSubmit(onAdd)} className="mt-2 space-y-4">
          <Field label={t("finance.field.student")} error={errors.studentId ? t("finance.error.student") : undefined}>
            <select
              {...register("studentId")}
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-brand-400/60 focus:bg-white/[0.06]"
            >
              <option value="">{t("finance.field.studentPlaceholder")}</option>
              {data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("finance.field.type")} error={errors.type?.message}>
              <select
                {...register("type")}
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-brand-400/60 focus:bg-white/[0.06]"
              >
                <option value="tuition">{t("finance.type.tuition")}</option>
                <option value="registration">{t("finance.type.registration")}</option>
                <option value="material">{t("finance.type.material")}</option>
                <option value="other">{t("finance.type.other")}</option>
              </select>
            </Field>
            <Field label={t("finance.field.amount")} error={errors.amount ? t("finance.error.amount") : undefined}>
              <Input icon={<Coins className="h-4 w-4" />} type="number" min={0} {...register("amount")} />
            </Field>
          </div>

          <Field label={t("finance.field.dueDate")} error={errors.dueDate ? t("finance.error.dueDate") : undefined}>
            <Input type="date" {...register("dueDate")} />
          </Field>

          <Field label={t("finance.field.note")} error={errors.note?.message}>
            <Input icon={<GraduationCap className="h-4 w-4" />} placeholder={t("finance.field.notePlaceholder")} {...register("note")} />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>{t("finance.action.cancel")}</Button>
            <Button type="submit" loading={saving}>{t("finance.action.submit")}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
