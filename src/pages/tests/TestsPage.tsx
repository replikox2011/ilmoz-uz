import * as React from "react";
import {
  ClipboardList, Sparkles, Trash2, Play, X, CheckCircle2,
  Globe, ChevronRight, Users, BarChart3, Loader2, Pencil, Plus, Save, Wand2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { generateTestWithWebSearch, editTestWithAI } from "../../components/copilot/generateTest";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { Test, TestQuestion, TestSubmission } from "../../types";
import { isStaff } from "../../lib/access";
import { useI18n } from "../../i18n/I18nContext";
import { cn, uid } from "../../lib/utils";

// ── scoring ──────────────────────────────────────────────────────────────────
function maxScoreOf(test: Test): number {
  return test.questions.reduce((sum, q) => sum + q.points, 0);
}

function isCorrect(q: TestQuestion, answer: string | undefined): boolean {
  if (answer === undefined || answer === "") return false;
  if (q.type === "mcq") return String(q.correctAnswer) === answer;
  return String(q.correctAnswer).trim().toLowerCase() === answer.trim().toLowerCase();
}

function scoreOf(test: Test, answers: Record<string, string>): number {
  return test.questions.reduce((sum, q) => sum + (isCorrect(q, answers[q.id]) ? q.points : 0), 0);
}

const STATUS_BADGE: Record<Test["status"], { variant: "neutral" | "success" | "warning"; key: string }> = {
  draft: { variant: "warning", key: "tests.status.draft" },
  active: { variant: "success", key: "tests.status.active" },
  closed: { variant: "neutral", key: "tests.status.closed" },
};

// ── page ─────────────────────────────────────────────────────────────────────
export function TestsPage() {
  const { t } = useI18n();
  const { center, user } = useAuth();
  const data = useCenterData();

  if (!user || !center) return null;
  const teacherView = isStaff(user.role) || user.role === "teacher";

  return teacherView
    ? <TeacherTests centerId={center.id} userId={user.id} data={data} t={t} />
    : <StudentTests centerId={center.id} userId={user.id} data={data} t={t} />;
}

// ═════════════════════════════════════════════════════════════════════════════
// Teacher / staff view
// ═════════════════════════════════════════════════════════════════════════════
function TeacherTests({ centerId, userId, data, t }: {
  centerId: string;
  userId: string;
  data: ReturnType<typeof useCenterData>;
  t: (k: string) => string;
}) {
  const [showGenerate, setShowGenerate] = React.useState(false);
  const [editingTest, setEditingTest] = React.useState<Test | null | "new">(null);
  const [activating, setActivating] = React.useState<Test | null>(null);
  const [viewing, setViewing] = React.useState<Test | null>(null);

  const tests = React.useMemo(
    () => [...data.tests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.tests],
  );

  const remove = async (test: Test) => {
    if (!window.confirm(t("tests.confirmDelete"))) return;
    await repo.deleteTest(centerId, test.id);
  };

  const close = async (test: Test) => {
    await repo.updateTest(centerId, test.id, { status: "closed" });
  };

  return (
    <div>
      <PageHeader
        title={t("tests.title")}
        subtitle={t("tests.subtitle")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditingTest("new")}>
              <Plus className="h-4 w-4" /> {t("tests.createManual")}
            </Button>
            <Button onClick={() => setShowGenerate(true)}>
              <Sparkles className="h-4 w-4" /> {t("tests.generate")}
            </Button>
          </div>
        }
      />

      {data.loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : tests.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-white/20" />
          <p className="mt-3 text-sm text-white/50">{t("tests.empty")}</p>
          <p className="mt-1 text-xs text-white/30">{t("tests.emptyHint")}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingTest("new")}>
              <Plus className="h-4 w-4" /> {t("tests.createManual")}
            </Button>
            <Button size="sm" onClick={() => setShowGenerate(true)}>
              <Sparkles className="h-4 w-4" /> {t("tests.generate")}
            </Button>
          </div>
        </GlassCard>
      ) : (
        <Stagger className="space-y-3">
          {tests.map(test => {
            const group = data.groups.find(g => g.id === test.groupId);
            const badge = STATUS_BADGE[test.status];
            return (
              <FadeItem key={test.id}>
                <GlassCard className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button className="min-w-0 flex-1 text-left" onClick={() => setViewing(test)}>
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-white">{test.title}</p>
                        <Badge variant={badge.variant}>{t(badge.key)}</Badge>
                        {test.sources && test.sources.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-white/35">
                            <Globe className="h-3 w-3" /> {test.sources.length}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-white/40">
                        {test.questions.length} {t("tests.questionsShort")} · {maxScoreOf(test)} {t("tests.pointsShort")}
                        {group && <> · <Users className="inline h-3 w-3" /> {group.name}</>}
                      </p>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <Button size="icon" variant="ghost" onClick={() => setEditingTest(test)} title="Тестни таҳрирлаш">
                        <Pencil className="h-4 w-4 text-white/50 hover:text-white" />
                      </Button>
                      {test.status === "draft" && (
                        <Button size="sm" onClick={() => setActivating(test)}>
                          <Play className="h-3.5 w-3.5" /> {t("tests.activate")}
                        </Button>
                      )}
                      {test.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => close(test)}>
                          <X className="h-3.5 w-3.5" /> {t("tests.close")}
                        </Button>
                      )}
                      {test.status !== "draft" && (
                        <Button size="sm" variant="glass" onClick={() => setViewing(test)}>
                          <BarChart3 className="h-3.5 w-3.5" /> {t("tests.results")}
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => remove(test)}>
                        <Trash2 className="h-4 w-4 text-white/40" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </FadeItem>
            );
          })}
        </Stagger>
      )}

      <GenerateModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        centerId={centerId}
        userId={userId}
        t={t}
      />

      <EditTestModal
        open={editingTest !== null}
        test={editingTest === "new" ? null : editingTest}
        onClose={() => setEditingTest(null)}
        centerId={centerId}
        userId={userId}
        t={t}
      />

      <ActivateModal
        test={activating}
        onClose={() => setActivating(null)}
        centerId={centerId}
        groups={data.groups}
        t={t}
      />

      <TestDetailModal
        test={viewing}
        onClose={() => setViewing(null)}
        centerId={centerId}
        data={data}
        t={t}
      />
    </div>
  );
}

// ── edit/create manual & AI test modal ───────────────────────────────────────
function EditTestModal({
  open,
  test,
  onClose,
  centerId,
  userId,
  t,
}: {
  open: boolean;
  test: Test | null;
  onClose: () => void;
  centerId: string;
  userId: string;
  t: (k: string) => string;
}) {
  const [title, setTitle] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [questions, setQuestions] = React.useState<TestQuestion[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // AI edit states
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  React.useEffect(() => {
    if (test) {
      setTitle(test.title);
      setTopic(test.topic || "");
      setQuestions(test.questions || []);
    } else {
      setTitle("");
      setTopic("");
      setQuestions([
        {
          id: uid("q"),
          type: "mcq",
          prompt: "",
          options: ["A", "B", "C", "D"],
          correctAnswer: 0,
          points: 1,
        },
      ]);
    }
    setError(null);
    setAiPrompt("");
  }, [test, open]);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: uid("q"),
        type: "mcq",
        prompt: "",
        options: ["A", "B", "C", "D"],
        correctAnswer: 0,
        points: 1,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, fields: Partial<TestQuestion>) => {
    setQuestions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...fields };
      return next;
    });
  };

  const handleOptionChange = (qIndex: number, optIndex: number, val: string) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      const opts = [...(q.options || [])];
      opts[optIndex] = val;
      q.options = opts;
      next[qIndex] = q;
      return next;
    });
  };

  const handleAddOption = (qIndex: number) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      const opts = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
      q.options = opts;
      next[qIndex] = q;
      return next;
    });
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    setQuestions(prev => {
      const next = [...prev];
      const q = { ...next[qIndex] };
      const opts = (q.options || []).filter((_, i) => i !== optIndex);
      q.options = opts;
      if (typeof q.correctAnswer === "number" && q.correctAnswer >= opts.length) {
        q.correctAnswer = Math.max(0, opts.length - 1);
      }
      next[qIndex] = q;
      return next;
    });
  };

  const handleApplyAI = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    setError(null);
    try {
      const updated = await editTestWithAI(questions, aiPrompt.trim());
      setQuestions(updated);
      setAiPrompt("");
    } catch (err: any) {
      setError(err?.message ?? "Error.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("tests.fieldTitleLabel"));
      return;
    }
    if (questions.length === 0) {
      setError("Please add at least one question");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (test) {
        await repo.updateTest(centerId, test.id, {
          title: title.trim(),
          topic: topic.trim() || title.trim(),
          questions,
        });
      } else {
        await repo.createTest({
          centerId,
          title: title.trim(),
          topic: topic.trim() || title.trim(),
          createdBy: userId,
          questions,
          status: "draft",
          createdAt: new Date().toISOString(),
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Error saving test");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={test ? t("tests.editTest") : t("tests.createManual")}
      description={t("tests.editDesc")}
      className="max-w-3xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Basic fields */}
        <div>
          <label className="mb-1 block text-xs text-white/50 font-medium">{t("tests.fieldTitleLabel")}</label>
          <Input
            placeholder={t("tests.fieldTitle")}
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>

        {/* AI Refinement Box */}
        {test && (
          <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-brand-300">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span>{t("tests.aiEditTitle")}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t("tests.aiEditPlaceholder")}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-white/35 outline-none focus:border-brand-400/50"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyAI();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleApplyAI}
                disabled={!aiPrompt.trim() || aiLoading}
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {t("tests.aiApply")}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}

        {/* Questions list */}
        <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
          {questions.map((q, qIndex) => (
            <div key={q.id || qIndex} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                <span className="text-xs font-semibold text-brand-400">
                  {t("tests.questionIndex")} {qIndex + 1}
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <span>{t("tests.points")}:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={q.points || 1}
                      onChange={e => handleQuestionChange(qIndex, { points: Number(e.target.value) || 1 })}
                      className="w-12 rounded-lg border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-center text-xs text-white outline-none"
                    />
                  </div>
                  <select
                    value={q.type}
                    onChange={e => handleQuestionChange(qIndex, {
                      type: e.target.value as "mcq" | "short",
                      options: e.target.value === "mcq" ? (q.options?.length ? q.options : ["A", "B", "C", "D"]) : undefined,
                      correctAnswer: e.target.value === "mcq" ? 0 : "",
                    })}
                    className="rounded-lg border border-white/10 bg-[#0d0f17] px-2 py-0.5 text-xs text-white outline-none"
                  >
                    <option value="mcq">{t("tests.typeMcq")}</option>
                    <option value="short">{t("tests.typeShort")}</option>
                  </select>
                  {questions.length > 1 && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-white/30 hover:text-red-400"
                      onClick={() => handleRemoveQuestion(qIndex)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Question prompt */}
              <div>
                <textarea
                  rows={2}
                  placeholder={t("tests.fieldPromptPlaceholder")}
                  value={q.prompt}
                  onChange={e => handleQuestionChange(qIndex, { prompt: e.target.value })}
                  className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-brand-400/50"
                  required
                />
              </div>

              {/* MCQ Options */}
              {q.type === "mcq" && (
                <div className="space-y-1.5 pl-2">
                  <p className="text-[11px] font-medium text-white/40">{t("tests.optionsTitle")}</p>
                  {(q.options || []).map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${q.id || qIndex}`}
                        checked={Number(q.correctAnswer) === optIndex}
                        onChange={() => handleQuestionChange(qIndex, { correctAnswer: optIndex })}
                        className="h-4 w-4 accent-brand-500 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-brand-400/50"
                        placeholder={`Option ${optIndex + 1}`}
                        required
                      />
                      {(q.options?.length || 0) > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, optIndex)}
                          className="text-white/20 hover:text-red-400 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-400 hover:underline"
                  >
                    <Plus className="h-3 w-3" /> {t("tests.addOption")}
                  </button>
                </div>
              )}

              {/* Short Answer */}
              {q.type === "short" && (
                <div className="pl-2">
                  <label className="mb-1 block text-[11px] font-medium text-white/40">{t("tests.expectedAnswer")}</label>
                  <input
                    type="text"
                    value={String(q.correctAnswer || "")}
                    onChange={e => handleQuestionChange(qIndex, { correctAnswer: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-brand-400/50"
                    placeholder={t("tests.shortAnswerPlaceholder")}
                    required
                  />
                </div>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full py-2 text-xs"
            onClick={handleAddQuestion}
          >
            <Plus className="h-3.5 w-3.5" /> {t("tests.addQuestion")}
          </Button>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" /> {test ? t("tests.save") : t("tests.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── generate modal ───────────────────────────────────────────────────────────
function GenerateModal({ open, onClose, centerId, userId, t }: {
  open: boolean;
  onClose: () => void;
  centerId: string;
  userId: string;
  t: (k: string) => string;
}) {
  const [title, setTitle] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [count, setCount] = React.useState("5");
  const [mcq, setMcq] = React.useState("5");
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const questionCount = Math.min(20, Math.max(1, Number(count) || 5));
      const mcqCount = Math.min(questionCount, Math.max(0, Number(mcq) || 0));
      const { questions, sources } = await generateTestWithWebSearch(topic.trim(), questionCount, mcqCount);
      if (questions.length === 0) throw new Error(t("tests.generateEmpty"));
      await repo.createTest({
        centerId,
        title: title.trim() || topic.trim(),
        topic: topic.trim(),
        createdBy: userId,
        questions,
        status: "draft",
        createdAt: new Date().toISOString(),
        ...(sources.length ? { sources } : {}),
      });
      setTitle(""); setTopic(""); setCount("5"); setMcq("5");
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal open={open} onClose={() => !generating && onClose()} title={t("tests.generateTitle")} description={t("tests.generateDesc")}>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-white/40 font-medium">{t("tests.aiGenerateTitleLabel")}</label>
          <Input
            placeholder={t("tests.fieldTitle")}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/40 font-medium">{t("tests.aiGeneratePromptLabel")}</label>
          <textarea
            rows={3}
            placeholder={t("tests.aiGeneratePromptPlaceholder")}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-brand-400/50"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-white/40">{t("tests.fieldCount")}</label>
            <Input type="number" min={1} max={20} value={count} onChange={e => setCount(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/40">{t("tests.fieldMcq")}</label>
            <Input type="number" min={0} max={20} value={mcq} onChange={e => setMcq(e.target.value)} />
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-white/35">
          <Globe className="h-3.5 w-3.5 shrink-0" /> {t("tests.webSearchHint")}
        </p>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={generating}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={!topic.trim() || generating}>
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("tests.generating")}</>
              : <><Sparkles className="h-4 w-4" /> {t("tests.generate")}</>}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── activate modal ───────────────────────────────────────────────────────────
function ActivateModal({ test, onClose, centerId, groups, t }: {
  test: Test | null;
  onClose: () => void;
  centerId: string;
  groups: ReturnType<typeof useCenterData>["groups"];
  t: (k: string) => string;
}) {
  const [groupId, setGroupId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { setGroupId(""); }, [test]);

  const activate = async () => {
    if (!test || !groupId || saving) return;
    setSaving(true);
    try {
      await repo.updateTest(centerId, test.id, {
        status: "active",
        groupId,
        activatedAt: new Date().toISOString(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!test} onClose={onClose} title={t("tests.activateTitle")} description={t("tests.activateDesc")}>
      <div className="space-y-2">
        {groups.filter(g => g.status === "active").map(g => (
          <button
            key={g.id}
            onClick={() => setGroupId(g.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
              groupId === g.id
                ? "border-brand-400/50 bg-brand-500/15 text-white"
                : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white",
            )}
          >
            <span>{g.name}</span>
            <span className="text-xs text-white/35">{g.studentIds.length} {t("tests.studentsShort")}</span>
          </button>
        ))}
        {groups.filter(g => g.status === "active").length === 0 && (
          <p className="py-4 text-center text-sm text-white/40">{t("tests.noGroups")}</p>
        )}
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
        <Button onClick={activate} disabled={!groupId} loading={saving}>
          <Play className="h-4 w-4" /> {t("tests.activate")}
        </Button>
      </div>
    </Modal>
  );
}

// ── teacher detail / results modal ───────────────────────────────────────────
function TestDetailModal({ test, onClose, centerId, data, t }: {
  test: Test | null;
  onClose: () => void;
  centerId: string;
  data: ReturnType<typeof useCenterData>;
  t: (k: string) => string;
}) {
  const [submissions, setSubmissions] = React.useState<TestSubmission[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!test || test.status === "draft") { setSubmissions([]); return; }
    let alive = true;
    setLoading(true);
    repo.listTestSubmissions(centerId, test.id)
      .then(s => { if (alive) setSubmissions(s); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [test, centerId]);

  if (!test) return null;
  const group = data.groups.find(g => g.id === test.groupId);
  const groupStudents = group
    ? data.students.filter(s => group.studentIds.includes(s.id))
    : [];

  return (
    <Modal open={!!test} onClose={onClose} title={test.title} className="max-w-2xl">
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        {/* Results (active/closed) */}
        {test.status !== "draft" && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
              {t("tests.results")} {group && `— ${group.name}`}
            </p>
            {loading ? (
              <Skeleton className="h-16" />
            ) : (
              <div className="space-y-1.5">
                {groupStudents.map(s => {
                  const sub = submissions.find(x => x.studentId === s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm">
                      <span className="text-white/80">{s.name}</span>
                      {sub ? (
                        <span className="font-semibold text-emerald-300">
                          {sub.score}/{sub.maxScore}
                        </span>
                      ) : (
                        <span className="text-xs text-white/30">{t("tests.notSubmitted")}</span>
                      )}
                    </div>
                  );
                })}
                {groupStudents.length === 0 && (
                  <p className="text-xs text-white/35">{t("tests.noGroups")}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Questions */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
            {t("tests.questions")}
          </p>
          <div className="space-y-2.5">
            {test.questions.map((q, i) => (
              <div key={q.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
                <p className="text-sm text-white/85">
                  <span className="mr-1.5 text-white/35">{i + 1}.</span>{q.prompt}
                  <span className="ml-2 text-[10px] text-white/30">{q.points} {t("tests.pointsShort")}</span>
                </p>
                {q.type === "mcq" && q.options && (
                  <div className="mt-2 space-y-1">
                    {q.options.map((opt, oi) => (
                      <p key={oi} className={cn(
                        "flex items-center gap-1.5 text-xs",
                        oi === Number(q.correctAnswer) ? "text-emerald-300" : "text-white/45",
                      )}>
                        {oi === Number(q.correctAnswer) && <CheckCircle2 className="h-3 w-3" />}
                        {opt}
                      </p>
                    ))}
                  </div>
                )}
                {q.type === "short" && (
                  <p className="mt-1.5 text-xs text-emerald-300/80">
                    {t("tests.answer")}: {String(q.correctAnswer)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sources */}
        {test.sources && test.sources.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">
              {t("tests.sources")}
            </p>
            <div className="space-y-1">
              {test.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer"
                   className="flex items-center gap-1.5 truncate text-xs text-brand-300 hover:underline">
                  <Globe className="h-3 w-3 shrink-0" /> {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Student view
// ═════════════════════════════════════════════════════════════════════════════
function StudentTests({ centerId, userId, data, t }: {
  centerId: string;
  userId: string;
  data: ReturnType<typeof useCenterData>;
  t: (k: string) => string;
}) {
  const [taking, setTaking] = React.useState<Test | null>(null);
  const [mySubs, setMySubs] = React.useState<Record<string, TestSubmission>>({});
  const [subsLoading, setSubsLoading] = React.useState(true);

  // Load my submissions for all visible tests
  React.useEffect(() => {
    let alive = true;
    const run = async () => {
      setSubsLoading(true);
      const entries: [string, TestSubmission][] = [];
      for (const test of data.tests) {
        const subs = await repo.listTestSubmissions(centerId, test.id);
        const mine = subs.find(s => s.studentId === userId);
        if (mine) entries.push([test.id, mine]);
      }
      if (alive) { setMySubs(Object.fromEntries(entries)); setSubsLoading(false); }
    };
    if (!data.loading) run();
    return () => { alive = false; };
  }, [data.tests, data.loading, centerId, userId]);

  return (
    <div>
      <PageHeader title={t("tests.title")} subtitle={t("tests.studentSubtitle")} />

      {data.loading || subsLoading ? (
        <div className="space-y-3">
          {[0, 1].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : data.tests.length === 0 ? (
        <GlassCard className="p-10 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-white/20" />
          <p className="mt-3 text-sm text-white/50">{t("tests.studentEmpty")}</p>
        </GlassCard>
      ) : (
        <Stagger className="space-y-3">
          {data.tests.map(test => {
            const sub = mySubs[test.id];
            return (
              <FadeItem key={test.id}>
                <GlassCard className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">{test.title}</p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {test.questions.length} {t("tests.questionsShort")} · {maxScoreOf(test)} {t("tests.pointsShort")}
                      </p>
                    </div>
                    {sub ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3" /> {sub.score}/{sub.maxScore}
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => setTaking(test)}>
                        {t("tests.start")} <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </GlassCard>
              </FadeItem>
            );
          })}
        </Stagger>
      )}

      <TakeTestModal
        test={taking}
        onClose={() => setTaking(null)}
        centerId={centerId}
        userId={userId}
        onSubmitted={sub => setMySubs(prev => ({ ...prev, [sub.testId]: sub }))}
        t={t}
      />
    </div>
  );
}

// ── take test modal ──────────────────────────────────────────────────────────
function TakeTestModal({ test, onClose, centerId, userId, onSubmitted, t }: {
  test: Test | null;
  onClose: () => void;
  centerId: string;
  userId: string;
  onSubmitted: (sub: TestSubmission) => void;
  t: (k: string) => string;
}) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState<TestSubmission | null>(null);

  React.useEffect(() => { setAnswers({}); setResult(null); }, [test]);

  if (!test) return null;

  const answered = test.questions.filter(q => (answers[q.id] ?? "") !== "").length;

  const submit = async () => {
    if (saving || !test.groupId) return;
    setSaving(true);
    try {
      const score = scoreOf(test, answers);
      const sub = await repo.createTestSubmission({
        centerId,
        testId: test.id,
        groupId: test.groupId,
        studentId: userId,
        answers,
        score,
        maxScore: maxScoreOf(test),
        submittedAt: new Date().toISOString(),
      });
      setResult(sub);
      onSubmitted(sub);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!test} onClose={() => !saving && onClose()} title={test.title} className="max-w-2xl">
      {result ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <p className="mt-3 text-lg font-semibold text-white">{t("tests.submitted")}</p>
          <p className="mt-1 text-3xl font-bold text-emerald-300">{result.score} / {result.maxScore}</p>
          <Button className="mt-5" onClick={onClose}>{t("tests.done")}</Button>
        </div>
      ) : (
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          {test.questions.map((q, i) => (
            <div key={q.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3.5">
              <p className="text-sm text-white/90">
                <span className="mr-1.5 text-white/35">{i + 1}.</span>{q.prompt}
                <span className="ml-2 text-[10px] text-white/30">{q.points} {t("tests.pointsShort")}</span>
              </p>
              {q.type === "mcq" && q.options ? (
                <div className="mt-2.5 space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: String(oi) }))}
                      className={cn(
                        "block w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                        answers[q.id] === String(oi)
                          ? "border-brand-400/50 bg-brand-500/15 text-white"
                          : "border-white/[0.08] bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <Input
                  className="mt-2.5"
                  placeholder={t("tests.shortAnswerPlaceholder")}
                  value={answers[q.id] ?? ""}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="sticky bottom-0 flex items-center justify-between rounded-2xl bg-[#0d0f17]/90 p-3 backdrop-blur">
            <p className="text-xs text-white/40">
              {answered}/{test.questions.length} {t("tests.answered")}
            </p>
            <Button onClick={submit} loading={saving} disabled={answered === 0}>
              <CheckCircle2 className="h-4 w-4" /> {t("tests.submit")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
