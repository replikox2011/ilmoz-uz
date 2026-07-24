import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  GraduationCap,
  BarChart3,
  TrendingUp,
  BookOpen,
  Percent,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { SectionTitle } from "../dashboard/widgets";
import { Group, Weekday } from "../../types";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const BRAND = "#3b6bff";
const PURPLE = "#8b5cf6";
const EMERALD = "#10b981";
const AMBER = "#f59e0b";

const BAR_COLORS = [BRAND, PURPLE, EMERALD, AMBER];

const WEEKDAY_KEYS: { key: Weekday; tKey: string }[] = [
  { key: "mon", tKey: "analytics.weekday.mon" },
  { key: "tue", tKey: "analytics.weekday.tue" },
  { key: "wed", tKey: "analytics.weekday.wed" },
  { key: "thu", tKey: "analytics.weekday.thu" },
  { key: "fri", tKey: "analytics.weekday.fri" },
  { key: "sat", tKey: "analytics.weekday.sat" },
  { key: "sun", tKey: "analytics.weekday.sun" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function AnalyticsPage() {
  const { center } = useAuth();
  const { t } = useI18n();
  const data = useCenterData();

  return (
    <div>
      <PageHeader
        title={t("analytics.title")}
        subtitle={
          center
            ? `${t("analytics.subtitlePrefix")} ${center.name}.`
            : t("analytics.subtitleDefault")
        }
      />

      {data.loading ? (
        <AnalyticsSkeleton />
      ) : (
        <AnalyticsContent data={data} t={t} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------
function AnalyticsContent({
  data,
  t,
}: {
  data: ReturnType<typeof useCenterData>;
  t: (key: string) => string;
}) {
  const { groups, students, rooms, teachers, courses } = data;

  const activeGroups = groups.filter((g) => g.status === "active");

  const fillables = groups.filter((g) => g.maxStudents > 0);
  const avgFill =
    fillables.length === 0
      ? 0
      : Math.round(
          (fillables.reduce(
            (sum, g) => sum + g.studentIds.length / g.maxStudents,
            0
          ) /
            fillables.length) *
            100
        );

  const kpis = [
    { label: t("analytics.kpi.students"), value: students.length, icon: GraduationCap, accent: EMERALD },
    { label: t("analytics.kpi.activeGroups"), value: activeGroups.length, icon: Users, accent: BRAND },
    { label: t("analytics.kpi.avgFill"), value: `${avgFill}%`, icon: Percent, accent: PURPLE },
    { label: t("analytics.kpi.teachers"), value: teachers.length, icon: TrendingUp, accent: AMBER },
  ];

  const noData =
    groups.length === 0 && students.length === 0 && rooms.length === 0;

  if (noData) {
    return (
      <GlassCard className="p-6">
        <EmptyMessage
          icon={BarChart3}
          title={t("analytics.empty.noData.title")}
          desc={t("analytics.empty.noData.desc")}
        />
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <StatCard key={k.label} {...k} />
        ))}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chart 1 — Groups by status */}
        <FadeItem>
          <GlassCard className="p-6">
            <SectionTitle title={t("analytics.chart.groupsByStatus")} />
            <GroupsByStatusChart groups={groups} t={t} />
          </GlassCard>
        </FadeItem>

        {/* Chart 4 — Lessons per weekday */}
        <FadeItem>
          <GlassCard className="p-6">
            <SectionTitle title={t("analytics.chart.lessonsPerWeekday")} />
            <LessonsPerWeekdayChart groups={activeGroups} t={t} />
          </GlassCard>
        </FadeItem>

        {/* Chart 2 — Group fill / capacity */}
        <FadeItem>
          <GlassCard className="p-6">
            <SectionTitle title={t("analytics.chart.groupFill")} />
            <GroupFillChart groups={activeGroups} t={t} />
          </GlassCard>
        </FadeItem>

        {/* Chart 3 — Students per course */}
        <FadeItem>
          <GlassCard className="p-6">
            <SectionTitle title={t("analytics.chart.studentsPerCourse")} />
            <StudentsPerCourseChart groups={groups} courses={courses} t={t} />
          </GlassCard>
        </FadeItem>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart 1 — Groups by status (animated horizontal bars)
// ---------------------------------------------------------------------------
function GroupsByStatusChart({ groups, t }: { groups: Group[]; t: (key: string) => string }) {
  const statusMeta: Record<Group["status"], { label: string; color: string }> = {
    active: { label: t("analytics.status.active"), color: EMERALD },
    completed: { label: t("analytics.status.completed"), color: BRAND },
    archived: { label: t("analytics.status.archived"), color: AMBER },
  };

  const statuses: Group["status"][] = ["active", "completed", "archived"];
  const total = groups.length;

  if (total === 0) {
    return (
      <EmptyMessage
        icon={Users}
        title={t("analytics.empty.noGroups.title")}
        desc={t("analytics.empty.noGroups.desc")}
      />
    );
  }

  return (
    <div className="space-y-5">
      {statuses.map((status) => {
        const count = groups.filter((g) => g.status === status).length;
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        const meta = statusMeta[status];
        return (
          <div key={status}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-white/70">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: meta.color }}
                />
                {meta.label}
              </span>
              <span className="tabular-nums font-medium text-white/80">
                {count}
                <span className="ml-1.5 text-xs text-white/40">{pct}%</span>
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: meta.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart 2 — Group fill / capacity (top 8 active groups)
// ---------------------------------------------------------------------------
function GroupFillChart({ groups, t }: { groups: Group[]; t: (key: string) => string }) {
  const rows = [...groups]
    .map((g) => {
      const cap = g.maxStudents > 0 ? g.maxStudents : 0;
      const count = g.studentIds.length;
      const pct = cap === 0 ? 0 : Math.round((count / cap) * 100);
      return { g, cap, count, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);

  if (rows.length === 0) {
    return (
      <EmptyMessage
        icon={Percent}
        title={t("analytics.empty.noActiveGroups.title")}
        desc={t("analytics.empty.noActiveGroups.desc")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {rows.map(({ g, cap, count, pct }) => {
        const color = pct >= 90 ? AMBER : pct >= 50 ? EMERALD : BRAND;
        return (
          <div key={g.id}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="truncate pr-3 text-white/70">{g.name}</span>
              <span className="shrink-0 tabular-nums text-white/60">
                {count}/{cap || "—"}
                <span className="ml-1.5 text-xs text-white/40">{pct}%</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart 3 — Students per course (animated horizontal bars)
// ---------------------------------------------------------------------------
function StudentsPerCourseChart({
  groups,
  courses,
  t,
}: {
  groups: Group[];
  courses: { id: string; name: string; color: string }[];
  t: (key: string) => string;
}) {
  const counts = new Map<string, Set<string>>();
  for (const g of groups) {
    if (!counts.has(g.courseId)) counts.set(g.courseId, new Set());
    const set = counts.get(g.courseId)!;
    for (const sid of g.studentIds) set.add(sid);
  }

  const rows = courses
    .map((c) => ({
      course: c,
      count: counts.get(c.id)?.size ?? 0,
    }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (rows.length === 0) {
    return (
      <EmptyMessage
        icon={BookOpen}
        title={t("analytics.empty.noCourses.title")}
        desc={t("analytics.empty.noCourses.desc")}
      />
    );
  }

  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <div className="space-y-4">
      {rows.map(({ course, count }) => {
        const pct = Math.round((count / max) * 100);
        return (
          <div key={course.id}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 truncate pr-3 text-white/70">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: course.color || BRAND }}
                />
                <span className="truncate">{course.name}</span>
              </span>
              <span className="shrink-0 tabular-nums font-medium text-white/80">
                {count}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: course.color || BRAND }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart 4 — Lessons per weekday (animated column chart)
// ---------------------------------------------------------------------------
function LessonsPerWeekdayChart({ groups, t }: { groups: Group[]; t: (key: string) => string }) {
  const weekdays = WEEKDAY_KEYS.map((d) => ({ ...d, label: t(d.tKey) }));
  const counts = weekdays.map((d) => groups.filter((g) => g.days.includes(d.key)).length);
  const total = counts.reduce((a, b) => a + b, 0);
  const max = Math.max(...counts, 1);

  if (total === 0) {
    return (
      <EmptyMessage
        icon={BarChart3}
        title={t("analytics.empty.noSchedule.title")}
        desc={t("analytics.empty.noSchedule.desc")}
      />
    );
  }

  return (
    <div className="flex h-56 items-end gap-2 sm:gap-3">
      {weekdays.map((d, i) => {
        const count = counts[i];
        const heightPct = Math.round((count / max) * 100);
        const color = BAR_COLORS[i % BAR_COLORS.length];
        return (
          <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-xs tabular-nums text-white/60">{count}</span>
            <div className="flex w-full flex-1 items-end">
              <motion.div
                className="w-full rounded-t-lg rounded-b-sm"
                style={{ background: `linear-gradient(180deg, ${color}, ${color}55)` }}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, count > 0 ? 6 : 0)}%` }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
            <span className="text-xs font-medium text-white/45">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------
function EmptyMessage({
  title,
  desc,
  icon: Icon,
}: {
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="grid place-items-center rounded-4xl border border-dashed border-white/10 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.04]">
        <Icon className="h-6 w-6 text-white/40" />
      </div>
      <p className="mt-4 font-semibold text-white">{title}</p>
      <p className={cn("mt-1 max-w-xs text-sm text-white/45")}>{desc}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72" />
        ))}
      </div>
    </div>
  );
}
