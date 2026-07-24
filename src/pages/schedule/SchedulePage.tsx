import * as React from "react";
import { Clock, MapPin, User as UserIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { Group, Weekday } from "../../types";
import { cn } from "../../lib/utils";
import { useI18n } from "../../i18n/I18nContext";

const DAYS: { key: Weekday; labelKey: string; shortKey: string }[] = [
  { key: "mon", labelKey: "schedule.weekday.mon", shortKey: "schedule.weekday.short.mon" },
  { key: "tue", labelKey: "schedule.weekday.tue", shortKey: "schedule.weekday.short.tue" },
  { key: "wed", labelKey: "schedule.weekday.wed", shortKey: "schedule.weekday.short.wed" },
  { key: "thu", labelKey: "schedule.weekday.thu", shortKey: "schedule.weekday.short.thu" },
  { key: "fri", labelKey: "schedule.weekday.fri", shortKey: "schedule.weekday.short.fri" },
  { key: "sat", labelKey: "schedule.weekday.sat", shortKey: "schedule.weekday.short.sat" },
  { key: "sun", labelKey: "schedule.weekday.sun", shortKey: "schedule.weekday.short.sun" },
];

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const COURSE_COLORS = [
  { bg: "bg-brand-500/25 border-brand-400/40", text: "text-brand-200" },
  { bg: "bg-purple-500/25 border-purple-400/40", text: "text-purple-200" },
  { bg: "bg-emerald-500/25 border-emerald-400/40", text: "text-emerald-200" },
  { bg: "bg-amber-500/25 border-amber-400/40", text: "text-amber-200" },
  { bg: "bg-rose-500/25 border-rose-400/40", text: "text-rose-200" },
  { bg: "bg-cyan-500/25 border-cyan-400/40", text: "text-cyan-200" },
];

// Определяем цвет по courseId
function courseColor(courseId: string) {
  const sum = courseId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COURSE_COLORS[sum % COURSE_COLORS.length];
}

// Получить текущий день недели
function todayKey(): Weekday {
  const map: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[new Date().getDay()];
}

export function SchedulePage() {
  const { center } = useAuth();
  const data = useCenterData();
  const { t } = useI18n();

  const activeGroups = data.groups.filter(g => g.status === "active");

  // Считаем конфликты (аудитория или учитель в одно время в тот же день)
  function hasConflict(g: Group, sameDayGroups: Group[]): boolean {
    return sameDayGroups.some(other => {
      if (other.id === g.id) return false;
      const overlap = toMinutes(g.startTime) < toMinutes(other.endTime) &&
                      toMinutes(g.endTime) > toMinutes(other.startTime);
      return overlap && (
        (!!g.roomId && other.roomId === g.roomId) ||
        other.teacherId === g.teacherId
      );
    });
  }

  // Занятия по дню, отсортированные по времени начала
  const groupsForDay = (day: Weekday): Group[] =>
    activeGroups
      .filter(g => g.days.includes(day))
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  return (
    <div>
      <PageHeader
        title={t("schedule.title")}
        subtitle={center?.name ?? ""}
        actions={
          <div className="flex items-center gap-1 text-sm text-white/50">
            <Clock className="h-4 w-4" />
            {activeGroups.length} {t("schedule.activeGroups")}
          </div>
        }
      />

      {data.loading ? (
        <Skeleton className="h-[600px]" />
      ) : (
        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <tbody>
                {DAYS.map(d => {
                  const dayGroups = groupsForDay(d.key);
                  const isToday = d.key === todayKey();
                  return (
                    <tr
                      key={d.key}
                      className="border-b border-white/[0.06] last:border-b-0 align-top"
                    >
                      {/* День недели */}
                      <td className="w-36 shrink-0 border-r border-white/[0.06] p-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-semibold",
                            isToday ? "text-brand-300" : "text-white/80"
                          )}>
                            {t(d.labelKey)}
                          </span>
                          {isToday && (
                            <span className="rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-300">
                              {t("schedule.today")}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-white/35">
                          {dayGroups.length > 0
                            ? `${dayGroups.length} ${t("schedule.groupsCount")}`
                            : t("schedule.noClasses")}
                        </p>
                      </td>

                      {/* Занятия дня */}
                      <td className="p-3">
                        {dayGroups.length === 0 ? (
                          <p className="px-1 py-2 text-sm text-white/25">
                            {t("schedule.noClasses")}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {dayGroups.map(g => {
                              const color = courseColor(g.courseId);
                              const conflict = hasConflict(g, dayGroups);
                              const teacher = data.teachers.find(tt => tt.id === g.teacherId);
                              const course = data.courses.find(c => c.id === g.courseId);
                              return (
                                <div
                                  key={g.id}
                                  className={cn(
                                    "min-w-[180px] flex-1 rounded-2xl border px-3 py-2.5 transition sm:flex-none sm:basis-[220px]",
                                    conflict ? "border-red-400/60 bg-red-500/20" : color.bg
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                      "truncate text-sm font-semibold leading-tight",
                                      conflict ? "text-red-300" : color.text
                                    )}>
                                      {conflict && "⚠️ "}{g.name}
                                    </p>
                                    <span className={cn(
                                      "shrink-0 text-[11px] font-medium tabular-nums",
                                      conflict ? "text-red-300/80" : "text-white/50"
                                    )}>
                                      {g.startTime}–{g.endTime}
                                    </span>
                                  </div>
                                  {course && (
                                    <p className="mt-1 truncate text-[11px] text-white/45">
                                      {course.name}
                                    </p>
                                  )}
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-white/35">
                                    {teacher && (
                                      <span className="flex items-center gap-1">
                                        <UserIcon className="h-3 w-3" /> {teacher.name}
                                      </span>
                                    )}
                                    {g.roomId && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {g.roomId}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
