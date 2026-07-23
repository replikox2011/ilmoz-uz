import * as React from "react";
import {
  Users,
  DoorOpen,
  GraduationCap,
  Wallet,
  CalendarClock,
  UserSquare2,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatCard } from "../../components/ui/StatCard";
import { GlassCard } from "../../components/ui/GlassCard";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { Button } from "../../components/ui/Button";
import { formatMoney, formatMoneyCompact } from "../../lib/utils";
import { Role } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import {
  SectionTitle,
  GroupRow,
  TimelineWidget,
  AiInsightCard,
  EmptyState,
} from "./widgets";

function useGreeting() {
  const { t } = useI18n();
  const h = new Date().getHours();
  if (h < 12) return t("dashboard.greetingMorning");
  if (h < 18) return t("dashboard.greetingAfternoon");
  return t("dashboard.greetingEvening");
}

export function DashboardPage() {
  const { user, center } = useAuth();
  const { t } = useI18n();
  const greeting = useGreeting();
  const data = useCenterData();
  if (!user || !center) return null;

  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${firstName}`}
        subtitle={`${t("dashboard.subtitlePrefix")} ${center.name} ${t("dashboard.subtitleSuffix")}`}
        actions={
          <Button variant="glass" size="sm">
            {t(`role.${user.role}`)} {t("dashboard.view")}
          </Button>
        }
      />

      {data.loading ? (
        <DashboardSkeleton />
      ) : (
        <RoleDashboard role={user.role} data={data} />
      )}
    </div>
  );
}

function RoleDashboard({
  role,
  data,
}: {
  role: Role;
  data: ReturnType<typeof useCenterData>;
}) {
  const { center } = useAuth();
  const { t } = useI18n();
  const currency = center?.currency ?? "USD";

  const stats = statsForRole(role, data, currency, t);

  return (
    <div className="space-y-6">
      <Stagger className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <FadeItem className="lg:col-span-2">
          <GlassCard className="p-6">
            <SectionTitle
              title={role === "student" || role === "parent" ? t("dashboard.upcomingLessons") : t("dashboard.activeGroups")}
              action={
                <Button variant="ghost" size="sm">
                  {t("dashboard.viewAll")}
                </Button>
              }
            />
            {data.groups.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t("dashboard.noGroupsTitle")}
                desc={t("dashboard.noGroupsDesc")}
              />
            ) : (
              <div className="space-y-3">
                {data.groups.map((g) => (
                  <GroupRow
                    key={g.id}
                    group={g}
                    course={data.courses.find((c) => c.id === g.courseId)}
                    room={g.roomId ? { name: g.roomId } : undefined}
                    teacher={data.teachers.find((t) => t.id === g.teacherId)}
                  />
                ))}
              </div>
            )}
          </GlassCard>
        </FadeItem>

        {/* Side column */}
        <div className="space-y-6">
          <FadeItem>
            <AiInsightCard text={insightForRole(role, data, t)} />
          </FadeItem>
          <FadeItem>
            <GlassCard className="p-6">
              <SectionTitle title={t("dashboard.todaysTimeline")} />
              {data.groups.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title={t("dashboard.nothingScheduledTitle")}
                  desc={t("dashboard.nothingScheduledDesc")}
                />
              ) : (
                <TimelineWidget
                  groups={data.groups}
                  courses={data.courses}
                />
              )}
            </GlassCard>
          </FadeItem>
        </div>
      </div>
    </div>
  );
}

function statsForRole(
  role: Role,
  data: ReturnType<typeof useCenterData>,
  currency: string,
  t: (key: string) => string
) {
  const activeGroups = data.groups.filter((g) => g.status === "active").length;
  const totalRevenue = data.payments ? data.payments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0) : 0;
  const pendingCount = data.payments ? data.payments.filter((p) => p.status !== "paid").length : 0;

  switch (role) {
    case "owner":
    case "director":
      return [
        { label: t("dashboard.statActiveGroups"), value: activeGroups, icon: Users, accent: "#3b6bff" },
        { label: t("dashboard.statStudents"), value: data.students.length, icon: GraduationCap, accent: "#10b981" },
        { label: t("dashboard.statMonthlyRevenue"), value: formatMoney(totalRevenue, currency), compactValue: formatMoneyCompact(totalRevenue, currency), icon: Wallet, accent: "#f59e0b" },
        { label: t("dashboard.statTeachers"), value: data.teachers.length, icon: UserSquare2, accent: "#8b5cf6" },
      ];
    case "administrator":
      return [
        { label: t("dashboard.statActiveGroups"), value: activeGroups, icon: Users, accent: "#3b6bff" },
        { label: t("dashboard.statStudents"), value: data.students.length, icon: GraduationCap, accent: "#10b981" },
        { label: t("dashboard.statRooms"), value: data.rooms.length, icon: DoorOpen, accent: "#06b6d4" },
        { label: t("dashboard.statPendingPayments"), value: pendingCount, icon: Wallet, accent: "#f59e0b" },
      ];
    case "teacher": {
      const mine = data.groups.filter((g) => g.teacherId);
      return [
        { label: t("dashboard.statMyGroups"), value: mine.length, icon: Users, accent: "#3b6bff" },
        { label: t("dashboard.statMyStudents"), value: data.students.length, icon: GraduationCap, accent: "#10b981" },
        { label: t("dashboard.statMyTests"), value: data.tests.length, icon: ClipboardList, accent: "#8b5cf6" },
        { label: t("dashboard.statPendingPayments"), value: pendingCount, icon: Wallet, accent: "#f59e0b" },
      ];
    }
    case "student":
      return [
        { label: t("dashboard.statMyGroups"), value: data.groups.length, icon: Users, accent: "#3b6bff" },
        { label: t("dashboard.statActiveTests"), value: data.tests.length, icon: ClipboardList, accent: "#10b981" },
        { label: t("dashboard.statPendingPayments"), value: pendingCount, icon: Wallet, accent: "#f59e0b" },
      ];
    case "parent": {
      const totalPaid = data.payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
      const pendingAmount = data.payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
      return [
        { label: t("dashboard.statChildren"), value: data.students.length, icon: UserSquare2, accent: "#3b6bff" },
        { label: t("dashboard.statMyGroups"), value: data.groups.length, icon: Users, accent: "#6366f1" },
        { label: t("dashboard.statMonthlyRevenue"), value: formatMoney(totalPaid, currency), compactValue: formatMoneyCompact(totalPaid, currency), icon: Wallet, accent: "#10b981" },
        { label: t("dashboard.statPendingPayments"), value: formatMoney(pendingAmount, currency), compactValue: formatMoneyCompact(pendingAmount, currency), icon: CalendarClock, accent: "#f59e0b" },
      ];
    }
    default:
      return [];
  }
}

function insightForRole(
  role: Role,
  data: ReturnType<typeof useCenterData>,
  t: (key: string) => string
): string {
  switch (role) {
    case "owner":
    case "director":
      return t("dashboard.insightOwner");
    case "administrator":
      return `${data.rooms.length} ${t("dashboard.insightAdmin")}`;
    case "teacher":
      return t("dashboard.insightTeacher");
    case "student":
      return t("dashboard.insightStudent");
    case "parent":
      return t("dashboard.insightParent");
    default:
      return t("dashboard.insightDefault");
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-52" />
        </div>
      </div>
    </div>
  );
}
