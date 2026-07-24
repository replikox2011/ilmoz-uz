import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, BookMarked, Eye, EyeOff, Trash2, GraduationCap, Pencil, DoorOpen, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { secondaryAuth } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Avatar } from "../../components/ui/Avatar";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { Course, User } from "../../types";
import { cn } from "../../lib/utils";

const AVATAR_COLORS = ["#3b6bff","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#be185d","#65a30d"];
const pickColor = (seed: string) =>
  AVATAR_COLORS[seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const teacherSchema = z.object({
  name:            z.string().min(2, "Мин. 2 символа"),
  username:        z.string().min(3, "Мин. 3 символа").regex(/^[a-z0-9_]+$/, "Только строчные, цифры, _"),
  phone:           z.string().min(7, "Введите номер"),
  password:        z.string().min(6, "Мин. 6 символов"),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});
type TeacherFormValues = z.infer<typeof teacherSchema>;

const COURSE_COLORS = [
  "#3b6bff","#7c3aed","#059669","#d97706",
  "#dc2626","#0891b2","#be185d","#65a30d",
  "#f59e0b","#6366f1","#14b8a6","#f97316",
];

const editSchema = z.object({
  name:        z.string().min(2, "Мин. 2 символа"),
  description: z.string().optional(),
  color:       z.string(),
});
type EditFormValues = z.infer<typeof editSchema>;

export function CourseDetailPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { center } = useAuth();
  const data = useCenterData();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [teachers, setTeachers] = React.useState<User[]>([]);
  const [showModal, setShowModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [showPwd, setShowPwd] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [editColor, setEditColor] = React.useState(COURSE_COLORS[0]);
  const [editRooms, setEditRooms] = React.useState<string[]>([]);
  const [roomInput, setRoomInput] = React.useState("");

  // Resolve course from loaded data
  React.useEffect(() => {
    if (!courseId) return;
    const found = data.courses.find(c => c.id === courseId) ?? null;
    setCourse(found);
  }, [courseId, data.courses]);

  // Teachers for this course = teachers whose groups use this courseId
  React.useEffect(() => {
    if (!courseId) return;
    const teacherIds = new Set(
      data.groups
        .filter(g => g.courseId === courseId)
        .map(g => g.teacherId)
    );
    // Also include teachers linked directly via course.teacherIds
    (course?.teacherIds ?? []).forEach(id => teacherIds.add(id));
    setTeachers(data.teachers.filter(t => teacherIds.has(t.id)));
  }, [courseId, data.groups, data.teachers, course]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { name: "", username: "", phone: "", password: "", confirmPassword: "" },
  });

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    reset: editReset,
    formState: { errors: editErrors },
  } = useForm<EditFormValues>({ resolver: zodResolver(editSchema) });

  const addRoom = () => {
    const value = roomInput.trim();
    if (!value) return;
    setEditRooms(prev => (prev.includes(value) ? prev : [...prev, value]));
    setRoomInput("");
  };

  const removeRoom = (room: string) => {
    setEditRooms(prev => prev.filter(r => r !== room));
  };

  const openEditModal = () => {
    if (!course) return;
    setEditColor(course.color ?? COURSE_COLORS[0]);
    setEditRooms(course.rooms ?? []);
    setRoomInput("");
    editReset({
      name: course.name,
      description: course.description ?? "",
      color: course.color,
    });
    setShowEditModal(true);
  };

  const onEditCourse = async (values: EditFormValues) => {
    if (!center || !courseId || !course) return;
    setEditSaving(true);
    try {
      const patch = {
        name: values.name,
        description: values.description,
        rooms: editRooms,
        color: editColor,
      };
      await repo.updateCourse(center.id, courseId, patch);
      setCourse(prev => prev ? { ...prev, ...patch } : prev);
      setShowEditModal(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  const openModal = () => {
    reset();
    setServerError(null);
    setShowModal(true);
  };

  const onAddTeacher = async (values: TeacherFormValues) => {
    if (!center || !courseId) return;
    setSaving(true);
    setServerError(null);
    try {
      const username = values.username.trim().toLowerCase();

      const existing = await repo.getUserByLogin(username);
      if (existing) {
        setServerError(`Логин «${username}» уже занят.`);
        return;
      }

      const fakeEmail = `${username}@ilmoz.teacher`;
      const cred = await createUserWithEmailAndPassword(secondaryAuth, fakeEmail, values.password);
      const uid = cred.user.uid;
      await secondaryAuth.signOut();

      const avatarColor = pickColor(values.name + uid);

      const newUser = await repo.createUser({
        id: uid,
        centerId: center.id,
        name: values.name,
        email: fakeEmail,
        username,
        phone: values.phone,
        role: "teacher",
        avatarColor,
        phoneVerified: false,
      });

      // Link teacher to course via teacherIds
      const updatedTeacherIds = [...(course?.teacherIds ?? []), uid];
      await repo.updateCourse(center.id, courseId, { teacherIds: updatedTeacherIds });
      setCourse(prev => prev ? { ...prev, teacherIds: updatedTeacherIds } : prev);
      setTeachers(prev => [...prev, newUser]);
      setShowModal(false);
      reset();
    } catch (err: any) {
      const code: string = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setServerError(`Логин «${values.username}» уже занят.`);
      } else {
        setServerError(err?.message ?? "Ошибка. Попробуйте снова.");
      }
    } finally {
      setSaving(false);
    }
  };

  const removeTeacher = async (teacherId: string) => {
    if (!center || !courseId || !course) return;
    const updatedTeacherIds = (course.teacherIds ?? []).filter(id => id !== teacherId);
    await repo.updateCourse(center.id, courseId, { teacherIds: updatedTeacherIds });
    setCourse(prev => prev ? { ...prev, teacherIds: updatedTeacherIds } : prev);
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
  };

  if (data.loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-xl bg-white/[0.04] animate-pulse" />
        <div className="h-32 rounded-3xl bg-white/[0.03] animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-white/40">Курс не найден</p>
        <Button variant="ghost" onClick={() => navigate("/courses")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> К курсам
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate("/courses")}
          className="mb-4 flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
        >
          <ArrowLeft className="h-4 w-4" /> Все курсы
        </button>

        <GlassCard className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
              style={{ backgroundColor: course.color + "25" }}
            >
              <BookMarked className="h-6 w-6" style={{ color: course.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white">{course.name}</h1>
              {course.description && (
                <p className="mt-0.5 text-sm text-white/45">{course.description}</p>
              )}
              {course.rooms && course.rooms.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <DoorOpen className="h-3.5 w-3.5 text-white/35" />
                  {course.rooms.map(room => (
                    <span
                      key={room}
                      className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-xs text-white/60"
                    >
                      {room}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={openEditModal}
              className="rounded-xl p-2 text-white/30 transition hover:bg-white/[0.06] hover:text-white/70"
              title="Редактировать курс"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Teachers section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Преподаватели</h2>
            <p className="text-xs text-white/40">{teachers.length} преподавателей на курсе</p>
          </div>
          <Button size="sm" onClick={openModal}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Добавить
          </Button>
        </div>

        {teachers.length === 0 ? (
          <GlassCard className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04]">
              <GraduationCap className="h-6 w-6 text-white/30" />
            </div>
            <p className="text-sm text-white/40">Нет преподавателей</p>
            <Button size="sm" onClick={openModal}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Добавить преподавателя
            </Button>
          </GlassCard>
        ) : (
          <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teachers.map(teacher => {
              const groupCount = data.groups.filter(
                g => g.courseId === courseId && g.teacherId === teacher.id
              ).length;
              return (
                <FadeItem key={teacher.id}>
                  <GlassCard className="group flex items-center gap-3 p-4">
                    <Avatar name={teacher.name} color={teacher.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{teacher.name}</p>
                      <p className="text-xs text-white/40">
                        @{teacher.username ?? "—"} · {groupCount} групп
                      </p>
                    </div>
                    <button
                      onClick={() => removeTeacher(teacher.id)}
                      className="rounded-lg p-1.5 text-white/20 opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                      title="Открепить от курса"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </GlassCard>
                </FadeItem>
              );
            })}
          </Stagger>
        )}
      </div>

      {/* Edit course modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Настройки курса">
        <form onSubmit={editHandleSubmit(onEditCourse)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Название</label>
            <input
              {...editRegister("name")}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-brand-400/50 placeholder:text-white/30"
              placeholder="Название курса"
            />
            {editErrors.name && <p className="mt-1 text-xs text-red-400">{editErrors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Описание (необязательно)</label>
            <input
              {...editRegister("description")}
              className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-brand-400/50 placeholder:text-white/30"
              placeholder="Краткое описание"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Аудитории (необязательно)</label>
            <div className="flex gap-2">
              <input
                value={roomInput}
                onChange={e => setRoomInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRoom();
                  }
                }}
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition focus:border-brand-400/50 placeholder:text-white/30"
                placeholder="Напр. 400"
              />
              <Button type="button" variant="ghost" size="sm" onClick={addRoom}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {editRooms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {editRooms.map(room => (
                  <span
                    key={room}
                    className="flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-1 text-xs text-white/70"
                  >
                    {room}
                    <button
                      type="button"
                      onClick={() => removeRoom(room)}
                      className="text-white/40 transition hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-white/60">Цвет</label>
            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setEditColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-lg transition-transform hover:scale-110",
                    editColor === c && "ring-2 ring-white/70 ring-offset-2 ring-offset-[#05060a]"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowEditModal(false)}>
              Отмена
            </Button>
            <Button type="submit" loading={editSaving}>
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add teacher modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Добавить преподавателя">
        <form onSubmit={handleSubmit(onAddTeacher)} className="space-y-4">
          <Field label="ФИО" error={errors.name?.message}>
            <Input {...register("name")} placeholder="Азиз Каримов" autoFocus />
          </Field>

          <Field label="Логин (никнейм)" error={errors.username?.message}>
            <Input
              {...register("username")}
              placeholder="aziz_karimov"
              onChange={e => {
                e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                register("username").onChange(e);
              }}
            />
          </Field>

          <Field label="Телефон" error={errors.phone?.message}>
            <Input {...register("phone")} placeholder="+998 90 000 00 00" type="tel" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Пароль" error={errors.password?.message}>
              <div className="relative">
                <Input
                  {...register("password")}
                  type={showPwd ? "text" : "password"}
                  placeholder="Мин. 6 символов"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Повторите пароль" error={errors.confirmPassword?.message}>
              <div className="relative">
                <Input
                  {...register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Повторите"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>

          {serverError && (
            <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {serverError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              Создать преподавателя
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
