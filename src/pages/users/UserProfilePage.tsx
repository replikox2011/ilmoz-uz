import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Mail, Calendar, Users,
  UserCircle2, Clock, DollarSign, Trash2, Shield, Key, MapPin, CheckCircle2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { isStaff } from "../../lib/access";
import { GlassCard } from "../../components/ui/GlassCard";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { formatMoney } from "../../lib/utils";
import { Role } from "../../types";
import { useI18n } from "../../i18n/I18nContext";

const ROLE_BADGE_VARIANTS: Record<Role, "warning" | "success" | "brand" | "danger" | "neutral"> = {
  owner: "warning",
  director: "brand",
  administrator: "brand",
  teacher: "success",
  student: "brand",
  parent: "danger",
};

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { center, user: currentUser } = useAuth();
  const data = useCenterData();
  const { t } = useI18n();
  const canManage = !!currentUser && isStaff(currentUser.role);

  const [deleting, setDeleting] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  // Resolve user profile by username or id
  const targetUser = React.useMemo(
    () => data.users.find(u =>
      u.username?.toLowerCase() === username?.toLowerCase() ||
      u.id === username
    ) ?? null,
    [data.users, username]
  );

  // Resolve student record if user is a student
  const studentRecord = React.useMemo(
    () => targetUser && targetUser.role === "student"
      ? (data.students.find(s => s.id === targetUser.id) ?? null)
      : null,
    [data.students, targetUser]
  );

  // Course map for quick name lookups
  const courseMap = React.useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    data.courses.forEach(c => map.set(c.id, { name: c.name, color: c.color }));
    return map;
  }, [data.courses]);

  // Room map
  const roomMap = React.useMemo(() => {
    const map = new Map<string, string>();
    data.rooms.forEach(r => map.set(r.id, r.name));
    return map;
  }, [data.rooms]);

  // Student specific data
  const studentGroups = React.useMemo(
    () => data.groups.filter(g => studentRecord?.groupIds.includes(g.id)),
    [data.groups, studentRecord]
  );

  const studentParent = React.useMemo(
    () => studentRecord?.parentId
      ? (data.users.find(u => u.id === studentRecord.parentId) ?? null)
      : null,
    [data.users, studentRecord]
  );

  const studentPayments = React.useMemo(
    () => studentRecord ? data.payments.filter(p => p.studentId === studentRecord.id) : [],
    [data.payments, studentRecord]
  );

  const totalPaid = studentPayments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  // Teacher specific data
  const teacherGroups = React.useMemo(
    () => targetUser && targetUser.role === "teacher"
      ? data.groups.filter(g => g.teacherId === targetUser.id)
      : [],
    [data.groups, targetUser]
  );

  const teacherStudentsCount = React.useMemo(() => {
    const set = new Set<string>();
    teacherGroups.forEach(g => g.studentIds.forEach(id => set.add(id)));
    return set.size;
  }, [teacherGroups]);

  // Parent specific data: list of children
  const parentChildren = React.useMemo(
    () => targetUser && targetUser.role === "parent"
      ? data.students.filter(s => s.parentId === targetUser.id)
      : [],
    [data.students, targetUser]
  );

  const handleDeleteUser = async () => {
    if (!targetUser || !center) return;
    setDeleting(true);
    try {
      if (targetUser.role === "student") {
        await repo.deleteStudent(center.id, targetUser.id);
      } else {
        await repo.deleteUser(targetUser.id, center.id);
      }
      navigate(-1);
    } catch (err: any) {
      alert(err?.message ?? "Ошибка при удалении пользователя.");
      setDeleting(false);
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

  if (!targetUser) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <UserCircle2 className="h-12 w-12 text-white/20" />
        <p className="text-sm text-white/40">Пользователь не найден</p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Назад
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back button & Action */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
        >
          <ArrowLeft className="h-4 w-4" /> Назад
        </button>

        {canManage && targetUser.id !== currentUser?.id && targetUser.role !== "owner" && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Удалить пользователя
          </Button>
        )}
      </div>

      {/* Main Profile Card Header */}
      <GlassCard className="p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar name={targetUser.name} color={targetUser.avatarColor} size="lg" className="h-16 w-16 text-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{targetUser.name}</h1>
              <Badge variant={ROLE_BADGE_VARIANTS[targetUser.role] ?? "neutral"}>
                {t(`role.${targetUser.role}`)}
              </Badge>
            </div>

            {targetUser.username && (
              <p className="flex items-center gap-1 text-sm text-white/45">
                <Key className="h-3.5 w-3.5" /> @{targetUser.username}
              </p>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {targetUser.phone && (
                <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                  <Phone className="h-3.5 w-3.5 text-brand-400" /> {targetUser.phone}
                </span>
              )}

              {targetUser.email && (
                <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                  <Mail className="h-3.5 w-3.5 text-brand-400" /> {targetUser.email}
                </span>
              )}

              {targetUser.birthDate && (
                <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                  <Calendar className="h-3.5 w-3.5 text-brand-400" /> {targetUser.birthDate}
                </span>
              )}

              {targetUser.createdAt && (
                <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                  <Shield className="h-3.5 w-3.5 text-white/40" /> Зарегистрирован: {targetUser.createdAt.slice(0, 10)}
                </span>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Удалить пользователя?"
        description={`Вы действительно хотите удалить пользователя «${targetUser.name}»? Это действие нельзя отменить.`}
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Отмена
          </Button>
          <Button variant="danger" type="button" onClick={handleDeleteUser} loading={deleting}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Удалить
          </Button>
        </div>
      </Modal>

      {/* ── ROLE-SPECIFIC SECTIONS ── */}

      {/* 1. STUDENT VIEW */}
      {targetUser.role === "student" && (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Enrolled Groups */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Группы ученика</h2>
            {studentGroups.length === 0 ? (
              <GlassCard className="flex flex-col items-center gap-2 py-10 text-center">
                <Users className="h-8 w-8 text-white/20" />
                <p className="text-xs text-white/40">Студент пока не состоит ни в одной группе</p>
              </GlassCard>
            ) : (
              <Stagger className="space-y-2">
                {studentGroups.map(g => {
                  const course = courseMap.get(g.courseId);
                  return (
                    <FadeItem key={g.id}>
                      <GlassCard
                        interactive
                        onClick={() => navigate(`/groups/${g.id}`)}
                        className="flex items-center gap-3 p-4"
                      >
                        <div
                          className="h-10 w-1.5 shrink-0 rounded-full"
                          style={{ background: course?.color ?? "#3b6bff" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{g.name}</p>
                          <p className="text-xs text-white/40">
                            {course?.name ?? "—"}
                            {g.days?.length ? ` · ${g.days.join(", ")}` : ""}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-white/40">
                          <Clock className="h-3 w-3" />
                          {g.startTime}–{g.endTime}
                        </span>
                      </GlassCard>
                    </FadeItem>
                  );
                })}
              </Stagger>
            )}
          </div>

          <div className="space-y-5">
            {/* Parent Info */}
            {studentParent && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Родитель</h2>
                <GlassCard
                  interactive
                  onClick={() => navigate(`/users/${studentParent.username || studentParent.id}`)}
                  className="flex items-center gap-3 p-4"
                >
                  <Avatar name={studentParent.name} color={studentParent.avatarColor} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{studentParent.name}</p>
                    {studentParent.phone && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-white/45">
                        <Phone className="h-3 w-3" /> {studentParent.phone}
                      </p>
                    )}
                  </div>
                  {studentParent.username && (
                    <span className="text-xs text-white/30">@{studentParent.username}</span>
                  )}
                </GlassCard>
              </div>
            )}

            {/* Payments Summary */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">История оплат</h2>
              <GlassCard className="divide-y divide-white/[0.06] p-0 overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-white/[0.02]">
                  <span className="flex items-center gap-2 text-sm font-medium text-white/70">
                    <DollarSign className="h-4 w-4 text-emerald-400" /> Всего оплачено
                  </span>
                  <span className="text-base font-bold text-emerald-400">
                    {formatMoney(totalPaid, center?.currency)}
                  </span>
                </div>
                {studentPayments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-white/35">Записи о платежах отсутствуют</div>
                ) : (
                  studentPayments.slice(0, 6).map(p => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-white capitalize">{p.type}</p>
                        {p.paidDate && <p className="text-[10px] text-white/35">{p.paidDate}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-white">
                          {formatMoney(p.amount ?? 0, center?.currency)}
                        </p>
                        <Badge
                          variant={p.status === "paid" ? "success" : p.status === "overdue" ? "danger" : "neutral"}
                          className="text-[9px]"
                        >
                          {p.status === "paid" ? "Оплачено" : p.status === "overdue" ? "Просрочено" : "Ожидает"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </GlassCard>
            </div>
          </div>
        </div>
      )}

      {/* 2. TEACHER VIEW */}
      {targetUser.role === "teacher" && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <GlassCard className="p-4">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Групп преподает</p>
              <p className="mt-2 text-2xl font-bold text-white">{teacherGroups.length}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Учеников обучает</p>
              <p className="mt-2 text-2xl font-bold text-brand-300">{teacherStudentsCount}</p>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Статус</p>
              <p className="mt-2 text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Активный преподаватель
              </p>
            </GlassCard>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Группы преподавателя</h2>
            {teacherGroups.length === 0 ? (
              <GlassCard className="p-10 text-center text-sm text-white/40">
                Преподаватель пока не назначен ни в одну группу
              </GlassCard>
            ) : (
              <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teacherGroups.map(g => {
                  const course = courseMap.get(g.courseId);
                  const roomName = roomMap.get(g.roomId);
                  return (
                    <FadeItem key={g.id}>
                      <GlassCard
                        interactive
                        onClick={() => navigate(`/groups/${g.id}`)}
                        className="p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-white truncate">{g.name}</p>
                          <Badge variant={g.status === "active" ? "success" : "neutral"}>
                            {g.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/45 truncate">{course?.name}</p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {g.startTime}–{g.endTime}
                          </span>
                          {roomName && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {roomName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {g.studentIds.length} уч.
                          </span>
                        </div>
                      </GlassCard>
                    </FadeItem>
                  );
                })}
              </Stagger>
            )}
          </div>
        </div>
      )}

      {/* 3. PARENT VIEW */}
      {targetUser.role === "parent" && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Дети родителя ({parentChildren.length})
          </h2>
          {parentChildren.length === 0 ? (
            <GlassCard className="p-10 text-center text-sm text-white/40">
              К этому родителю пока не привязаны ученики
            </GlassCard>
          ) : (
            <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {parentChildren.map(c => {
                const childUser = data.users.find(u => u.id === c.id);
                return (
                  <FadeItem key={c.id}>
                    <GlassCard
                      interactive
                      onClick={() => navigate(`/users/${childUser?.username || c.id}`)}
                      className="flex items-center gap-3 p-4"
                    >
                      <Avatar name={c.name} color={c.avatarColor} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{c.name}</p>
                        {childUser?.username && (
                          <p className="text-xs text-white/40">@{childUser.username}</p>
                        )}
                        <p className="mt-1 text-xs text-brand-300">
                          {c.groupIds.length} групп
                        </p>
                      </div>
                    </GlassCard>
                  </FadeItem>
                );
              })}
            </Stagger>
          )}
        </div>
      )}

      {/* 4. STAFF / OTHER ROLES VIEW */}
      {["administrator", "director", "owner", "cashier"].includes(targetUser.role) && (
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Информация о сотруднике
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs text-white/40 mb-1">Должность и доступ</p>
              <p className="font-semibold text-white capitalize">{targetUser.role}</p>
              <p className="text-xs text-white/50 mt-1">Доступ к управлению данными учебного центра</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-xs text-white/40 mb-1">Центр</p>
              <p className="font-semibold text-white">{center?.name}</p>
              <p className="text-xs text-white/50 mt-1">Идентификатор: {center?.id}</p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
