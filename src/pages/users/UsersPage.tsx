import * as React from "react";
import {
  Search, Phone, Key, Calendar, Shield,
  LayoutGrid, List, UserPlus, Lock, Eye, EyeOff,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { secondaryAuth } from "../../lib/firebase";
import { useCenterData } from "../../hooks/useCenterData";
import { useAuth } from "../../context/AuthContext";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Role } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { cn } from "../../lib/utils";

type SortField = "createdAt" | "name" | "birthDate";
type SortDirection = "asc" | "desc";
type ViewMode = "cards" | "table";

const STORAGE_KEY = "users_page_view_mode";

function useStoredViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = React.useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored === "table" || stored === "cards") ? stored : "cards";
  });
  const update = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(STORAGE_KEY, m);
  };
  return [mode, update];
}

const ROLE_COLORS: Record<Role, string> = {
  owner:         "bg-amber-500/20 text-amber-400",
  director:      "bg-purple-500/20 text-purple-400",
  administrator: "bg-sky-500/20 text-sky-400",
  teacher:       "bg-emerald-500/20 text-emerald-400",
  student:       "bg-brand-500/20 text-brand-400",
  parent:        "bg-rose-500/20 text-rose-400",
};

const AVATAR_COLORS = ["#3b6bff","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#be185d","#65a30d"];
const pickColor = (id: string) =>
  AVATAR_COLORS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

type ParentMode = "none" | "existing" | "new";

const addSchema = z.object({
  role:            z.enum(["student","administrator","director"] as const),
  name:            z.string().min(2, "Мин. 2 символа"),
  username:        z.string().min(3, "Мин. 3 символа").regex(/^[a-z0-9_]+$/, "Только строчные, цифры, _"),
  phone:           z.string().min(7, "Введите номер телефона"),
  password:        z.string().min(6, "Мин. 6 символов"),
  confirmPassword: z.string(),
  birthDate:       z.string().optional(),
  // parent fields (only relevant when role === "student")
  parentMode:        z.enum(["none","existing","new"]).optional(),
  existingParentId:  z.string().optional(),
  parentName:        z.string().optional(),
  parentUsername:    z.string().optional(),
  parentPhone:       z.string().optional(),
  parentPassword:    z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
}).refine(d => {
  if (d.role === "student" && d.parentMode === "existing") return !!d.existingParentId;
  return true;
}, { message: "Выберите родителя", path: ["existingParentId"] })
.refine(d => {
  if (d.role === "student" && d.parentMode === "new") return !!d.parentName && d.parentName.length >= 2;
  return true;
}, { message: "Мин. 2 символа", path: ["parentName"] })
.refine(d => {
  if (d.role === "student" && d.parentMode === "new") return !!d.parentUsername && /^[a-z0-9_]+$/.test(d.parentUsername);
  return true;
}, { message: "Только строчные, цифры, _", path: ["parentUsername"] })
.refine(d => {
  if (d.role === "student" && d.parentMode === "new") return !!d.parentPhone && d.parentPhone.length >= 7;
  return true;
}, { message: "Введите номер", path: ["parentPhone"] })
.refine(d => {
  if (d.role === "student" && d.parentMode === "new") return !!d.parentPassword && d.parentPassword.length >= 6;
  return true;
}, { message: "Мин. 6 символов", path: ["parentPassword"] });

type AddFormValues = z.infer<typeof addSchema>;

export function UsersPage() {
  const { t } = useI18n();
  const { center } = useAuth();
  const data = useCenterData();
  const [query, setQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<Role | "all">("all");
  const [sortField, setSortField] = React.useState<SortField>("createdAt");
  const [sortDir, setSortDir] = React.useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useStoredViewMode();

  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPwd, setShowPwd] = React.useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      role: "student", name: "", username: "", phone: "", password: "", confirmPassword: "", birthDate: "",
      parentMode: "none", existingParentId: "", parentName: "", parentUsername: "", parentPhone: "", parentPassword: "",
    },
  });
  const selectedRole = watch("role") as string;
  const parentMode = watch("parentMode") as ParentMode | undefined;

  const existingParents = React.useMemo(
    () => data.users.filter(u => u.role === "parent"),
    [data.users]
  );

  const tabs: { value: Role | "all"; label: string; count: number }[] = React.useMemo(() => [
    { value: "all",           label: "Все",            count: data.users.length },
    { value: "student",       label: "Студенты",       count: data.users.filter(u => u.role === "student").length },
    { value: "teacher",       label: "Учителя",        count: data.users.filter(u => u.role === "teacher").length },
    { value: "parent",        label: "Родители",       count: data.users.filter(u => u.role === "parent").length },
    { value: "administrator", label: "Администраторы", count: data.users.filter(u => u.role === "administrator").length },
    { value: "director",      label: "Директора",      count: data.users.filter(u => u.role === "director").length },
  ], [data.users]);

  const filtered = React.useMemo(() => {
    let list = [...data.users];
    if (activeTab !== "all") {
      list = list.filter(u => u.role === activeTab);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.username && u.username.includes(q))
      );
    }
    list.sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortField === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === "createdAt") {
        aVal = a.createdAt ?? "0000-00-00";
        bVal = b.createdAt ?? "0000-00-00";
      } else if (sortField === "birthDate") {
        aVal = a.birthDate ?? "9999-99-99";
        bVal = b.birthDate ?? "9999-99-99";
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [data.users, activeTab, query, sortField, sortDir]);

  const closeModal = () => {
    setShowModal(false);
    setServerError(null);
    reset();
    setShowPwd(false);
  };

  const onAdd = async (values: AddFormValues) => {
    if (!center) return;
    setSaving(true);
    setServerError(null);
    try {
      const username = values.username.trim().toLowerCase();

      // 1. Check uniqueness
      const existing = await repo.getUserByLogin(username);
      if (existing) {
        setServerError(`Пользователь с логином «${username}» уже существует.`);
        return;
      }

      // 2. Create Firebase Auth account (using secondary app so admin stays logged in)
      const roleDomain = values.role; // e.g. "teacher", "parent"
      const fakeEmail = `${username}@ilmoz.${roleDomain}`;
      const cred = await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, values.password);
      const uid = cred.user.uid;
      await secondaryAuth.signOut();

      const avatarColor = pickColor(values.name + uid);

      // 3. Create user profile
      await repo.createUser({
        id: uid,
        centerId: center.id,
        name: values.name,
        email: fakeEmail,
        username,
        phone: values.phone,
        role: values.role,
        avatarColor,
        phoneVerified: false,
        birthDate: values.birthDate || undefined,
      });

      // 4. If student — create student record + handle parent
      if (values.role === "student") {
        let finalParentId: string | undefined;

        if (values.parentMode === "existing" && values.existingParentId) {
          finalParentId = values.existingParentId;
        } else if (values.parentMode === "new") {
          const pUsername = values.parentUsername!.trim().toLowerCase();
          const pExisting = await repo.getUserByLogin(pUsername);
          if (pExisting) {
            setServerError(`Родитель с логином «${pUsername}» уже существует.`);
            setSaving(false);
            return;
          }
          const pCred = await createUserWithEmailAndPassword(
            secondaryAuth, `${pUsername}@ilmoz.parent`, values.parentPassword!
          );
          const pUid = pCred.user.uid;
          await secondaryAuth.signOut();
          const pAvatar = pickColor(values.parentName! + pUid);
          await repo.createUser({
            id: pUid,
            centerId: center.id,
            name: values.parentName!,
            email: `${pUsername}@ilmoz.parent`,
            username: pUsername,
            phone: values.parentPhone,
            role: "parent",
            avatarColor: pAvatar,
            phoneVerified: false,
          });
          finalParentId = pUid;
        }

        await repo.createStudent({
          id: uid,
          centerId: center.id,
          name: values.name,
          phone: values.phone,
          parentId: finalParentId,
          groupIds: [],
          avatarColor,
          birthDate: values.birthDate || undefined,
        });
      }

      closeModal();
    } catch (err: any) {
      const code: string = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setServerError(`Логин «${values.username}» уже занят.`);
      } else {
        setServerError(err?.message ?? "Ошибка создания аккаунта.");
      }
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (s?: string) =>
    s ? new Date(s).toLocaleDateString("ru-RU") : "—";

  return (
    <div>
      <PageHeader
        title={t("nav.users")}
        subtitle={`${filtered.length} пользователей`}
        actions={
          <Button size="sm" onClick={() => setShowModal(true)}>
            <UserPlus className="h-4 w-4" /> Добавить
          </Button>
        }
      />

      {/* ── Tabs ── */}
      <div className="mb-5 flex w-full items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition",
              activeTab === tab.value
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                : "bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white"
            )}
          >
            {tab.label}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              activeTab === tab.value ? "bg-white/20" : "bg-white/[0.07] text-white/50"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="mb-5 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени, телефону..."
            className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/50"
          />
        </div>

        <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 h-10 gap-2">
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value as SortField)}
            className="bg-transparent text-sm text-white outline-none cursor-pointer"
          >
            <option value="createdAt" className="bg-[#0f1115]">Дата регистрации</option>
            <option value="name"      className="bg-[#0f1115]">Имя</option>
            <option value="birthDate" className="bg-[#0f1115]">День рождения</option>
          </select>
          <div className="w-px h-4 bg-white/10" />
          <button
            onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
            title={sortDir === "asc" ? "По возрастанию" : "По убыванию"}
            className="text-sm font-bold text-white/60 hover:text-white transition w-5 text-center"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>

        <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-1 gap-1">
          <button
            onClick={() => setViewMode("cards")}
            title="Карточки"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl transition",
              viewMode === "cards" ? "bg-brand-500/20 text-brand-400" : "text-white/40 hover:text-white/70"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            title="Таблица"
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl transition",
              viewMode === "table" ? "bg-brand-500/20 text-brand-400" : "text-white/40 hover:text-white/70"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Cards View ── */}
      {viewMode === "cards" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(u => (
            <GlassCard key={u.id} interactive className="p-4">
              <div className="flex items-start gap-4">
                <Avatar name={u.name} color={u.avatarColor} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{u.name}</p>
                  <span className={cn("mt-1 inline-block rounded-xl px-2 py-0.5 text-[11px] font-semibold", ROLE_COLORS[u.role])}>
                    {t(`role.${u.role}`)}
                  </span>
                  <div className="mt-2 space-y-1">
                    {u.username && (
                      <p className="flex items-center gap-1.5 text-xs text-white/45">
                        <Key className="h-3 w-3 shrink-0" /> {u.username}
                      </p>
                    )}
                    {u.phone && (
                      <p className="flex items-center gap-1.5 text-xs text-white/45">
                        <Phone className="h-3 w-3 shrink-0" /> {u.phone}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/30">
                    {u.createdAt && (
                      <span className="flex items-center gap-1" title="Дата регистрации">
                        <Shield className="h-3 w-3" /> {fmtDate(u.createdAt)}
                      </span>
                    )}
                    {u.birthDate && (
                      <span className="flex items-center gap-1" title="День рождения">
                        <Calendar className="h-3 w-3" /> {fmtDate(u.birthDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-white/40">Ничего не найдено</div>
          )}
        </div>
      )}

      {/* ── Table View ── */}
      {viewMode === "table" && (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Пользователь</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Роль</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden sm:table-cell">Телефон</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Логин</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">День рождения</th>
                  <th className="px-4 py-3.5 text-left text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Регистрация</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map(u => (
                  <tr key={u.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} color={u.avatarColor} size="sm" />
                        <span className="font-medium text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("rounded-xl px-2.5 py-1 text-[11px] font-semibold", ROLE_COLORS[u.role])}>
                        {t(`role.${u.role}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white/50 hidden sm:table-cell">{u.phone ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/50 hidden md:table-cell">
                      {u.username ? <span className="flex items-center gap-1"><Key className="h-3 w-3" /> {u.username}</span> : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-white/50 hidden lg:table-cell">{fmtDate(u.birthDate)}</td>
                    <td className="px-4 py-3.5 text-white/50 hidden lg:table-cell">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-white/40">Ничего не найдено</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* ── Add User Modal ── */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="Добавить пользователя"
        description="Новый аккаунт будет создан в Firebase Auth."
      >
        <form onSubmit={handleSubmit(onAdd)} className="mt-2 space-y-4">
          {serverError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {serverError}
            </div>
          )}

          {/* Role selector — includes Student now */}
          <Field label="Роль">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                { value: "student",       label: "Студент" },
                { value: "administrator", label: "Администратор" },
                { value: "director",      label: "Директор" },
              ].map(r => (
                <label
                  key={r.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border p-2.5 text-[11px] font-semibold transition",
                    selectedRole === r.value
                      ? `${ROLE_COLORS[r.value as Role] ?? "bg-brand-500/20 text-brand-400"} border-current`
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20"
                  )}
                >
                  <input type="radio" value={r.value} {...register("role")} className="sr-only" />
                  {r.label}
                </label>
              ))}
            </div>
          </Field>

          {/* Name */}
          <Field label="Имя и фамилия" error={errors.name?.message}>
            <Input
              autoFocus
              placeholder="Азиз Каримов"
              {...register("name")}
            />
          </Field>

          {/* Username + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Логин" error={errors.username?.message}>
              <Input
                icon={<Key className="h-4 w-4" />}
                type="text"
                autoComplete="off"
                placeholder="aziz_k"
                {...register("username")}
              />
            </Field>
            <Field label="Телефон" error={errors.phone?.message}>
              <Input
                icon={<Phone className="h-4 w-4" />}
                type="tel"
                placeholder="+998 90 ..."
                {...register("phone")}
              />
            </Field>
          </div>

          {/* Birthday */}
          <Field label="Дата рождения (необяз.)" error={errors.birthDate?.message}>
            <Input
              icon={<Calendar className="h-4 w-4" />}
              type="date"
              {...register("birthDate")}
            />
          </Field>

          {/* Password */}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

          {/* ── Parent section — only for students ── */}
          {selectedRole === "student" && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-4">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Родитель</p>

              {/* Mode toggle */}
              <div className="flex gap-2">
                {([
                  { value: "none",     label: "Без родителя" },
                  { value: "existing", label: "Выбрать из базы" },
                  { value: "new",      label: "Создать нового" },
                ] as { value: ParentMode; label: string }[]).map(opt => (
                  <label
                    key={opt.value}
                    className={cn(
                      "flex-1 cursor-pointer rounded-xl border px-2 py-2 text-center text-xs font-medium transition",
                      parentMode === opt.value
                        ? "border-rose-400/50 bg-rose-500/15 text-rose-300"
                        : "border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20"
                    )}
                  >
                    <input type="radio" value={opt.value} {...register("parentMode")} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>

              {/* Select existing parent */}
              {parentMode === "existing" && (
                <Field label="Выбрать родителя" error={errors.existingParentId?.message}>
                  <select
                    {...register("existingParentId")}
                    className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none transition focus:border-brand-400/60"
                  >
                    <option value="" className="bg-[#0f1115]">— выберите —</option>
                    {existingParents.map(p => (
                      <option key={p.id} value={p.id} className="bg-[#0f1115]">
                        {p.name}{p.phone ? ` · ${p.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {/* Create new parent inline */}
              {parentMode === "new" && (
                <div className="space-y-3 border-t border-white/[0.08] pt-3">
                  <Field label="Имя родителя" error={errors.parentName?.message}>
                    <Input placeholder="Имя и фамилия" {...register("parentName")} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Логин родителя" error={errors.parentUsername?.message}>
                      <Input
                        icon={<Key className="h-4 w-4" />}
                        type="text"
                        autoComplete="off"
                        placeholder="parent_login"
                        {...register("parentUsername")}
                      />
                    </Field>
                    <Field label="Телефон" error={errors.parentPhone?.message}>
                      <Input
                        icon={<Phone className="h-4 w-4" />}
                        type="tel"
                        placeholder="+998 ..."
                        {...register("parentPhone")}
                      />
                    </Field>
                  </div>
                  <Field label="Пароль родителя" error={errors.parentPassword?.message}>
                    <Input
                      icon={<Lock className="h-4 w-4" />}
                      type={showPwd ? "text" : "password"}
                      placeholder="Мин. 6 символов"
                      {...register("parentPassword")}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" type="button" onClick={closeModal}>Отмена</Button>
            <Button type="submit" loading={saving}>
              <UserPlus className="h-4 w-4" /> Создать
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
