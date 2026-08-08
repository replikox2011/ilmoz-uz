import * as React from "react";
import {
  BookOpen, Plus, CalendarDays, GraduationCap, CheckCircle2, ClipboardList,
  X, Trash2, BarChart3, Users, ArrowRight, ArrowLeft, Target, TrendingUp, TrendingDown,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { LineChart, LineSeries } from "../../components/ui/LineChart";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { Assignment, Group, Lesson, Student, Weekday, WEEKDAYS } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { uid } from "../../lib/utils";
import {
  lessonPercentForStudent, lessonMaxTotal, averagePercent,
  percentColor, percentStroke,
  assignmentPercent, assignmentColor,
} from "../../lib/grades";

const today = () => new Date().toISOString().slice(0, 10);

// JS getDay(): 0=вс … 6=сб → Weekday
const JS_DAY_TO_WEEKDAY: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function weekdayOf(iso: string): Weekday | null {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return JS_DAY_TO_WEEKDAY[d.getDay()];
}

function shortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

/* Draft assignment used inside the wizard (raw string inputs before validation). */
interface DraftAssignment {
  id: string;
  title: string;
  maxScore: string;
  passScore: string;
}

export function JournalPage({ groupId }: { groupId?: string }) {
  const { t } = useI18n();
  const { center } = useAuth();
  const data = useCenterData();

  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(groupId || null);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = React.useState(false);
  const [showWizard, setShowWizard] = React.useState(false);
  const [gradingLessonId, setGradingLessonId] = React.useState<string | null>(null);
  const [showCompare, setShowCompare] = React.useState(false);
  const [chartStudentId, setChartStudentId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"grades" | "attendance">("grades");

  React.useEffect(() => {
    if (groupId) {
      setSelectedGroupId(groupId);
    }
  }, [groupId]);

  React.useEffect(() => {
    if (!selectedGroupId && data.groups.length > 0 && !groupId) {
      setSelectedGroupId(data.groups[0].id);
    }
  }, [data.groups, selectedGroupId, groupId]);

  const selectedGroup: Group | undefined = React.useMemo(
    () => data.groups.find((g) => g.id === selectedGroupId),
    [data.groups, selectedGroupId]
  );

  const groupStudents: Student[] = React.useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.studentIds
      .map((sid) => data.students.find((s) => s.id === sid))
      .filter((s): s is Student => Boolean(s));
  }, [selectedGroup, data.students]);

  React.useEffect(() => {
    if (!center || !selectedGroupId) {
      setLessons([]);
      return;
    }
    let alive = true;
    setLessonsLoading(true);
    (async () => {
      try {
        const list = await repo.listLessons(center.id, selectedGroupId);
        if (!alive) return;
        setLessons(list);
      } finally {
        if (alive) setLessonsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [center, selectedGroupId]);

  // Chronological (oldest → newest) for the gradebook columns.
  const chronoLessons = React.useMemo(
    () => [...lessons].sort((a, b) => a.date.localeCompare(b.date)),
    [lessons]
  );

  const gradingLesson = React.useMemo(
    () => lessons.find((l) => l.id === gradingLessonId) ?? null,
    [lessons, gradingLessonId]
  );

  const chartStudent = React.useMemo(
    () => groupStudents.find((s) => s.id === chartStudentId) ?? null,
    [groupStudents, chartStudentId]
  );

  const handleLessonSaved = (updated: Lesson) => {
    setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleLessonCreated = (lesson: Lesson) => {
    setLessons((prev) => [...prev, lesson]);
  };

  return (
    <div className="space-y-4">
      {!groupId ? (
        <PageHeader
          title={t("journal.title")}
          subtitle={t("journal.subtitle")}
          actions={
            <div className="flex gap-2">
              {chronoLessons.length > 0 && groupStudents.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setShowCompare(true)}>
                  <BarChart3 className="h-4 w-4" /> {t("journal.compare.action")}
                </Button>
              )}
              <Button size="sm" onClick={() => setShowWizard(true)} disabled={!selectedGroup}>
                <Plus className="h-4 w-4" /> {t("journal.addLesson")}
              </Button>
            </div>
          }
        />
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">{t("journal.title")}</h3>
            <p className="text-xs text-white/40">{t("journal.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            {chronoLessons.length > 0 && groupStudents.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setShowCompare(true)}>
                <BarChart3 className="h-4 w-4" /> {t("journal.compare.action")}
              </Button>
            )}
            <Button size="sm" onClick={() => setShowWizard(true)} disabled={!selectedGroup}>
              <Plus className="h-4 w-4" /> {t("journal.addLesson")}
            </Button>
          </div>
        </div>
      )}

      {data.loading ? (
        <div className="space-y-3">
          <Skeleton className="h-11 max-w-sm" />
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        </div>
      ) : data.groups.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm font-medium text-white/50">{t("journal.noGroups.title")}</p>
          <p className="mt-1 text-xs text-white/30">{t("journal.noGroups.hint")}</p>
        </GlassCard>
      ) : (
        <>
          {!groupId && (
            <div className="mb-5 flex flex-wrap gap-2">
              {data.groups.map((g) => {
                const active = g.id === selectedGroupId;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={
                      active
                        ? "inline-flex items-center gap-1.5 rounded-2xl border border-brand-400/40 bg-brand-500/15 px-4 py-2 text-sm font-medium text-brand-100 transition"
                        : "inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/60 transition hover:border-white/20 hover:text-white"
                    }
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {g.name}
                  </button>
                );
              })}
            </div>
          )}

          {lessonsLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : groupStudents.length === 0 ? (
            <GlassCard className="p-16 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="text-sm font-medium text-white/50">{t("journal.attendance.noStudents")}</p>
            </GlassCard>
          ) : chronoLessons.length === 0 ? (
            <GlassCard className="p-16 text-center">
              <ClipboardList className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="text-sm font-medium text-white/50">{t("journal.noLessons.title")}</p>
              <p className="mt-1 text-xs text-white/30">{t("journal.noLessons.hint")}</p>
            </GlassCard>
          ) : (
            <FadeItem>
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 px-4">
                  {!gradingLessonId ? (
                    <>
                      <button
                        onClick={() => setActiveTab("grades")}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === "grades" ? "border-brand-400 text-brand-100" : "border-transparent text-white/50 hover:text-white"}`}
                      >
                        {t("journal.title") || "O'zlashtirish"}
                      </button>
                      <button
                        onClick={() => setActiveTab("attendance")}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition ${activeTab === "attendance" ? "border-brand-400 text-brand-100" : "border-transparent text-white/50 hover:text-white"}`}
                      >
                        {t("journal.attendance.title") || "Davomat"}
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <button
                        className="px-4 py-3 text-sm font-medium border-b-2 transition border-brand-400 text-brand-100 flex items-center gap-2"
                      >
                        {shortDate(gradingLesson?.date ?? "")}: {gradingLesson?.topic}
                      </button>
                      <button onClick={() => setGradingLessonId(null)} className="text-white/30 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                
                {gradingLesson && center ? (
                  <GlassCard className="p-0 border-0">
                    <GradeLessonView
                      lesson={gradingLesson}
                      students={groupStudents}
                      centerId={center.id}
                      onSaved={handleLessonSaved}
                      t={t}
                    />
                  </GlassCard>
                ) : activeTab === "attendance" && center ? (
                  <AttendanceTable
                    students={groupStudents}
                    lessons={chronoLessons}
                    centerId={center.id}
                    onStudentClick={setChartStudentId}
                    onLessonSaved={handleLessonSaved}
                    t={t}
                  />
                ) : (
                  <GradebookTable
                    students={groupStudents}
                    lessons={chronoLessons}
                    onGrade={setGradingLessonId}
                    onStudentClick={setChartStudentId}
                    t={t}
                  />
                )}
              </div>
            </FadeItem>
          )}
        </>
      )}

      {/* Add-lesson wizard (details + tests → scores; attendance is marked after creation) */}
      {showWizard && center && selectedGroup && (
        <AddLessonWizard
          group={selectedGroup}
          students={groupStudents}
          centerId={center.id}
          onClose={() => setShowWizard(false)}
          onCreated={handleLessonCreated}
          t={t}
        />
      )}

      {/* Comparison chart modal */}
      {showCompare && (
        <CompareModal
          students={groupStudents}
          lessons={chronoLessons}
          onClose={() => setShowCompare(false)}
          t={t}
        />
      )}

      {/* Per-student performance charts */}
      {chartStudent && (
        <StudentChartModal
          student={chartStudent}
          lessons={chronoLessons}
          onClose={() => setChartStudentId(null)}
          t={t}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Add-lesson wizard: 1) details + tests → 2) scores.
   Attendance is marked after creation, on the lesson in the gradebook.
   ───────────────────────────────────────────────────────────────────────── */
type WizardStep = 1 | 2;

function AddLessonWizard({
  group, students, centerId, onClose, onCreated, t,
}: {
  group: Group;
  students: Student[];
  centerId: string;
  onClose: () => void;
  onCreated: (lesson: Lesson) => void;
  t: (key: string) => string;
}) {
  const [step, setStep] = React.useState<WizardStep>(1);
  const [saving, setSaving] = React.useState(false);

  // Step 1 — lesson details + tests
  const [date, setDate] = React.useState(today());
  const [topic, setTopic] = React.useState("");
  const [homework, setHomework] = React.useState("");
  const [drafts, setDrafts] = React.useState<DraftAssignment[]>([]);
  const [newTitle, setNewTitle] = React.useState("");
  const [newMax, setNewMax] = React.useState("10");
  const [newPass, setNewPass] = React.useState("5");
  const [topicError, setTopicError] = React.useState<string | null>(null);

  // Step 2 — scores: grades[studentId][assignmentId] = raw string.
  // Attendance is NOT part of this wizard — it is marked on the lesson after creation.
  const [grades, setGrades] = React.useState<Record<string, Record<string, string>>>({});

  const dateMismatch = React.useMemo(() => {
    if (!date || !group.days?.length) return false;
    const wd = weekdayOf(date);
    return wd ? !group.days.includes(wd) : false;
  }, [date, group.days]);

  const groupDayLabels = React.useMemo(
    () => (group.days ?? []).map((d) => WEEKDAYS.find((w) => w.key === d)?.short).filter(Boolean).join(", "),
    [group.days]
  );

  // Validated assignments derived from drafts.
  const assignments: Assignment[] = React.useMemo(
    () =>
      drafts.map((d) => ({
        id: d.id,
        title: d.title,
        maxScore: Math.max(1, Math.round(Number(d.maxScore) || 0)),
        passScore: Math.max(0, Math.round(Number(d.passScore) || 0)),
      })),
    [drafts]
  );

  const addDraft = () => {
    const title = newTitle.trim();
    const max = Number(newMax);
    const pass = Number(newPass);
    if (!title || !Number.isFinite(max) || max <= 0) return;
    const clampedPass = Math.max(0, Math.min(Number.isFinite(pass) ? pass : 0, max));
    setDrafts((prev) => [
      ...prev,
      { id: uid("asg"), title, maxScore: String(Math.round(max)), passScore: String(Math.round(clampedPass)) },
    ]);
    setNewTitle(""); setNewMax("10"); setNewPass("5");
  };

  const removeDraft = (id: string) => setDrafts((prev) => prev.filter((d) => d.id !== id));

  const setGrade = (sid: string, aid: string, value: string) =>
    setGrades((prev) => ({ ...prev, [sid]: { ...prev[sid], [aid]: value } }));

  // Step 1 "next": go to scores, or save immediately when there are no tests.
  const goNextFromDetails = () => {
    if (topic.trim().length < 2) { setTopicError(t("journal.error.topic")); return; }
    if (dateMismatch) return;
    setTopicError(null);
    if (assignments.length === 0) { void save(); } else { setStep(2); }
  };

  const livePercent = (sid: string): number | null => {
    if (assignments.length === 0) return null;
    let earned = 0, possible = 0, has = false;
    for (const a of assignments) {
      const raw = grades[sid]?.[a.id];
      if (raw === undefined || raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      has = true;
      earned += Math.max(0, Math.min(n, a.maxScore));
      possible += a.maxScore;
    }
    if (!has || possible === 0) return null;
    return Math.round((earned / possible) * 100);
  };

  const save = async () => {
    setSaving(true);
    try {
      const cleanGrades: Record<string, Record<string, number>> = {};
      for (const s of students) {
        const row = grades[s.id] ?? {};
        const out: Record<string, number> = {};
        for (const a of assignments) {
          const raw = row[a.id];
          if (raw === undefined || raw === "") continue;
          const n = Number(raw);
          if (!Number.isFinite(n)) continue;
          out[a.id] = Math.max(0, Math.min(Math.round(n), a.maxScore));
        }
        if (Object.keys(out).length > 0) cleanGrades[s.id] = out;
      }
      const lesson = await repo.createLesson({
        centerId,
        groupId: group.id,
        date,
        topic: topic.trim(),
        homework: homework.trim() || undefined,
        // Marked after creation via the lesson's grading modal.
        attendance: {},
        assignments,
        grades: cleanGrades,
      });
      onCreated(lesson);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const stepTitles = [t("journal.wizard.step1"), t("journal.wizard.step3")];

  return (
    <Modal open onClose={onClose} title={t("journal.modal.title")} description={`«${group.name}»`} className="max-w-3xl">
      {/* Stepper */}
      <div className="mt-1 flex items-center gap-2">
        {stepTitles.map((label, i) => {
          const n = (i + 1) as WizardStep;
          const active = n === step;
          const done = n < step;
          // Scores step is hidden when there are no tests.
          if (n === 2 && assignments.length === 0) return null;
          return (
            <React.Fragment key={label}>
              <div className={
                active ? "flex items-center gap-2 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-medium text-brand-100"
                : done ? "flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                : "flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-xs text-white/40"
              }>
                <span className={
                  active ? "flex h-4 w-4 items-center justify-center rounded-full bg-brand-400/40 text-[10px]"
                  : done ? "flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/40 text-[10px]"
                  : "flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]"
                }>{done ? "✓" : n}</span>
                {label}
              </div>
              {i < stepTitles.length - 1 && assignments.length > 0 && (
                <div className="h-px w-4 bg-white/10" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-4">
        {/* ── Step 1: details + tests ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60">{t("journal.field.date")}</label>
                <Input icon={<CalendarDays className="h-4 w-4" />} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                {dateMismatch && (
                  <p className="text-xs text-amber-400">
                    {t("journal.error.dateMismatch")}. {t("journal.error.dateMismatchDays")} {groupDayLabels}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-white/60">{t("journal.field.topic")}</label>
                <Input icon={<BookOpen className="h-4 w-4" />} placeholder={t("journal.field.topicPlaceholder")} autoFocus value={topic} onChange={(e) => setTopic(e.target.value)} />
                {topicError && <p className="text-xs text-red-400">{topicError}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-white/60">{t("journal.field.homework")}</label>
              <textarea
                rows={2}
                placeholder={t("journal.field.homeworkPlaceholder")}
                value={homework}
                onChange={(e) => setHomework(e.target.value)}
                className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition-all duration-300 focus:border-brand-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-brand-500/15"
              />
            </div>

            {/* Tests / контрольные */}
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-medium text-white/60">
                  <Target className="h-3.5 w-3.5" /> {t("journal.wizard.tests")}
                </label>
                <span className="text-[11px] text-white/35">{t("journal.wizard.testsOptional")}</span>
              </div>

              {drafts.length > 0 && (
                <div className="space-y-1.5">
                  {drafts.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm">
                      <span className="min-w-0 flex-1 truncate text-white/85">{d.title}</span>
                      <span className="text-xs text-white/40">{t("journal.table.maxShort")} {d.maxScore}</span>
                      <span className="text-xs text-brand-300/80">{t("journal.wizard.passShort")} {d.passScore}</span>
                      <button type="button" onClick={() => removeDraft(d.id)} className="text-white/30 hover:text-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[10rem] flex-1">
                  <label className="mb-1 block text-[10px] text-white/40">{t("journal.wizard.testName")}</label>
                  <Input placeholder={t("journal.grade.taskNamePlaceholder")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDraft(); } }} />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-[10px] text-white/40">{t("journal.grade.maxScore")}</label>
                  <Input type="number" min={1} value={newMax} onChange={(e) => setNewMax(e.target.value)} />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-[10px] text-white/40">{t("journal.wizard.passScore")}</label>
                  <Input type="number" min={0} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                </div>
                <Button type="button" variant="ghost" onClick={addDraft}>
                  <Plus className="h-4 w-4" /> {t("journal.grade.addTask")}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" type="button" onClick={onClose}>{t("journal.cancel")}</Button>
              <Button type="button" loading={saving && assignments.length === 0} onClick={goNextFromDetails} disabled={dateMismatch}>
                {assignments.length === 0
                  ? t("journal.grade.save")
                  : <>{t("journal.wizard.toScores")} <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: scores ── */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-white/70">{t("journal.wizard.enterScores")}</p>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-3 py-2 text-left text-xs font-medium text-white/50">{t("journal.table.student")}</th>
                    {assignments.map((a) => (
                      <th key={a.id} className="px-2 py-2 text-center text-xs font-medium text-white/50">
                        <div className="truncate">{a.title}</div>
                        <div className="text-[10px] text-white/30">
                          {t("journal.table.maxShort")} {a.maxScore} · {t("journal.wizard.passShort")} {a.passScore}
                        </div>
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center text-xs font-medium text-white/50">%</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const pct = livePercent(s.id);
                    return (
                      <tr key={s.id} className="border-b border-white/[0.04] last:border-0">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={s.name} color={s.avatarColor} size="sm" />
                            <span className="truncate text-sm text-white">{s.name}</span>
                          </div>
                        </td>
                        {assignments.map((a) => {
                          const raw = grades[s.id]?.[a.id] ?? "";
                          const n = raw === "" ? null : Number(raw);
                          const passed = n !== null && Number.isFinite(n) ? n >= a.passScore : null;
                          return (
                            <td key={a.id} className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number" min={0} max={a.maxScore} value={raw}
                                  onChange={(e) => setGrade(s.id, a.id, e.target.value)}
                                  className={
                                    "w-14 rounded-lg border bg-white/[0.04] px-2 py-1.5 text-center text-sm text-white outline-none transition focus:ring-2 focus:ring-brand-500/15 " +
                                    (passed === null ? "border-white/10 focus:border-brand-400/60"
                                      : passed ? "border-emerald-400/40" : "border-rose-400/40")
                                  }
                                  placeholder="—"
                                />
                                {passed === true && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
                                {passed === false && <X className="h-3.5 w-3.5 text-rose-300" />}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-center">
                          <span className={`text-sm font-semibold ${pct !== null ? percentColor(pct) : "text-white/25"}`}>
                            {pct !== null ? `${pct}%` : "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between gap-2 pt-1">
              <Button variant="ghost" type="button" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4" /> {t("journal.wizard.back")}
              </Button>
              <Button type="button" loading={saving} onClick={save}>{t("journal.grade.save")}</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
/* ─────────────────────────────────────────────────────────────────────────
   Attendance Table — rows = students, columns = lessons. Inline toggle.
   ───────────────────────────────────────────────────────────────────────── */
function AttendanceTable({
  students, lessons, centerId, onStudentClick, onLessonSaved, t,
}: {
  students: Student[];
  lessons: Lesson[];
  centerId: string;
  onStudentClick: (studentId: string) => void;
  onLessonSaved: (updated: Lesson) => void;
  t: (key: string) => string;
}) {
  const toggleAttendance = async (lesson: Lesson, studentId: string) => {
    const current = lesson.attendance?.[studentId];
    let next: boolean | "late" = true; // undefined -> true
    if (current === true) next = "late"; // true -> late
    else if (current === "late") next = false; // late -> false
    else if (current === false) next = true; // false -> true

    const updated = { ...lesson, attendance: { ...(lesson.attendance || {}), [studentId]: next } };
    
    // 1. Optimistically update state on front-end so UI updates instantly
    onLessonSaved(updated);

    // 2. Persist to Firebase in background
    try {
      await repo.updateLesson(centerId, lesson.id, updated);
    } catch (err) {
      console.error("Failed to update attendance", err);
      // Revert if error
      onLessonSaved(lesson);
    }
  };

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="sticky left-0 z-10 bg-bg-elevated/95 px-4 py-3 text-left text-xs font-semibold text-white/70 backdrop-blur w-64">
                {t("journal.table.student")}
              </th>
              {lessons.map((l) => (
                <th key={l.id} className="px-2 py-2 text-center align-bottom min-w-[3.5rem]">
                  <div className="group flex w-full flex-col items-center gap-0.5 rounded-lg px-1.5 py-1">
                    <span className="text-[11px] font-semibold text-white/70">{shortDate(l.date)}</span>
                    <span className="max-w-[5rem] truncate text-[9px] text-white/35">{l.topic}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition">
                <td className="sticky left-0 z-10 bg-bg-elevated/95 px-4 py-2.5 backdrop-blur">
                  <button
                    type="button"
                    onClick={() => onStudentClick(s.id)}
                    className="group flex items-center gap-2 rounded-lg text-left transition hover:opacity-80"
                  >
                    <Avatar name={s.name} color={s.avatarColor} size="sm" />
                    <span className="truncate text-sm font-medium text-white group-hover:text-brand-200">{s.name}</span>
                  </button>
                </td>
                {lessons.map((l) => {
                  const status = l.attendance?.[s.id];
                  return (
                    <td key={l.id} className="px-1 py-1 text-center">
                      <button
                        onClick={() => toggleAttendance(l, s.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition mx-auto group"
                        title={status === true ? "Пришел" : status === "late" ? "Опоздал" : status === false ? "Не пришел" : "Отметить"}
                      >
                        {status === true ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : status === "late" ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 flex items-center justify-center">
                            <div className="w-1 h-1 bg-amber-400 rounded-full" />
                          </div>
                        ) : status === false ? (
                          <X className="h-4 w-4 text-rose-400" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-white/10 group-hover:bg-white/30 transition" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Gradebook table — rows = students sorted by total score DESC, 
   columns = lessons with attendance + per-lesson score, 
   rightmost = sum / % / prev-rank / change.
   ───────────────────────────────────────────────────────────────────────── */

/** Raw score a student earned in a lesson (sum of grades, not %). */
function lessonRawScore(lesson: Lesson, studentId: string): number | null {
  const assignments = lesson.assignments ?? [];
  if (assignments.length === 0) return null;
  const g = lesson.grades?.[studentId];
  if (!g) return null;
  let total = 0;
  let has = false;
  for (const a of assignments) {
    const v = g[a.id];
    if (v === undefined || v === null) continue;
    total += Math.max(0, Math.min(Number(v), a.maxScore));
    has = true;
  }
  return has ? total : null;
}

/** Total raw score across all lessons for a student. */
function totalRawScore(lessons: Lesson[], studentId: string): number {
  return lessons.reduce((sum, l) => sum + (lessonRawScore(l, studentId) ?? 0), 0);
}

/** Grand max possible across all lessons. */
function totalMaxScore(lessons: Lesson[]): number {
  return lessons.reduce((sum, l) => sum + lessonMaxTotal(l), 0);
}

/** Percentage of total score across all lessons. */
function totalPercent(lessons: Lesson[], studentId: string): number | null {
  const max = totalMaxScore(lessons);
  if (max === 0) return null;
  const raw = totalRawScore(lessons, studentId);
  return Math.round((raw / max) * 100);
}

/** Row background tint based on rank tier. */
function rankRowBg(rank: number, total: number): string {
  const p = rank / total;
  if (p <= 0.15) return "bg-emerald-500/[0.07]";
  if (p <= 0.40) return "bg-amber-500/[0.05]";
  if (p >= 0.85) return "bg-rose-500/[0.07]";
  return "";
}

function GradebookTable({
  students, lessons, onGrade, onStudentClick, t,
}: {
  students: Student[];
  lessons: Lesson[];
  onGrade: (lessonId: string) => void;
  onStudentClick: (studentId: string) => void;
  t: (key: string) => string;
}) {
  // Sort students by total score DESC to compute current rank
  const ranked = React.useMemo(() => {
    return [...students]
      .map((s) => ({ s, total: totalRawScore(lessons, s.id), pct: totalPercent(lessons, s.id) }))
      .sort((a, b) => b.total - a.total)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [students, lessons]);

  // Previous rank: computed without the latest lesson
  const prevRanked = React.useMemo(() => {
    const prevLessons = lessons.slice(0, -1);
    return [...students]
      .map((s) => ({ id: s.id, total: totalRawScore(prevLessons, s.id) }))
      .sort((a, b) => b.total - a.total)
      .map((item, idx) => ({ id: item.id, rank: idx + 1 }));
  }, [students, lessons]);

  const prevRankMap = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const x of prevRanked) m[x.id] = x.rank;
    return m;
  }, [prevRanked]);

  // Grand max & column max scores for header
  const grand = totalMaxScore(lessons);

  // Group average per lesson (raw)
  const lessonAvg = React.useMemo(() =>
    lessons.map((l) => {
      const scores = students.map((s) => lessonRawScore(l, s.id)).filter((v): v is number => v !== null);
      return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
    }),
    [lessons, students]
  );

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {/* ── Row 1: month labels (group name + lesson dates) ── */}
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th colSpan={2} className="sticky left-0 z-10 bg-bg-elevated/95 px-4 py-2 text-left text-xs font-semibold text-white/70 backdrop-blur">
                № / {t("journal.table.student")}
              </th>
              {lessons.map((l) => (
                <th key={l.id} colSpan={1} className="px-2 py-1 text-center">
                  <button
                    onClick={() => onGrade(l.id)}
                    className="group flex w-full flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 transition hover:bg-white/5"
                  >
                    <span className="text-[11px] font-semibold text-white/70 group-hover:text-white">{shortDate(l.date)}</span>
                    <span className="max-w-[5rem] truncate text-[9px] text-white/35 group-hover:text-white/55">{l.topic}</span>
                    <span className="text-[9px] text-brand-300/60">{t("journal.table.maxShort")} {lessonMaxTotal(l)}</span>
                  </button>
                </th>
              ))}
              <th className="sticky right-0 z-10 bg-bg-elevated/95 px-3 py-2 text-center text-xs font-semibold text-white/60 backdrop-blur">Summa</th>
              <th className="sticky right-0 z-10 bg-bg-elevated/95 px-3 py-2 text-center text-xs font-semibold text-white/60 backdrop-blur">%</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-white/60">{t("journal.table.prevRank") || "O'tkan orin"}</th>
              <th className="px-3 py-2 text-center text-xs font-semibold text-white/60">{t("journal.table.change") || "O'zgeris"}</th>
            </tr>
            {/* ── Row 2: max ball per lesson ── */}
            <tr className="border-b border-white/10">
              <td colSpan={2} className="sticky left-0 z-10 bg-bg-elevated/95 px-4 py-1.5 text-left text-[10px] font-medium text-white/35 backdrop-blur">
                FIO / Max ball
              </td>
              {lessons.map((l) => (
                <td key={l.id} className="px-2 py-1.5 text-center text-[10px] font-semibold text-brand-300/70">
                  {lessonMaxTotal(l) || "—"}
                </td>
              ))}
              <td className="sticky right-0 z-10 bg-bg-elevated/95 px-3 py-1.5 text-center text-[10px] font-semibold text-brand-300/70 backdrop-blur">{grand || "—"}</td>
              <td className="sticky right-0 z-10 bg-bg-elevated/95 px-3 py-1.5 text-center text-[10px] text-white/35 backdrop-blur">100</td>
              <td colSpan={2} />
            </tr>
          </thead>
          <tbody>
            {ranked.map(({ s, total, pct, rank }) => {
              const prevRank = prevRankMap[s.id] ?? rank;
              const change = prevRank - rank; // positive = moved up
              const rowBg = rankRowBg(rank, ranked.length);

              return (
                <tr key={s.id} className={`border-b border-white/[0.04] last:border-0 hover:brightness-110 transition ${rowBg}`}>
                  {/* Rank + Name */}
                  <td className="sticky left-0 z-10 bg-bg-elevated/90 pl-4 pr-1 py-2.5 text-center text-xs font-bold text-white/40 backdrop-blur w-8">
                    {rank}
                  </td>
                  <td className="sticky left-8 z-10 bg-bg-elevated/90 pr-4 py-2.5 backdrop-blur min-w-[160px]">
                    <button
                      type="button"
                      onClick={() => onStudentClick(s.id)}
                      className="group flex items-center gap-2 rounded-lg text-left transition hover:opacity-80"
                    >
                      <Avatar name={s.name} color={s.avatarColor} size="sm" />
                      <span className="truncate text-sm font-medium text-white group-hover:text-brand-200">{s.name}</span>
                    </button>
                  </td>

                  {/* Per-lesson columns: attendance + score */}
                  {lessons.map((l) => {
                    const present = l.attendance?.[s.id];
                    const raw = lessonRawScore(l, s.id);
                    const pctLesson = lessonPercentForStudent(l, s.id);

                    return (
                      <td key={l.id} className="px-2 py-2.5 text-center">
                        {raw !== null ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`text-sm font-semibold ${pctLesson !== null ? percentColor(pctLesson) : "text-white"}`}>
                              {raw}
                            </span>
                            <span className="text-[9px] text-white/30">{pctLesson !== null ? `${pctLesson}%` : ""}</span>
                          </div>
                        ) : present === false ? (
                          <span
                            title={t("journal.attendance.studentAbsent")}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-rose-500/15 text-rose-400/80"
                          >
                            <X className="h-3 w-3" />
                          </span>
                        ) : (
                          <span className="text-white/15">·</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Sum */}
                  <td className="sticky right-[120px] z-10 bg-bg-elevated/90 px-3 py-2.5 text-center backdrop-blur">
                    <span className={`text-sm font-bold ${pct !== null ? percentColor(pct) : "text-white/25"}`}>
                      {total > 0 ? total : "—"}
                    </span>
                  </td>

                  {/* % */}
                  <td className="sticky right-[60px] z-10 bg-bg-elevated/90 px-3 py-2.5 text-center backdrop-blur">
                    <span className={`text-sm font-bold ${pct !== null ? percentColor(pct) : "text-white/25"}`}>
                      {pct !== null ? `${pct}%` : "—"}
                    </span>
                  </td>

                  {/* Previous rank */}
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs text-white/40">{prevRank}</span>
                  </td>

                  {/* Change */}
                  <td className="px-3 py-2.5 text-center">
                    {change === 0 ? (
                      <span className="text-xs font-semibold text-amber-400">—</span>
                    ) : change > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-400">
                        <TrendingUp className="h-3 w-3" />+{change}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-400">
                        <TrendingDown className="h-3 w-3" />{change}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* ── Group average row ── */}
            <tr className="border-t-2 border-white/10 bg-white/[0.03]">
              <td colSpan={2} className="sticky left-0 z-10 bg-bg-elevated/90 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/50 backdrop-blur">
                {t("journal.table.groupAvg") || "Gruppa o'rtachasi"}
              </td>
              {lessonAvg.map((avg, i) => (
                <td key={i} className="px-2 py-2.5 text-center text-xs font-semibold text-white/50">{avg}</td>
              ))}
              <td className="sticky right-[120px] z-10 bg-bg-elevated/90 px-3 py-2.5 text-center text-xs font-semibold text-white/50 backdrop-blur">
                {students.length > 0
                  ? Math.round(ranked.reduce((sum, r) => sum + r.total, 0) / students.length)
                  : "—"}
              </td>
              <td className="sticky right-[60px] z-10 bg-bg-elevated/90 px-3 py-2.5 text-center text-xs font-semibold text-white/50 backdrop-blur">
                {ranked.length > 0 && ranked.some((r) => r.pct !== null)
                  ? `${Math.round(ranked.filter((r) => r.pct !== null).reduce((sum, r) => sum + (r.pct ?? 0), 0) / ranked.filter((r) => r.pct !== null).length)}%`
                  : "—"}
              </td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Grading view — edit an existing lesson inline (attendance + tests + scores).
   ───────────────────────────────────────────────────────────────────────── */
function GradeLessonView({
  lesson, students, centerId, onSaved, t,
}: {
  lesson: Lesson;
  students: Student[];
  centerId: string;
  onSaved: (updated: Lesson) => void;
  t: (key: string) => string;
}) {
  const [attendance, setAttendance] = React.useState<Record<string, boolean | "late">>(() => ({ ...(lesson.attendance ?? {}) }));
  const [assignments, setAssignments] = React.useState<Assignment[]>(() => (lesson.assignments ?? []).map((a) => ({ ...a })));
  const [grades, setGrades] = React.useState<Record<string, Record<string, string>>>(() => {
    const init: Record<string, Record<string, string>> = {};
    for (const s of students) {
      init[s.id] = {};
      const g = lesson.grades?.[s.id] ?? {};
      for (const [aid, v] of Object.entries(g)) init[s.id][aid] = String(v);
    }
    return init;
  });
  const [newTitle, setNewTitle] = React.useState("");
  const [newMax, setNewMax] = React.useState("10");
  const [newPass, setNewPass] = React.useState("5");
  const [saving, setSaving] = React.useState(false);

  const saveTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const triggerSave = React.useCallback(
    (
      currentAttendance: Record<string, boolean | "late">,
      currentAssignments: Assignment[],
      currentGrades: Record<string, Record<string, string>>
    ) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        setSaving(true);
        try {
          const cleanGrades: Record<string, Record<string, number>> = {};
          for (const s of students) {
            const row = currentGrades[s.id] ?? {};
            const out: Record<string, number> = {};
            for (const a of currentAssignments) {
              const raw = row[a.id];
              if (raw === undefined || raw === "") continue;
              const n = Number(raw);
              if (!Number.isFinite(n)) continue;
              out[a.id] = Math.max(0, Math.min(Math.round(n), a.maxScore));
            }
            if (Object.keys(out).length > 0) cleanGrades[s.id] = out;
          }
          const updated = await repo.updateLesson(centerId, lesson.id, {
            attendance: currentAttendance,
            assignments: currentAssignments,
            grades: cleanGrades,
          });
          onSaved(updated);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [centerId, lesson.id, students, onSaved]
  );

  const addAssignment = () => {
    const title = newTitle.trim();
    const max = Number(newMax);
    const pass = Number(newPass);
    if (!title || !Number.isFinite(max) || max <= 0) return;
    const clampedPass = Math.max(0, Math.min(Number.isFinite(pass) ? pass : 0, max));
    const nextAssignments = [...assignments, { id: uid("asg"), title, maxScore: Math.round(max), passScore: Math.round(clampedPass) }];
    setAssignments(nextAssignments);
    setNewTitle(""); setNewMax("10"); setNewPass("5");
    triggerSave(attendance, nextAssignments, grades);
  };

  const removeAssignment = (id: string) => {
    const nextAssignments = assignments.filter((a) => a.id !== id);
    setAssignments(nextAssignments);
    const nextGrades: typeof grades = {};
    for (const [sid, row] of Object.entries(grades)) {
      const { [id]: _drop, ...rest } = row;
      nextGrades[sid] = rest;
    }
    setGrades(nextGrades);
    triggerSave(attendance, nextAssignments, nextGrades);
  };

  const setGrade = (sid: string, aid: string, value: string) => {
    const nextGrades = { ...grades, [sid]: { ...grades[sid], [aid]: value } };
    setGrades(nextGrades);
    triggerSave(attendance, assignments, nextGrades);
  };

  const toggleAttendance = (sid: string) => {
    const nextAttendance = { ...attendance, [sid]: !attendance[sid] };
    setAttendance(nextAttendance);
    triggerSave(nextAttendance, assignments, grades);
  };

  const livePercent = (sid: string): number | null => {
    if (assignments.length === 0) return null;
    let earned = 0, possible = 0, has = false;
    for (const a of assignments) {
      const raw = grades[sid]?.[a.id];
      if (raw === undefined || raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      has = true;
      earned += Math.max(0, Math.min(n, a.maxScore));
      possible += a.maxScore;
    }
    if (!has || possible === 0) return null;
    return Math.round((earned / possible) * 100);
  };

  return (
    <div className="p-4 relative">
      {saving && (
        <div className="absolute top-4 right-4 flex items-center gap-2 text-xs font-medium text-brand-300 bg-brand-500/10 px-3 py-1.5 rounded-full">
          <div className="h-3 w-3 rounded-full border-2 border-brand-400 border-r-transparent animate-spin" />
          {t("journal.grade.save")}...
        </div>
      )}
      <div className="space-y-5">
        {/* Tests manager */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-white/60">
            <Target className="h-3.5 w-3.5" /> {t("journal.grade.assignments")}
          </label>
          {assignments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {assignments.map((a) => (
                <span key={a.id} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/80">
                  {a.title}
                  <span className="text-white/40">{t("journal.table.maxShort")} {a.maxScore}</span>
                  <span className="text-brand-300/80">{t("journal.wizard.passShort")} {a.passScore}</span>
                  <button type="button" onClick={() => removeAssignment(a.id)} className="text-white/30 hover:text-rose-300">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[10rem] flex-1">
              <label className="mb-1 block text-[10px] text-white/40">{t("journal.wizard.testName")}</label>
              <Input placeholder={t("journal.grade.taskNamePlaceholder")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAssignment(); } }} />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-[10px] text-white/40">{t("journal.grade.maxScore")}</label>
              <Input type="number" min={1} value={newMax} onChange={(e) => setNewMax(e.target.value)} />
            </div>
            <div className="w-24">
              <label className="mb-1 block text-[10px] text-white/40">{t("journal.wizard.passScore")}</label>
              <Input type="number" min={0} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            </div>
            <Button type="button" variant="ghost" onClick={addAssignment}>
              <Plus className="h-4 w-4" /> {t("journal.grade.addTask")}
            </Button>
          </div>
        </div>

        {/* Grading grid */}
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-3 py-2 text-left text-xs font-medium text-white/50">{t("journal.table.student")}</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-white/50">{t("journal.attendance.label")}</th>
                {assignments.map((a) => (
                  <th key={a.id} className="px-2 py-2 text-center text-xs font-medium text-white/50">
                    <div className="truncate">{a.title}</div>
                    <div className="text-[10px] text-white/30">{t("journal.table.maxShort")} {a.maxScore} · {t("journal.wizard.passShort")} {a.passScore}</div>
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-xs font-medium text-white/50">%</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const present = attendance[s.id] !== false;
                const pct = livePercent(s.id);
                return (
                  <tr key={s.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={s.name} color={s.avatarColor} size="sm" />
                        <span className="truncate text-sm text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button type="button" onClick={() => toggleAttendance(s.id)}
                        className={
                          present
                            ? "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition-colors"
                            : "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/30 transition-colors hover:bg-white/10"
                        }
                        title={present ? t("journal.attendance.studentPresent") : t("journal.attendance.studentAbsent")}>
                        {present ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </button>
                    </td>
                    {assignments.map((a) => {
                      const raw = grades[s.id]?.[a.id] ?? "";
                      const n = raw === "" ? null : Number(raw);
                      const passed = n !== null && Number.isFinite(n) ? n >= a.passScore : null;
                      return (
                        <td key={a.id} className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number" min={0} max={a.maxScore} value={raw}
                              onChange={(e) => setGrade(s.id, a.id, e.target.value)}
                              className={
                                "w-14 rounded-lg border bg-white/[0.04] px-2 py-1.5 text-center text-sm text-white outline-none transition focus:ring-2 focus:ring-brand-500/15 " +
                                (passed === null ? "border-white/10 focus:border-brand-400/60"
                                  : passed ? "border-emerald-400/40" : "border-rose-400/40")
                              }
                              placeholder="—"
                            />
                            {passed === true && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
                            {passed === false && <X className="h-3.5 w-3.5 text-rose-300" />}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-center">
                      <span className={`text-sm font-semibold ${pct !== null ? percentColor(pct) : "text-white/25"}`}>
                        {pct !== null ? `${pct}%` : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-xs text-white/35">{t("journal.grade.noTasks")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Per-student performance charts:
   • type "avg"  — a single line of the student's overall % per lesson.
   • type "tests" — one coloured line per distinct assignment title.
   X-axis = lessons (dates) in both.
   ───────────────────────────────────────────────────────────────────────── */
function StudentChartModal({
  student, lessons, onClose, t,
}: {
  student: Student;
  lessons: Lesson[];
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [chartType, setChartType] = React.useState<"avg" | "tests">("avg");

  // Only lessons that have assignments form the x-axis (graded lessons).
  const gradedLessons = React.useMemo(
    () => lessons.filter((l) => (l.assignments?.length ?? 0) > 0),
    [lessons]
  );
  const xLabels = React.useMemo(() => gradedLessons.map((l) => shortDate(l.date)), [gradedLessons]);

  // Type 1 — average line.
  const avgSeries: LineSeries[] = React.useMemo(() => {
    const avg = averagePercent(gradedLessons, student.id);
    return [{
      label: t("journal.chart.average"),
      color: avg !== null ? percentStroke(avg) : "#c7d2fe",
      points: gradedLessons.map((l) => lessonPercentForStudent(l, student.id)),
    }];
  }, [gradedLessons, student.id, t]);

  // Type 2 — one line per distinct assignment title, in first-seen order.
  const testSeries: LineSeries[] = React.useMemo(() => {
    const titles: string[] = [];
    for (const l of gradedLessons) {
      for (const a of l.assignments ?? []) {
        if (!titles.includes(a.title)) titles.push(a.title);
      }
    }
    return titles.map((title, i) => ({
      label: title,
      color: assignmentColor(i),
      points: gradedLessons.map((l) => assignmentPercent(l, title, student.id)),
    }));
  }, [gradedLessons, student.id]);

  const series = chartType === "avg" ? avgSeries : testSeries;
  const avg = averagePercent(gradedLessons, student.id);

  return (
    <Modal open onClose={onClose} title={student.name} description={t("journal.chart.subtitle")} className="max-w-2xl">
      <div className="mt-2 space-y-4">
        {/* type toggle */}
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => setChartType("avg")}
              className={chartType === "avg"
                ? "rounded-lg bg-brand-500/20 px-3 py-1.5 text-xs font-medium text-brand-100"
                : "rounded-lg px-3 py-1.5 text-xs text-white/50 hover:text-white"}
            >
              {t("journal.chart.typeAvg")}
            </button>
            <button
              onClick={() => setChartType("tests")}
              className={chartType === "tests"
                ? "rounded-lg bg-brand-500/20 px-3 py-1.5 text-xs font-medium text-brand-100"
                : "rounded-lg px-3 py-1.5 text-xs text-white/50 hover:text-white"}
            >
              {t("journal.chart.typeTests")}
            </button>
          </div>
          {avg !== null && (
            <span className="text-sm text-white/60">
              {t("journal.chart.average")}: <span className={`font-bold ${percentColor(avg)}`}>{avg}%</span>
            </span>
          )}
        </div>

        {gradedLessons.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/40">
            {t("journal.chart.noData")}
          </p>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <LineChart series={series} xLabels={xLabels} />
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>{t("journal.grade.close")}</Button>
        </div>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Comparison chart — average % per student across the group.
   ───────────────────────────────────────────────────────────────────────── */
function CompareModal({
  students, lessons, onClose, t,
}: {
  students: Student[];
  lessons: Lesson[];
  onClose: () => void;
  t: (key: string) => string;
}) {
  const rows = React.useMemo(
    () => students.map((s) => ({ student: s, avg: averagePercent(lessons, s.id) })).sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1)),
    [students, lessons]
  );

  const graded = rows.filter((r) => r.avg !== null);
  const groupAvg = graded.length ? Math.round(graded.reduce((sum, r) => sum + (r.avg as number), 0) / graded.length) : null;

  return (
    <Modal open onClose={onClose} title={t("journal.compare.title")} description={t("journal.compare.subtitle")} className="max-w-2xl">
      <div className="mt-2 space-y-4">
        {groupAvg !== null && (
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-sm text-white/60">{t("journal.compare.groupAverage")}</span>
            <span className={`text-lg font-bold ${percentColor(groupAvg)}`}>{groupAvg}%</span>
          </div>
        )}
        <Stagger className="space-y-2.5">
          {rows.map(({ student, avg }) => (
            <FadeItem key={student.id}>
              <div className="flex items-center gap-3">
                <div className="flex w-40 shrink-0 items-center gap-2">
                  <Avatar name={student.name} color={student.avatarColor} size="sm" />
                  <span className="truncate text-sm text-white/80">{student.name}</span>
                </div>
                <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-white/[0.04]">
                  {avg !== null && (
                    <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{ width: `${avg}%`, background: `linear-gradient(90deg, ${percentStroke(avg)}66, ${percentStroke(avg)})` }} />
                  )}
                </div>
                <span className={`w-12 shrink-0 text-right text-sm font-bold ${avg !== null ? percentColor(avg) : "text-white/25"}`}>
                  {avg !== null ? `${avg}%` : "—"}
                </span>
              </div>
            </FadeItem>
          ))}
        </Stagger>
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>{t("journal.grade.close")}</Button>
        </div>
      </div>
    </Modal>
  );
}
