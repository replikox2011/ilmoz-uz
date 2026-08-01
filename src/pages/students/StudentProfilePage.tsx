import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Phone, Calendar, Users, BookMarked,
  UserCircle2, Clock, DollarSign, Trash2,
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

export function StudentProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { center, user } = useAuth();
  const data = useCenterData();
  const canManage = !!user && isStaff(user.role);

  const [deleting, setDeleting] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  // Resolve user profile by username
  const userProfile = React.useMemo(
    () => data.users.find(u => u.username?.toLowerCase() === username?.toLowerCase()) ?? null,
    [data.users, username]
  );

  // Resolve student record (same id as user)
  const student = React.useMemo(
    () => userProfile ? (data.students.find(s => s.id === userProfile.id) ?? null) : null,
    [data.students, userProfile]
  );

  // Groups this student belongs to
  const studentGroups = React.useMemo(
    () => data.groups.filter(g => student?.groupIds.includes(g.id)),
    [data.groups, student]
  );

  // Courses from those groups
  const courseMap = React.useMemo(() => {
    const map = new Map<string, string>();
    data.courses.forEach(c => map.set(c.id, c.name));
    return map;
  }, [data.courses]);

  // Parent info
  const parent = React.useMemo(
    () => student?.parentId ? data.users.find(u => u.id === student.parentId) ?? null : null,
    [data.users, student]
  );

  // Payments for this student
  const payments = React.useMemo(
    () => student ? data.payments.filter(p => p.studentId === student.id) : [],
    [data.payments, student]
  );

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);

  const handleDeleteStudent = async () => {
    if (!student || !center) return;
    setDeleting(true);
    try {
      await repo.deleteStudent(center.id, student.id);
      navigate("/students");
    } catch (err: any) {
      alert(err?.message ?? "Ошибка при удалении ученика.");
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

  if (!userProfile || !student) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <UserCircle2 className="h-12 w-12 text-white/20" />
        <p className="text-sm text-white/40">Ученик не найден</p>
        <Button variant="ghost" onClick={() => navigate("/students")}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> К ученикам
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/students")}
          className="flex items-center gap-1.5 text-sm text-white/40 transition hover:text-white/70"
        >
          <ArrowLeft className="h-4 w-4" /> Все ученики
        </button>

        {canManage && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" /> Удалить ученика
          </Button>
        )}
      </div>

      {/* Profile card */}
      <GlassCard className="p-5">
        <div className="flex items-start gap-4">
          <Avatar name={student.name} color={student.avatarColor} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-white">{student.name}</h1>
            {userProfile.username && (
              <p className="mt-0.5 text-sm text-white/45">@{userProfile.username}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {student.phone && (
                <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/60">
                  <Phone className="h-3 w-3" /> {student.phone}
                </span>
              )}
              {student.birthDate && (
                <span className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/60">
                  <Calendar className="h-3 w-3" /> {student.birthDate}
                </span>
              )}
              <Badge variant={studentGroups.length > 0 ? "brand" : "neutral"}>
                <Users className="h-3 w-3" />
                {studentGroups.length} групп
              </Badge>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Удалить ученика?"
        description={`Вы действительно хотите удалить ученика «${student.name}»? Это действие нельзя отменить.`}
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
            Отмена
          </Button>
          <Button variant="danger" type="button" onClick={handleDeleteStudent} loading={deleting}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Удалить
          </Button>
        </div>
      </Modal>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Groups */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/70">Группы</h2>
          {studentGroups.length === 0 ? (
            <GlassCard className="flex flex-col items-center gap-2 py-10 text-center">
              <Users className="h-8 w-8 text-white/20" />
              <p className="text-xs text-white/40">Нет групп</p>
            </GlassCard>
          ) : (
            <Stagger className="space-y-2">
              {studentGroups.map(g => (
                <FadeItem key={g.id}>
                  <GlassCard className="flex items-center gap-3 p-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/15">
                      <BookMarked className="h-4 w-4 text-brand-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{g.name}</p>
                      <p className="text-xs text-white/40">
                        {courseMap.get(g.courseId) ?? "—"}
                        {g.days?.length ? ` · ${g.days.join(", ")}` : ""}
                      </p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-white/40">
                      <Clock className="h-3 w-3" />
                      {g.startTime}–{g.endTime}
                    </span>
                  </GlassCard>
                </FadeItem>
              ))}
            </Stagger>
          )}
        </div>

        <div className="space-y-5">
          {/* Parent info */}
          {parent && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-white/70">Родитель</h2>
              <GlassCard className="flex items-center gap-3 p-4">
                <Avatar name={parent.name} color={parent.avatarColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{parent.name}</p>
                  {parent.phone && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-white/45">
                      <Phone className="h-3 w-3" /> {parent.phone}
                    </p>
                  )}
                </div>
                {parent.username && (
                  <span className="text-xs text-white/30">@{parent.username}</span>
                )}
              </GlassCard>
            </div>
          )}

          {/* Payments summary */}
          {payments.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-white/70">Оплаты</h2>
              <GlassCard className="divide-y divide-white/[0.06]">
                <div className="flex items-center justify-between p-4">
                  <span className="flex items-center gap-2 text-sm text-white/60">
                    <DollarSign className="h-4 w-4" /> Оплачено
                  </span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {formatMoney(totalPaid, center?.currency)}
                  </span>
                </div>
                {payments.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-xs text-white/70 capitalize">{p.type}</p>
                      {p.paidDate && <p className="text-[10px] text-white/35">{p.paidDate}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-white">
                        {formatMoney(p.amount ?? 0, center?.currency)}
                      </p>
                      <Badge
                        variant={p.status === "paid" ? "success" : p.status === "overdue" ? "danger" : "neutral"}
                        className="text-[10px]"
                      >
                        {p.status === "paid" ? "Оплачено" : p.status === "overdue" ? "Просрочено" : "Ожидает"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </GlassCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
