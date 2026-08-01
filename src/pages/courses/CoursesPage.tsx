import * as React from "react";
import { useNavigate } from "react-router-dom";
import { BookMarked, Plus, Trash2, ChevronRight, Users, DoorOpen, X, LayoutGrid, List } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input, Field } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { cn } from "../../lib/utils";

const COURSE_COLORS = [
  "#3b6bff", "#7c3aed", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#be185d", "#65a30d",
  "#f59e0b", "#6366f1", "#14b8a6", "#f97316",
];


const schema = z.object({
  name:        z.string().min(2, "Мин. 2 символа"),
  description: z.string().optional(),
  color:       z.string(),
});
type FormValues = z.infer<typeof schema>;

type ViewMode = "cards" | "table";
const STORAGE_KEY = "courses_page_view_mode";

function useStoredViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = React.useState<ViewMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "table" || stored === "cards" ? stored : "cards";
  });
  const update = (m: ViewMode) => {
    setMode(m);
    localStorage.setItem(STORAGE_KEY, m);
  };
  return [mode, update];
}

export function CoursesPage() {
  const { center } = useAuth();
  const data = useCenterData();
  const navigate = useNavigate();

  const [showModal, setShowModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [selectedColor, setSelectedColor] = React.useState(COURSE_COLORS[0]);
  const [rooms, setRooms] = React.useState<string[]>([]);
  const [roomInput, setRoomInput] = React.useState("");
  const [viewMode, setViewMode] = useStoredViewMode();

  // Realtime: useCenterData subscribes via onSnapshot, so data.courses is always live.
  const courses = data.courses;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", color: COURSE_COLORS[0] },
  });

  const addRoom = () => {
    const value = roomInput.trim();
    if (!value) return;
    setRooms(prev => (prev.includes(value) ? prev : [...prev, value]));
    setRoomInput("");
  };

  const removeRoom = (room: string) => {
    setRooms(prev => prev.filter(r => r !== room));
  };

  const openModal = () => {
    setSelectedColor(COURSE_COLORS[0]);
    setRooms([]);
    setRoomInput("");
    reset({ name: "", description: "", color: COURSE_COLORS[0] });
    setShowModal(true);
  };

  const onAdd = async (values: FormValues) => {
    if (!center) return;
    setSaving(true);
    try {
      // Названия аудиторий должны стать реальными документами в centers/{id}/rooms:
      // форма группы выбирает из этой коллекции и хранит roomId для проверки конфликтов.
      // Иначе введённое здесь остаётся просто подписью на карточке курса.
      const existing = new Map(data.rooms.map(r => [r.name.toLowerCase(), r]));
      for (const name of rooms) {
        if (existing.has(name.toLowerCase())) continue;
        await repo.createRoom({ centerId: center.id, name });
      }

      await repo.createCourse({
        centerId: center.id,
        name: values.name,
        description: values.description,
        rooms,
        color: selectedColor,
      });
      setShowModal(false);
      reset();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (!center) return;
    setDeleting(courseId);
    try {
      await repo.deleteCourse(center.id, courseId);
    } finally {
      setDeleting(null);
    }
  };

  const teacherCountForCourse = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    const ids = new Set<string>(course?.teacherIds ?? []);
    data.groups
      .filter(g => g.courseId === courseId)
      .forEach(g => ids.add(g.teacherId));
    return data.teachers.filter(t => ids.has(t.id)).length;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Курсы"
        subtitle={`${courses.length} курс${courses.length === 1 ? "" : courses.length < 5 ? "а" : "ов"}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                title="Карточки"
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition",
                  viewMode === "cards"
                    ? "bg-brand-500/20 text-brand-400"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                title="Таблица"
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition",
                  viewMode === "table"
                    ? "bg-brand-500/20 text-brand-400"
                    : "text-white/40 hover:text-white/70"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={openModal} size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Добавить курс
            </Button>
          </div>
        }
      />

      {data.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 rounded-3xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <GlassCard className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-500/15">
            <BookMarked className="h-7 w-7 text-brand-300" />
          </div>
          <p className="text-white/60">Курсов пока нет</p>
          <Button size="sm" onClick={openModal}>
            <Plus className="h-4 w-4 mr-1.5" /> Добавить первый курс
          </Button>
        </GlassCard>
      ) : viewMode === "cards" ? (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map(course => (
            <FadeItem key={course.id}>
              <button
                onClick={() => navigate(`/courses/${course.id}`)}
                className="group relative w-full text-left"
              >
                <GlassCard className="flex flex-col gap-3 p-5 transition-all duration-200 hover:bg-white/[0.06] hover:scale-[1.01]">
                  {/* Color bar */}
                  <div
                    className="h-1.5 w-12 rounded-full"
                    style={{ backgroundColor: course.color }}
                  />

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-semibold text-white">
                        {course.name}
                      </h3>
                      {course.description && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-white/45">
                          {course.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/25 transition group-hover:text-white/60" />
                  </div>

                  {course.rooms && course.rooms.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <Users className="h-3.5 w-3.5" />
                      <span>{teacherCountForCourse(course.id)} препод.</span>
                    </div>
                    <button
                      onClick={e => onDelete(e, course.id)}
                      disabled={deleting === course.id}
                      className="rounded-lg p-1.5 text-white/20 opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </GlassCard>
              </button>
            </FadeItem>
          ))}
        </Stagger>
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
                    Название
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/40 md:table-cell">
                    Аудитории
                  </th>
                  <th className="hidden px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/40 sm:table-cell">
                    Преподаватели
                  </th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {courses.map(course => (
                  <tr
                    key={course.id}
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="group cursor-pointer transition hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: course.color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {course.name}
                          </p>
                          {course.description && (
                            <p className="truncate text-xs text-white/40">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 md:table-cell">
                      {course.rooms && course.rooms.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {course.rooms.map(room => (
                            <span
                              key={room}
                              className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-xs text-white/60"
                            >
                              {room}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-white/25">—</span>
                      )}
                    </td>
                    <td className="hidden px-5 py-3.5 text-sm text-white/60 sm:table-cell">
                      {teacherCountForCourse(course.id)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={e => onDelete(e, course.id)}
                        disabled={deleting === course.id}
                        className="rounded-lg p-1.5 text-white/20 opacity-0 transition hover:bg-red-500/15 hover:text-red-400 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Новый курс">
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <Field label="Название курса" error={errors.name?.message}>
            <Input
              {...register("name")}
              placeholder="Английский язык"
              autoFocus
            />
          </Field>
          <Field label="Описание (необязательно)">
            <Input
              {...register("description")}
              placeholder="Краткое описание курса"
            />
          </Field>
          <Field label="Аудитории (необязательно)" hint="Новые аудитории будут созданы в центре и станут доступны при создании группы">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={roomInput}
                  onChange={e => setRoomInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addRoom();
                    }
                  }}
                  placeholder="Напр. 400"
                />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addRoom}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {rooms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {rooms.map(room => (
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
          </Field>
          <div>
            <p className="mb-2 text-xs font-medium text-white/60">Цвет курса</p>
            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-7 w-7 rounded-full transition-all",
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-offset-[#0d0f17] scale-110"
                      : "opacity-60 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Отмена
            </Button>
            <Button type="submit" loading={saving}>
              Создать курс
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
