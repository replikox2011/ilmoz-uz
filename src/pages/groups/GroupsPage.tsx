import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Users, Search, AlertTriangle,
  LayoutGrid, List, TableProperties,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nContext";
import { useCenterData } from "../../hooks/useCenterData";
import { useViewMode } from "../../hooks/useViewMode";
import { useAuth } from "../../context/AuthContext";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import {
  GroupRow,
  GroupGridCard,
  GroupTableRow,
} from "../dashboard/widgets";
import {
  GroupStatus, Weekday, WEEKDAYS,
} from "../../types";
import { isStaff } from "../../lib/access";
import { cn } from "../../lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────
function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
function hasTimeOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return toMinutes(aStart) < toMinutes(bEnd) && toMinutes(bStart) < toMinutes(aEnd);
}
function hasDayOverlap(aDays: Weekday[], bDays: Weekday[]) {
  return aDays.some(d => bDays.includes(d));
}

// ── form schema (manual validation) ──────────────────────────────────────────
interface FormState {
  name: string;
  courseId: string;
  teacherId: string;
  roomId: string;
  maxStudents: string;
  days: Weekday[];
  startTime: string;
  endTime: string;
  startDate: string;
  price: string;
}

const EMPTY_FORM: FormState = {
  name: "", courseId: "", teacherId: "", roomId: "",
  maxStudents: "15", days: [], startTime: "", endTime: "",
  startDate: "", price: "",
};

// ── component ────────────────────────────────────────────────────────────────
export function GroupsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { center, user } = useAuth();
  const role = user?.role;
  const data = useCenterData();

  const [filter, setFilter] = React.useState<GroupStatus | "all">("all");
  const [query, setQuery] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [viewMode, setViewMode] = useViewMode("groups", "grid");
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [conflictMsg, setConflictMsg] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  // derived
  const localGroups = data.groups;
  const teachers = data.teachers ?? [];
  const courses = data.courses ?? [];
  const rooms = data.rooms ?? [];

  const selectedCourse = courses.find(c => c.id === form.courseId);
  const availableTeachers = form.courseId
    ? teachers.filter(t => !selectedCourse?.teacherIds?.length || selectedCourse.teacherIds.includes(t.id))
    : teachers;
  const availableRooms = form.courseId
    ? rooms.filter(r => !selectedCourse?.rooms?.length || selectedCourse.rooms.includes(r.id))
    : rooms;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return localGroups
      .filter(g => filter === "all" || g.status === filter)
      .filter(g => !q || g.name.toLowerCase().includes(q));
  }, [localGroups, filter, query]);

  // validation
  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = t("groups.error.name");
    if (!form.courseId) e.courseId = t("groups.error.course");
    if (!form.teacherId) e.teacherId = t("groups.error.teacher");
    if (!form.roomId) e.roomId = t("groups.error.room");
    if (form.days.length === 0) e.days = t("groups.error.days");
    if (!form.startTime || !form.endTime) e.startTime = t("groups.error.time");
    if (!form.startDate) e.startDate = t("groups.error.startDate");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // conflict detection
  function detectConflict(): string | null {
    if (!center) return null;
    for (const g of localGroups) {
      if (
        hasDayOverlap(form.days, g.days) &&
        hasTimeOverlap(form.startTime, form.endTime, g.startTime, g.endTime)
      ) {
        if (g.roomId === form.roomId) {
          const roomName = rooms.find(r => r.id === form.roomId)?.name ?? t("groups.conflict.defaultRoom");
          return `${t("groups.conflict.roomPrefix")}${roomName}${t("groups.conflict.roomMid")}${g.name}${t("groups.conflict.timePart")}${form.startTime}–${form.endTime}${t("groups.conflict.daysPart")}${form.days.join(", ")}`;
        }
        if (g.teacherId === form.teacherId) {
          const teacher = teachers.find(t => t.id === form.teacherId);
          const teacherName = teacher?.name ?? t("groups.conflict.defaultTeacher");
          return `${t("groups.conflict.teacherPrefix")}${teacherName}${t("groups.conflict.teacherMid")}${g.name}${t("groups.conflict.timePart")}${form.startTime}–${form.endTime}${t("groups.conflict.daysPart")}${form.days.join(", ")}`;
        }
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!center) return;
    if (!validate()) return;

    const conflict = detectConflict();
    if (conflict) {
      setConflictMsg(conflict);
      return;
    }

    setSaving(true);
    try {
      await repo.createGroup({
        centerId: center.id,
        name: form.name.trim(),
        courseId: form.courseId,
        teacherId: form.teacherId,
        roomId: form.roomId,
        maxStudents: parseInt(form.maxStudents, 10) || 15,
        days: form.days,
        startTime: form.startTime,
        endTime: form.endTime,
        startDate: form.startDate,
        studentIds: [],
        status: "active",
        price: form.price ? parseFloat(form.price) : undefined,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      setConflictMsg(null);
    } catch (err: any) {
      setConflictMsg(t("groups.error.create") + err.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleDay(day: Weekday) {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day],
    }));
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setErrors({});
    setConflictMsg(null);
    setShowModal(true);
  }

  const canCreate = !!role && isStaff(role);

  if (data.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-3xl" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("groups.title")}
        subtitle={t("groups.subtitle")}
        actions={
          canCreate ? (
            <Button onClick={openModal}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t("groups.createGroup")}
            </Button>
          ) : undefined
        }
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter badges */}
        <div className="flex items-center gap-2">
          {(["all", "active", "completed", "archived"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                filter === s
                  ? "bg-brand-500 text-white"
                  : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white"
              )}
            >
              {t(`groups.filter.${s}`)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto flex-1 min-w-[160px] max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("groups.searchPlaceholder")}
            className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/50"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-2xl bg-white/[0.02] p-1 border border-white/[0.06]">
          {([
            { mode: "grid" as const, Icon: LayoutGrid },
            { mode: "list" as const, Icon: List },
            { mode: "table" as const, Icon: TableProperties },
          ]).map(({ mode, Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-xl p-2 transition",
                viewMode === mode ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <GlassCard className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04]">
            <Users className="h-7 w-7 text-white/25" />
          </div>
          <div>
            <p className="font-semibold text-white">{t("groups.emptyTitle")}</p>
            <p className="mt-1 text-sm text-white/40">{t("groups.emptyDesc")}</p>
          </div>
          {canCreate && (
            <Button size="sm" onClick={openModal}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t("groups.createGroup")}
            </Button>
          )}
        </GlassCard>
      )}

      {/* Grid view */}
      {filtered.length > 0 && viewMode === "grid" && (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(group => {
            const course = courses.find(c => c.id === group.courseId);
            const room = rooms.find(r => r.id === group.roomId);
            const teacher = teachers.find(t => t.id === group.teacherId);
            return (
              <FadeItem key={group.id}>
                <GroupGridCard
                  group={group}
                  course={course}
                  room={room}
                  teacher={teacher}
                  onClick={() => navigate(`/groups/${group.id}`)}
                />
              </FadeItem>
            );
          })}
        </Stagger>
      )}

      {/* List view */}
      {filtered.length > 0 && viewMode === "list" && (
        <Stagger className="flex flex-col gap-3">
          {filtered.map(group => {
            const course = courses.find(c => c.id === group.courseId);
            const room = rooms.find(r => r.id === group.roomId);
            const teacher = teachers.find(t => t.id === group.teacherId);
            return (
              <FadeItem key={group.id}>
                <GroupRow
                  group={group}
                  course={course}
                  room={room}
                  teacher={teacher}
                  onClick={() => navigate(`/groups/${group.id}`)}
                />
              </FadeItem>
            );
          })}
        </Stagger>
      )}

      {/* Table view */}
      {filtered.length > 0 && viewMode === "table" && (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-white/40">
                  <th className="pb-3 px-4 font-medium">{t("groups.field.name")}</th>
                  <th className="pb-3 px-4 font-medium">{t("groups.field.course")}</th>
                  <th className="pb-3 px-4 font-medium">{t("groups.field.days")}</th>
                  <th className="pb-3 px-4 font-medium">{t("groups.field.room")}</th>
                  <th className="pb-3 px-4 font-medium">{t("groups.field.teacher")}</th>
                  <th className="pb-3 px-4 font-medium">Статус</th>
                  <th className="pb-3 px-4 font-medium text-right">{t("groups.field.price")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(group => {
                  const course = courses.find(c => c.id === group.courseId);
                  const room = rooms.find(r => r.id === group.roomId);
                  const teacher = teachers.find(t => t.id === group.teacherId);
                  return (
                    <GroupTableRow
                      key={group.id}
                      group={group}
                      course={course}
                      room={room}
                      teacher={teacher}
                      onClick={() => navigate(`/groups/${group.id}`)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Create modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={t("groups.modalTitle")}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-xs text-white/50">{t("groups.modalDesc")}</p>

          {conflictMsg && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-medium text-amber-300">{t("groups.conflictTitle")}</p>
                <p className="mt-0.5 text-xs text-amber-200/80">{conflictMsg}</p>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs text-white/50 mb-1">{t("groups.field.name")}</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Английский A1 — утро"
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-brand-400/50"
            />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
          </div>

          {/* Course */}
          <div>
            <label className="block text-xs text-white/50 mb-1">{t("groups.field.course")}</label>
            <select
              value={form.courseId}
              onChange={e => setForm(f => ({ ...f, courseId: e.target.value, teacherId: "", roomId: "" }))}
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50"
            >
              <option value="">{t("groups.select.course")}</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.courseId && <p className="mt-1 text-xs text-red-400">{errors.courseId}</p>}
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-xs text-white/50 mb-1">{t("groups.field.teacher")}</label>
            <select
              value={form.teacherId}
              onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
              disabled={!form.courseId}
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50 disabled:opacity-40"
            >
              <option value="">{form.courseId ? t("groups.select.teacher") : t("groups.select.courseFirst")}</option>
              {availableTeachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.teacherId && <p className="mt-1 text-xs text-red-400">{errors.teacherId}</p>}
          </div>

          {/* Room + capacity */}
          <div>
            <label className="block text-xs text-white/50 mb-1">{t("groups.field.room")}</label>
            <select
              value={form.roomId}
              onChange={e => setForm(f => ({ ...f, roomId: e.target.value }))}
              disabled={!form.courseId}
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50 disabled:opacity-40"
            >
              <option value="">{!form.courseId ? t("groups.select.courseFirst") : availableRooms.length === 0 ? t("groups.select.noRooms") : t("groups.select.room")}</option>
              {availableRooms.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({t("groups.roomCapacity").replace("{n}", String(r.capacity))})</option>
              ))}
            </select>
            {errors.roomId && <p className="mt-1 text-xs text-red-400">{errors.roomId}</p>}
          </div>

          {/* Max students + price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">{t("groups.field.maxStudents")}</label>
              <input
                type="number"
                value={form.maxStudents}
                onChange={e => setForm(f => ({ ...f, maxStudents: e.target.value }))}
                min={1}
                max={100}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">{t("groups.field.price")}</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                min={0}
                placeholder="0"
                className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50"
              />
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="block text-xs text-white/50 mb-2">{t("groups.field.days")}</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(w => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => toggleDay(w.key)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-medium transition",
                    form.days.includes(w.key)
                      ? "bg-brand-500 text-white"
                      : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
                  )}
                >
                  {w.short}
                </button>
              ))}
            </div>
            {errors.days && <p className="mt-1 text-xs text-red-400">{errors.days}</p>}
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">{t("groups.field.startTime")}</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">{t("groups.field.endTime")}</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50"
              />
            </div>
          </div>
          {errors.startTime && <p className="-mt-3 text-xs text-red-400">{errors.startTime}</p>}

          {/* Start date */}
          <div>
            <label className="block text-xs text-white/50 mb-1">{t("groups.field.startDate")}</label>
            <input
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              className="h-10 w-full rounded-xl border border-white/10 bg-[#0f1115] px-3 text-sm text-white outline-none transition focus:border-brand-400/50"
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-400">{errors.startDate}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setShowModal(false); setConflictMsg(null); }}
            >
              {t("groups.cancel")}
            </Button>
            <Button type="submit" loading={saving}>
              {t("groups.createGroup")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
