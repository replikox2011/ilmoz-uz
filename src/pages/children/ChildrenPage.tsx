import * as React from "react";
import { CalendarClock, Users, GraduationCap } from "lucide-react";
import { useCenterData } from "../../hooks/useCenterData";
import { useI18n } from "../../i18n/I18nContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatCard } from "../../components/ui/StatCard";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { Group, Student, Weekday } from "../../types";
import { SectionTitle, GroupRow, EmptyState } from "../dashboard/widgets";

export function ChildrenPage() {
  const data = useCenterData();
  const { t } = useI18n();

  // For parent role, useCenterData already scopes students to their children.
  // We use data.students directly; the fallback demo slice is removed.
  const children: Student[] = data.students;

  const childCountLabel = (n: number) => {
    if (n === 1) return t("children.countOne");
    if (n >= 2 && n <= 4) return t("children.countFew");
    return t("children.countMany");
  };

  return (
    <div>
      <PageHeader
        title={t("children.title")}
        subtitle={
          data.loading
            ? t("children.loading")
            : `${children.length} ${childCountLabel(children.length)} · ${t("children.subtitleSuffix")}`
        }
      />

      {data.loading ? (
        <ChildrenSkeleton />
      ) : children.length === 0 ? (
        <GlassCard className="p-6">
          <EmptyState
            icon={GraduationCap}
            title={t("children.emptyTitle")}
            desc={t("children.emptyDesc")}
          />
        </GlassCard>
      ) : (
        <Stagger className="space-y-8">
          {children.map((child) => (
            <FadeItem key={child.id}>
              <ChildSection child={child} data={data} />
            </FadeItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

function ChildSection({ child, data }: { child: Student; data: ReturnType<typeof useCenterData> }) {
  const { t } = useI18n();

  const childGroups: Group[] = child.groupIds
    .map((id) => data.groups.find((g) => g.id === id))
    .filter((g): g is Group => Boolean(g));

  const first = childGroups[0];
  const firstDay = first?.days[0] as Weekday | undefined;
  const nextLesson = first && firstDay
    ? `${t(`children.dayShort.${firstDay}`)} · ${first.startTime}`
    : "—";

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={child.name} color={child.avatarColor} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-white">{child.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {childGroups.length > 0 ? (
              childGroups.map((g) => (
                <Badge key={g.id} variant="brand">
                  <Users className="h-3 w-3" /> {g.name}
                </Badge>
              ))
            ) : (
              <Badge variant="neutral">{t("children.noGroup")}</Badge>
            )}
          </div>
        </div>
      </div>

      <Stagger className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2">
        <StatCard label={t("children.statGroups")} value={child.groupIds.length} icon={Users} accent="#3b6bff" />
        <StatCard
          label={t("children.statNextLesson")}
          value={nextLesson}
          icon={CalendarClock}
          accent="#f59e0b"
          hint={first && firstDay ? t(`children.dayFull.${firstDay}`) : undefined}
        />
      </Stagger>

      <div className="mt-6">
        <SectionTitle title={t("children.scheduleTitle")} />
        {childGroups.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={t("children.noLessonsTitle")}
            desc={t("children.noLessonsDesc")}
          />
        ) : (
          <div className="space-y-3">
            {childGroups.map((g) => (
              <GroupRow
                key={g.id}
                group={g}
                course={data.courses.find((c) => c.id === g.courseId)}
                room={g.roomId ? { name: g.roomId } : undefined}
                teacher={data.teachers.find((teacher) => teacher.id === g.teacherId)}
              />
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function ChildrenSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-16" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-32" />)}
          </div>
          <Skeleton className="h-40" />
        </div>
      ))}
    </div>
  );
}
