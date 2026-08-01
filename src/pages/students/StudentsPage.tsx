import * as React from "react";
import { UserPlus, Search, Phone, Users, GraduationCap, Key, Lock, LayoutGrid, List, TableProperties, Trash2 } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { secondaryAuth } from "../../lib/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Student } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { useViewMode } from "../../hooks/useViewMode";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { isStaff } from "../../lib/access";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";
import { StudentGridCard, StudentRow, StudentTableRow } from "../dashboard/widgets";

const AVATAR_COLORS = ["#3b6bff","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#be185d","#65a30d"];
const pickColor = (id: string) => AVATAR_COLORS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const schema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  username: z.string().min(3, "Минимум 3 символа").regex(/^[a-z0-9_]+$/, "Только строчные буквы, цифры и _"),
  phone: z.string().min(7, "Введите номер телефона"),
  password: z.string().min(6, "Минимум 6 символов"),
  confirmPassword: z.string(),
  birthDate: z.string().optional(),
  parentMode: z.enum(["none", "existing", "new"]),
  existingParentId: z.string().optional(),
  parentName: z.string().optional(),
  parentUsername: z.string().optional(),
  parentPhone: z.string().optional(),
  parentPassword: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
}).refine(d => {
  if (d.parentMode === "existing") return !!d.existingParentId;
  return true;
}, {
  message: "Выберите родителя",
  path: ["existingParentId"],
}).refine(d => {
  if (d.parentMode === "new") return !!d.parentName && d.parentName.length >= 2;
  return true;
}, {
  message: "Минимум 2 символа",
  path: ["parentName"],
}).refine(d => {
  if (d.parentMode === "new") return !!d.parentUsername && /^[a-z0-9_]+$/.test(d.parentUsername);
  return true;
}, {
  message: "Только строчные буквы, цифры и _",
  path: ["parentUsername"],
}).refine(d => {
  if (d.parentMode === "new") return !!d.parentPhone && d.parentPhone.length >= 7;
  return true;
}, {
  message: "Введите номер",
  path: ["parentPhone"],
}).refine(d => {
  if (d.parentMode === "new") return !!d.parentPassword && d.parentPassword.length >= 6;
  return true;
}, {
  message: "Минимум 6 символов",
  path: ["parentPassword"],
});

type FormValues = z.infer<typeof schema>;

export function StudentsPage() {
  const { t } = useI18n();
  const { center, user } = useAuth();
  const data = useCenterData();
  const canManage = !!user && isStaff(user.role);
  const [query, setQuery] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPwd, setShowPwd] = React.useState(false);
  const [viewMode, setViewMode] = useViewMode("students", "grid");

  const [deletingStudent, setDeletingStudent] = React.useState<Student | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDeleteStudent = async () => {
    if (!deletingStudent || !center) return;
    setDeleting(true);
    try {
      await repo.deleteStudent(center.id, deletingStudent.id);
      setDeletingStudent(null);
    } catch (err: any) {
      alert(err?.message ?? "Ошибка при удалении ученика.");
    } finally {
      setDeleting(false);
    }
  };

  // Realtime: useCenterData subscribes via onSnapshot, so data.students is always live.
  const students = data.students;

  const filtered = students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

  const parents = React.useMemo(() => data.users.filter(u => u.role === "parent"), [data.users]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", username: "", phone: "", password: "", confirmPassword: "", birthDate: "", parentMode: "none" },
  });

  const parentMode = watch("parentMode");

  const onAdd = async (values: FormValues) => {
    if (!center) return;
    setSaving(true);
    setServerError(null);
    try {
      const username = values.username.trim().toLowerCase();

      // 1. Check username uniqueness
      const existing = await repo.getUserByLogin(username);
      if (existing) {
        setServerError(`Пользователь с именем «${username}» уже существует.`);
        setSaving(false);
        return;
      }

      let finalParentId = values.parentMode === "existing" ? values.existingParentId : undefined;

      // 2. Handle parent creation if "new"
      if (values.parentMode === "new") {
        const pUsername = values.parentUsername!.trim().toLowerCase();
        const pExisting = await repo.getUserByLogin(pUsername);
        if (pExisting) {
          setServerError(`Родитель с логином «${pUsername}» уже существует.`);
          setSaving(false);
          return;
        }

        const pFakeEmail = `${pUsername}@ilmoz.parent`;
        const pCred = await createUserWithEmailAndPassword(secondaryAuth, pFakeEmail, values.parentPassword!);
        const pUid = pCred.user.uid;
        await secondaryAuth.signOut();

        const pAvatar = pickColor(values.parentName! + pUid);

        await repo.createUser({
          id: pUid,
          centerId: center.id,
          name: values.parentName!,
          email: pFakeEmail,
          username: pUsername,
          phone: values.parentPhone,
          role: "parent",
          avatarColor: pAvatar,
          phoneVerified: false,
        });
        finalParentId = pUid;
      }

      // 3. Create Firebase Auth account via secondary app (doesn't sign out the admin)
      const fakeEmail = `${username}@ilmoz.student`;
      const cred = await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, values.password);
      const uid = cred.user.uid;
      await secondaryAuth.signOut();

      const avatarColor = pickColor(values.name + uid);

      // 4. Create userProfile (for login & auth)
      await repo.createUser({
        id: uid,
        centerId: center.id,
        name: values.name,
        email: fakeEmail,
        username,
        phone: values.phone,
        role: "student",
        avatarColor,
        phoneVerified: false,
        ...(values.birthDate ? { birthDate: values.birthDate } : {}),
        ...(finalParentId ? { parentId: finalParentId } : {}),
      });

      // 5. Create student record with same Firebase UID as ID
      await repo.createStudent({
        id: uid,
        centerId: center.id,
        name: values.name,
        phone: values.phone,
        ...(finalParentId ? { parentId: finalParentId } : {}),
        groupIds: [],
        avatarColor,
        ...(values.birthDate ? { birthDate: values.birthDate } : {}),
      });

      // No manual state update — the onSnapshot listener picks up the new student.
      setShowModal(false);
      reset();
    } catch (err: any) {
      const code: string = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setServerError(`Username «${values.username}» уже занят.`);
      } else {
        setServerError(err?.message ?? "Ошибка создания аккаунта.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("students.title")}
        subtitle={`${students.length} ${t("students.subtitleCount")}`}
        actions={
          canManage ? (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <UserPlus className="h-4 w-4" /> {t("students.addStudent")}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("students.searchPlaceholder")}
            className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/50"
          />
        </div>
        <div className="flex rounded-2xl bg-white/[0.03] p-1 ml-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "rounded-xl p-2 transition",
              viewMode === "grid" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80"
            )}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "rounded-xl p-2 transition",
              viewMode === "list" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80"
            )}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "rounded-xl p-2 transition",
              viewMode === "table" ? "bg-white/10 text-white shadow-sm" : "text-white/50 hover:text-white/80"
            )}
            title="Table View"
          >
            <TableProperties className="h-4 w-4" />
          </button>
        </div>
      </div>

      {data.loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm font-medium text-white/50">
            {query ? t("students.emptySearch") : t("students.emptyNone")}
          </p>
          {!query && (
            <p className="mt-1 text-xs text-white/30">{t("students.emptyHint")}</p>
          )}
        </GlassCard>
      ) : (
        <GlassCard className="p-5">
          {viewMode === "grid" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(s => {
                const userRec = data.users.find(u => u.id === s.id);
                return (
                  <StudentGridCard
                    key={s.id}
                    student={s}
                    groupCount={s.groupIds.length}
                    username={userRec?.username}
                    action={canManage ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingStudent(s);
                        }}
                        title="Удалить ученика"
                        className="rounded-xl p-1.5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : undefined}
                  />
                );
              })}
            </div>
          )}
          {viewMode === "list" && (
            <Stagger className="space-y-3">
              {filtered.map(s => {
                const userRec = data.users.find(u => u.id === s.id);
                return (
                  <FadeItem key={s.id}>
                    <StudentRow
                      student={s}
                      groupCount={s.groupIds.length}
                      username={userRec?.username}
                      action={canManage ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingStudent(s);
                          }}
                          title="Удалить ученика"
                          className="rounded-xl p-1.5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : undefined}
                    />
                  </FadeItem>
                );
              })}
            </Stagger>
          )}
          {viewMode === "table" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-white/40">
                    <th className="pb-3 px-4 font-medium">{t("students.field.name")}</th>
                    <th className="pb-3 px-4 font-medium">{t("students.field.username")}</th>
                    <th className="pb-3 px-4 font-medium">{t("students.field.phone")}</th>
                    <th className="pb-3 px-4 font-medium">{t("students.field.groups")}</th>
                    {canManage && <th className="pb-3 px-4 font-medium text-right">Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const userRec = data.users.find(u => u.id === s.id);
                    return (
                      <StudentTableRow
                        key={s.id}
                        student={s}
                        groupCount={s.groupIds.length}
                        username={userRec?.username}
                        action={canManage ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingStudent(s);
                            }}
                            title="Удалить ученика"
                            className="rounded-xl p-1.5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : undefined}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        title="Удалить ученика?"
        description={`Вы действительно хотите удалить ученика «${deletingStudent?.name}»? Это действие нельзя отменить.`}
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={() => setDeletingStudent(null)} disabled={deleting}>
            Отмена
          </Button>
          <Button variant="danger" type="button" onClick={handleDeleteStudent} loading={deleting}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Удалить
          </Button>
        </div>
      </Modal>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setServerError(null); reset(); }}
        title={t("students.modalTitle")}
        description="Студент получит аккаунт для входа. При первом входе потребуется подтверждение телефона."
      >
        <form onSubmit={handleSubmit(onAdd)} className="mt-2 space-y-4">
          {serverError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {serverError}
            </div>
          )}

          <Field label={t("students.fieldName")} error={errors.name?.message}>
            <Input
              icon={<GraduationCap className="h-4 w-4" />}
              placeholder={t("students.namePlaceholder")}
              autoFocus
              {...register("name")}
            />
          </Field>

          <Field
            label="Username (для входа)"
            error={errors.username?.message}
          >
            <Input
              icon={<Key className="h-4 w-4" />}
              placeholder="aziz_karimov"
              {...register("username")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("students.fieldPhone")} error={errors.phone?.message}>
              <Input
                icon={<Phone className="h-4 w-4" />}
                type="tel"
                placeholder="+998 90 123 45 67"
                {...register("phone")}
              />
            </Field>

            <Field label="Дата рождения (необяз.)" error={errors.birthDate?.message}>
              <Input
                type="date"
                {...register("birthDate")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Пароль" error={errors.password?.message}>
              <div className="relative">
                <Input
                  icon={<Lock className="h-4 w-4" />}
                  type={showPwd ? "text" : "password"}
                  placeholder="Мин. 6 символов"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35 hover:text-white/70 transition"
                >
                  {showPwd ? "Скрыть" : "Показать"}
                </button>
              </div>
            </Field>

            <Field label="Повторите пароль" error={errors.confirmPassword?.message}>
              <Input
                icon={<Lock className="h-4 w-4" />}
                type={showPwd ? "text" : "password"}
                placeholder="Повторите"
                {...register("confirmPassword")}
              />
            </Field>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
            <Field label="Прикрепить родителя" error={errors.parentMode?.message}>
              <select
                {...register("parentMode")}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50"
              >
                <option value="none">Без родителя</option>
                <option value="existing">Выбрать из базы</option>
                <option value="new">Добавить нового</option>
              </select>
            </Field>

            {parentMode === "existing" && (
              <Field label="Родитель" error={errors.existingParentId?.message}>
                <select
                  {...register("existingParentId")}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50"
                >
                  <option value="">Выберите родителя...</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone || p.username})</option>
                  ))}
                </select>
              </Field>
            )}

            {parentMode === "new" && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <Field label="Имя родителя" error={errors.parentName?.message}>
                  <Input icon={<Users className="h-4 w-4" />} placeholder="Имя" {...register("parentName")} />
                </Field>
                <Field label="Логин родителя" error={errors.parentUsername?.message}>
                  <Input icon={<Key className="h-4 w-4" />} placeholder="login_parent" {...register("parentUsername")} />
                </Field>
                <Field label="Телефон родителя" error={errors.parentPhone?.message}>
                  <Input icon={<Phone className="h-4 w-4" />} type="tel" placeholder="+998 90 ..." {...register("parentPhone")} />
                </Field>
                <Field label="Пароль родителя" error={errors.parentPassword?.message}>
                  <div className="relative">
                    <Input
                      icon={<Lock className="h-4 w-4" />}
                      type={showPwd ? "text" : "password"}
                      placeholder="Мин. 6 символов"
                      {...register("parentPassword")}
                    />
                  </div>
                </Field>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-brand-500/20 bg-brand-500/[0.06] p-3 text-xs text-brand-300/80">
            При первом входе студент подтвердит номер телефона через SMS.
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              type="button"
              onClick={() => { setShowModal(false); setServerError(null); reset(); }}
            >
              {t("students.cancel")}
            </Button>
            <Button type="submit" loading={saving}>
              {t("students.submit")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


