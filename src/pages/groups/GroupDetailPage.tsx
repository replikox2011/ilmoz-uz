import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Users, Clock, Calendar, MapPin, UserPlus,
  Search, Trash2, BookMarked, GraduationCap, X, Check,
  LayoutGrid, List, TableProperties, BookOpen
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { WEEKDAYS } from "../../types";
import { useViewMode } from "../../hooks/useViewMode";
import { StudentGridCard, StudentRow, StudentTableRow } from "../dashboard/widgets";
import { JournalPage } from "../journal/JournalPage";

export function GroupDetailPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { center } = useAuth();
  const data = useCenterData();

  const [activeTab, setActiveTab] = React.useState<"students" | "journal">("students");
  const [showAdd, setShowAdd] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = useViewMode("group_students", "grid");

  const group = React.useMemo(
    () => data.groups.find(g => g.id === groupId) ?? null,
    [data.groups, groupId]
  );

  const course = React.useMemo(
    () => data.courses.find(c => c.id === group?.courseId) ?? null,
    [data.courses, group]
  );

  const teacher = React.useMemo(
    () => data.teachers.find(t => t.id === group?.teacherId) ?? null,
    [data.teachers, group]
  );

  // Ученики, состоящие в группе
  const members = React.useMemo(
    () => data.students.filter(s => group?.studentIds?.includes(s.id)),
    [data.students, group]
  );

  // Ученики из базы, которых ещё нет в группе — фильтруются по поиску
  const available = React.useMemo(() => {
    if (!group) return [];
    const q = query.trim().toLowerCase();
    return data.students
      .filter(s => !group.studentIds?.includes(s.id))
      .filter(s => !q || s.name.toLowerCase().includes(q) || (s.phone ?? "").includes(q));
  }, [data.students, group, query]);

  const dayLabels = React.useMemo(
    () =>
      (group?.days ?? [])
        .map(d => WEEKDAYS.find(w => w.key === d)?.short)
        .filter(Boolean)
        .join(" · "),
    [group]
  );

  // Добавить существующего ученика в группу (двусторонняя денормализация)
  const addStudent = async (studentId: string) => {
    if (!center || !group) return;
    setBusyId(studentId);
    try {
      const student = data.students.find(s => s.id === studentId);
      const nextGroupIds = Array.from(new Set([...(student?.groupIds ?? []), group.id]));
      const nextStudentIds = Array.from(new Set([...(group.studentIds ?? []), studentId]));
      await Promise.all([
        repo.updateStudent(center.id, studentId, { groupIds: nextGroupIds }),
        repo.updateGroup(center.id, group.id, { studentIds: nextStudentIds }),
      ]);
    } finally {
      setBusyId(null);
    }
  };

  // Убрать ученика из группы (двусторонняя денормализация)
  const removeStudent = async (studentId: string) => {
    if (!center || !group) return;
    setBusyId(studentId);
    try {
      const student = data.students.find(s => s.id === studentId);
      const nextGroupIds = (student?.groupIds ?? []).filter(id => id !== group.id);
      const nextStudentIds = (group.studentIds ?? []).filter(id => id !== studentId);
      await Promise.all([
        repo.updateStudent(center.id, studentId, { groupIds: nextGroupIds }),
        repo.updateGroup(center.id, group.id, { studentIds: nextStudentIds }),
      ]);
    } finally {
      setBusyId(null);
    }
  };

  if (data.loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="h-36 animate-pulse rounded-3xl bg-white/[0.03]" />
        <div className="h-48 animate-pulse rounded-3xl bg-white/[0.03]" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Users className="h-12 w-12 text-white/20" />
        <p className="text-sm text-white/40">Группа не найдена</p>
        <Button variant="ghost" onClick={() => navigate("/groups")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> К группам
        </Button>
      </div>
    );
  }

  const isFull = members.length >= group.maxStudents;

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate("/groups")}
        className="flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
      >
        <ArrowLeft className="h-4 w-4" /> Все группы
      </button>

      {/* Header card */}
      <GlassCard className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="h-12 w-1.5 shrink-0 rounded-full"
            style={{ background: course?.color ?? "#3b6bff" }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{group.name}</h1>
              <Badge
                variant={
                  group.status === "active"
                    ? "success"
                    : group.status === "completed"
                    ? "brand"
                    : "neutral"
                }
              >
                {group.status}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/60">
                <BookMarked className="h-3 w-3" /> {course?.name ?? "—"}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/60">
                <Clock className="h-3 w-3" /> {group.startTime}–{group.endTime}
              </span>
              {dayLabels && (
                <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/60">
                  <Calendar className="h-3 w-3" /> {dayLabels}
                </span>
              )}
              {group.roomId && (
                <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/60">
                  <MapPin className="h-3 w-3" /> {group.roomId}
                </span>
              )}
              <Badge variant={isFull ? "danger" : "brand"}>
                <Users className="h-3 w-3" />
                {members.length}/{group.maxStudents}
              </Badge>
            </div>
          </div>
          {teacher && (
            <div className="hidden items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 sm:flex">
              <Avatar name={teacher.name} color={teacher.avatarColor} size="sm" />
              <div className="text-left">
                <p className="text-xs font-medium text-white/80">{teacher.name}</p>
                <p className="text-[11px] text-white/35">Преподаватель</p>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] gap-6">
        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === "students" ? "text-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <Users className="h-4 w-4" />
          Ученики
          {activeTab === "students" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("journal")}
          className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 ${
            activeTab === "journal" ? "text-white" : "text-white/40 hover:text-white/70"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Электронный журнал
          {activeTab === "journal" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-400" />
          )}
        </button>
      </div>

      {activeTab === "students" ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Ученики</h2>
              <p className="text-xs text-white/40">{members.length} в группе</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-1 rounded-2xl bg-white/[0.02] p-1 sm:flex">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-xl p-2 transition ${viewMode === "grid" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-xl p-2 transition ${viewMode === "list" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`rounded-xl p-2 transition ${viewMode === "table" ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"}`}
                >
                  <TableProperties className="h-4 w-4" />
                </button>
              </div>
              <Button size="sm" onClick={() => { setQuery(""); setShowAdd(true); }}>
                <UserPlus className="h-4 w-4 mr-1.5" /> Добавить ученика
              </Button>
            </div>
          </div>

          {members.length === 0 ? (
            <GlassCard className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04]">
                <GraduationCap className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-sm text-white/40">В группе пока нет учеников</p>
              <Button size="sm" onClick={() => { setQuery(""); setShowAdd(true); }}>
                <UserPlus className="h-4 w-4 mr-1.5" /> Добавить ученика
              </Button>
            </GlassCard>
          ) : (
            <>
              {viewMode === "grid" && (
                <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {members.map((student) => {
                    const userRec = data.users?.find(u => u.id === student.id);
                    return (
                    <FadeItem key={student.id}>
                      <StudentGridCard
                        student={student}
                        groupCount={student.groupIds?.length || 0}
                        username={userRec?.username}
                        action={
                          <button
                            onClick={(e) => { e.stopPropagation(); removeStudent(student.id); }}
                            disabled={busyId === student.id}
                            className="rounded-lg p-2 text-white/20 transition hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                            title="Убрать из группы"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                      />
                    </FadeItem>
                    );
                  })}
                </Stagger>
              )}
              
              {viewMode === "list" && (
                <Stagger className="flex flex-col gap-3">
                  {members.map((student) => {
                    const userRec = data.users?.find(u => u.id === student.id);
                    return (
                    <FadeItem key={student.id}>
                      <StudentRow
                        student={student}
                        groupCount={student.groupIds?.length || 0}
                        username={userRec?.username}
                        action={
                          <button
                            onClick={(e) => { e.stopPropagation(); removeStudent(student.id); }}
                            disabled={busyId === student.id}
                            className="rounded-lg p-2 text-white/20 transition hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                            title="Убрать из группы"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        }
                      />
                    </FadeItem>
                    );
                  })}
                </Stagger>
              )}

              {viewMode === "table" && (
                <GlassCard className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-xs uppercase tracking-wider text-white/40">
                          <th className="pb-3 px-4 font-medium">Имя</th>
                          <th className="pb-3 px-4 font-medium">Username</th>
                          <th className="pb-3 px-4 font-medium">Телефон</th>
                          <th className="pb-3 px-4 font-medium">Группы</th>
                          <th className="pb-3 px-4"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((student) => {
                          const userRec = data.users?.find(u => u.id === student.id);
                          return (
                          <StudentTableRow
                            key={student.id}
                            student={student}
                            groupCount={student.groupIds?.length || 0}
                            username={userRec?.username}
                            action={
                              <button
                                onClick={(e) => { e.stopPropagation(); removeStudent(student.id); }}
                                disabled={busyId === student.id}
                                className="rounded-lg p-1.5 text-white/20 transition hover:bg-red-500/15 hover:text-red-400 disabled:opacity-40"
                                title="Убрать из группы"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            }
                          />
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}
            </>
          )}
        </div>
      ) : (
        <JournalPage groupId={groupId} />
      )}

      {/* Add existing student modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Добавить ученика">
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по имени или телефону"
              autoFocus
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-400/50"
            />
          </div>

          <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
            {available.length === 0 ? (
              <div className="py-10 text-center text-sm text-white/40">
                {query ? "Ничего не найдено" : "Все ученики уже в группе"}
              </div>
            ) : (
              available.map(student => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3"
                >
                  <Avatar name={student.name} color={student.avatarColor} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{student.name}</p>
                    <p className="text-xs text-white/40">{student.phone ?? "—"}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    loading={busyId === student.id}
                    onClick={() => addStudent(student.id)}
                  >
                    <Check className="h-4 w-4 mr-1" /> Добавить
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end border-t border-white/5 pt-3">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>
              <X className="h-4 w-4 mr-1" /> Закрыть
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
