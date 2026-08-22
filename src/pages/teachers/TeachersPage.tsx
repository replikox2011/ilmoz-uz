import * as React from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Phone, Mail, GraduationCap, Users, User as UserIcon, Key } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { canEditCenter } from "../../lib/access";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { User as UserType } from "../../types";
import { useI18n } from "../../i18n/I18nContext";

const AVATAR_COLORS = ["#3b6bff", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2", "#be185d", "#65a30d"];
const pickColor = (id: string) => AVATAR_COLORS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const makeSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(2, t("teachers.errorName")),
    username: z.string().min(3, t("teachers.errorUsernameMin")),
    email: z.string().email(t("teachers.errorEmail")).optional().or(z.literal("")),
    phone: z.string().optional(),
  });
type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export function TeachersPage() {
  const { t } = useI18n();
  const { center, user } = useAuth();
  const data = useCenterData();
  const canManage = !!user && canEditCenter(user.role);
  const [query, setQuery] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  // Realtime: useCenterData subscribes via onSnapshot, so data.teachers is always live.
  const teachers = data.teachers;

  const filtered = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(query.toLowerCase()) ||
      teacher.username?.toLowerCase().includes(query.toLowerCase())
  );

  const schema = React.useMemo(() => makeSchema(t), [t]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", username: "", email: "", phone: "" },
  });

  const onAdd = async (values: FormValues) => {
    if (!center) return;
    setSaving(true);
    setFormError("");
    try {
      // Check if username already exists
      const usernameLower = values.username.trim().toLowerCase();
      const existing = await repo.getUserByLogin(usernameLower);
      if (existing) {
        setFormError(t("teachers.errorUsernameExists"));
        setSaving(false);
        return;
      }

      await repo.createUser({
        centerId: center.id,
        name: values.name,
        username: usernameLower,
        email: values.email || undefined,
        phone: values.phone || undefined,
        role: "teacher",
        avatarColor: pickColor(values.name + Date.now()),
      });

      // No manual state update — the onSnapshot listener in useCenterData
      // picks up the new teacher instantly.
      setShowModal(false);
      reset();
    } catch (err: any) {
      setFormError(t("teachers.errorCreate") + " " + (err?.message ?? ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("teachers.title")}
        subtitle={`${teachers.length} ${t("teachers.subtitleSuffix")}`}
        actions={
          canManage ? (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <UserPlus className="h-4 w-4" /> {t("teachers.add")}
            </Button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="mb-5 relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("teachers.searchPlaceholder")}
          className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/50"
        />
      </div>

      {data.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm font-medium text-white/50">
            {query ? t("teachers.emptyNotFound") : t("teachers.emptyNone")}
          </p>
          {!query && (
            <p className="mt-1 text-xs text-white/30">
              {t("teachers.emptyHint")}
            </p>
          )}
        </GlassCard>
      ) : (
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((teacher) => {
            // Count groups assigned to this teacher
            const groupCount = data.groups.filter((g) => g.teacherId === teacher.id).length;
            return (
              <FadeItem key={teacher.id}>
                <TeacherCard teacher={teacher} groupCount={groupCount} t={t} />
              </FadeItem>
            );
          })}
        </Stagger>
      )}

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setFormError("");
        }}
        title={t("teachers.modalTitle")}
        description={t("teachers.modalDescription")}
      >
        <form onSubmit={handleSubmit(onAdd)} className="mt-2 space-y-4">
          {formError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {formError}
            </div>
          )}

          <Field label={t("teachers.fieldName")} error={errors.name?.message}>
            <Input icon={<UserIcon className="h-4 w-4" />} placeholder={t("teachers.placeholderName")} autoFocus {...register("name")} required />
          </Field>

          <Field label={t("teachers.fieldUsername")} error={errors.username?.message}>
            <Input icon={<Key className="h-4 w-4" />} placeholder={t("teachers.placeholderUsername")} {...register("username")} required />
          </Field>

          <Field label={t("teachers.fieldEmail")} error={errors.email?.message}>
            <Input icon={<Mail className="h-4 w-4" />} type="email" placeholder={t("teachers.placeholderEmail")} {...register("email")} />
          </Field>

          <Field label={t("teachers.fieldPhone")} error={errors.phone?.message}>
            <Input icon={<Phone className="h-4 w-4" />} type="tel" placeholder={t("teachers.placeholderPhone")} {...register("phone")} />
          </Field>

          <div className="flex justify-end gap-2 pt-1 border-t border-white/5">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setShowModal(false);
                setFormError("");
              }}
            >
              {t("teachers.cancel")}
            </Button>
            <Button type="submit" loading={saving}>
              {t("teachers.submit")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TeacherCard({ teacher, groupCount, t }: { teacher: UserType; groupCount: number; t: (key: string) => string }) {
  const navigate = useNavigate();
  return (
    <GlassCard
      interactive
      onClick={() => navigate(`/teachers/${teacher.username || teacher.id}`)}
      className="p-4 cursor-pointer group"
    >
      <div className="flex items-start gap-3">
        <Avatar name={teacher.name} color={teacher.avatarColor} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">{teacher.name}</p>
          <p className="text-xs text-white/35 truncate">@{teacher.username}</p>

          <div className="mt-2 space-y-1">
            {teacher.phone && (
              <p className="flex items-center gap-1 text-[11px] text-white/45">
                <Phone className="h-3.5 w-3.5 shrink-0" /> {teacher.phone}
              </p>
            )}
            {teacher.email && (
              <p className="flex items-center gap-1 text-[11px] text-white/45">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {teacher.email}
              </p>
            )}
          </div>

          <div className="mt-3">
            <Badge variant={groupCount > 0 ? "brand" : "neutral"}>
              <Users className="h-3 w-3" />
              {groupCount > 0 ? `${groupCount} ${t("teachers.groupsSuffix")}` : t("teachers.noActiveGroups")}
            </Badge>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
