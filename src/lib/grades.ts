import { Lesson } from "../types";

/**
 * Score a single student earned in one lesson, expressed as a percentage of the
 * lesson's total possible points. Returns null when the lesson has no assignments
 * or the student has no recorded grades (so callers can show "—" instead of 0%).
 */
export function lessonPercentForStudent(lesson: Lesson, studentId: string): number | null {
  const assignments = lesson.assignments ?? [];
  if (assignments.length === 0) return null;

  const studentGrades = lesson.grades?.[studentId];
  if (!studentGrades) return null;

  let earned = 0;
  let possible = 0;
  let hasAny = false;
  for (const a of assignments) {
    const raw = studentGrades[a.id];
    if (raw === undefined || raw === null) continue;
    hasAny = true;
    earned += Math.max(0, Math.min(raw, a.maxScore));
    possible += a.maxScore;
  }
  if (!hasAny || possible === 0) return null;
  return Math.round((earned / possible) * 100);
}

/** Sum of maxScore across a lesson's assignments. */
export function lessonMaxTotal(lesson: Lesson): number {
  return (lesson.assignments ?? []).reduce((sum, a) => sum + (a.maxScore || 0), 0);
}

/**
 * A student's average performance across the given lessons (only lessons where
 * they have a recorded percentage count). Returns null when there is nothing to
 * average yet.
 */
export function averagePercent(lessons: Lesson[], studentId: string): number | null {
  const pcts = lessons
    .map((l) => lessonPercentForStudent(l, studentId))
    .filter((p): p is number => p !== null);
  if (pcts.length === 0) return null;
  return Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
}

/**
 * Time-ordered performance series for a student — one point per graded lesson,
 * oldest first. Used to draw the progress sparkline. Lessons without a grade for
 * this student are skipped.
 */
export function progressSeries(lessons: Lesson[], studentId: string): number[] {
  return [...lessons]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => lessonPercentForStudent(l, studentId))
    .filter((p): p is number => p !== null);
}

/**
 * Change in a student's lesson percentage compared to their previous graded
 * lesson (chronologically before `lesson`). Positive = improved. Returns null
 * when there is no earlier graded lesson to compare against, or this lesson has
 * no grade for the student.
 */
export function progressDelta(
  lessons: Lesson[],
  lesson: Lesson,
  studentId: string
): number | null {
  const current = lessonPercentForStudent(lesson, studentId);
  if (current === null) return null;
  const earlier = [...lessons]
    .filter((l) => l.date < lesson.date || (l.date === lesson.date && l.id !== lesson.id))
    .sort((a, b) => a.date.localeCompare(b.date));
  for (let i = earlier.length - 1; i >= 0; i--) {
    const prev = lessonPercentForStudent(earlier[i], studentId);
    if (prev !== null) return current - prev;
  }
  return null;
}

/** Whether a student passed a single assignment (score ≥ passScore). null if ungraded. */
export function assignmentPassed(
  lesson: Lesson,
  assignmentId: string,
  studentId: string
): boolean | null {
  const a = (lesson.assignments ?? []).find((x) => x.id === assignmentId);
  if (!a) return null;
  const raw = lesson.grades?.[studentId]?.[assignmentId];
  if (raw === undefined || raw === null) return null;
  return raw >= a.passScore;
}

/**
 * Lesson-level pass summary for a student: how many assignments they passed out
 * of how many they were graded on. Returns null when they have no grades.
 */
export function passSummary(
  lesson: Lesson,
  studentId: string
): { passed: number; graded: number } | null {
  const assignments = lesson.assignments ?? [];
  let passed = 0;
  let graded = 0;
  for (const a of assignments) {
    const p = assignmentPassed(lesson, a.id, studentId);
    if (p === null) continue;
    graded++;
    if (p) passed++;
  }
  if (graded === 0) return null;
  return { passed, graded };
}

/** Tailwind text color token for a percentage band. */
export function percentColor(pct: number): string {
  if (pct >= 85) return "text-emerald-300";
  if (pct >= 70) return "text-brand-200";
  if (pct >= 50) return "text-amber-300";
  return "text-rose-300";
}

/** Stroke color (hex) matching percentColor, for SVG marks. */
export function percentStroke(pct: number): string {
  if (pct >= 85) return "#6ee7b7";
  if (pct >= 70) return "#c7d2fe";
  if (pct >= 50) return "#fcd34d";
  return "#fda4af";
}

/**
 * Percentage a student earned on ONE specific assignment title in a given lesson.
 * Assignments are matched by title across lessons (ids differ per lesson), so a
 * recurring test like "Quiz" forms a single line in the per-assignment chart.
 * Returns null when the lesson has no such assignment or no grade for it.
 */
export function assignmentPercent(
  lesson: Lesson,
  assignmentTitle: string,
  studentId: string
): number | null {
  const a = (lesson.assignments ?? []).find((x) => x.title === assignmentTitle);
  if (!a || a.maxScore <= 0) return null;
  const raw = lesson.grades?.[studentId]?.[a.id];
  if (raw === undefined || raw === null) return null;
  return Math.round((Math.max(0, Math.min(raw, a.maxScore)) / a.maxScore) * 100);
}

/** Distinct, evenly-spread hues for per-assignment chart lines. */
const ASSIGNMENT_COLORS = [
  "#818cf8", "#34d399", "#fbbf24", "#f472b6", "#22d3ee",
  "#a78bfa", "#fb923c", "#4ade80", "#e879f9", "#60a5fa",
];
export function assignmentColor(index: number): string {
  return ASSIGNMENT_COLORS[index % ASSIGNMENT_COLORS.length];
}
