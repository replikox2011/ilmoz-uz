import * as React from "react";
import { Bell, CheckCheck, UserPlus, DoorOpen, CalendarClock, Wallet, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCenterData } from "../../hooks/useCenterData";
import { useI18n } from "../../i18n/I18nContext";
import { PageHeader } from "../../components/ui/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { Stagger, FadeItem } from "../../components/motion/Motion";
import { cn } from "../../lib/utils";

type NotificationType = "info" | "success" | "warning";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const TYPE_CHIP: Record<NotificationType, string> = {
  info: "bg-brand-500/15 text-brand-300 ring-brand-400/25",
  success: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/25",
  warning: "bg-amber-500/15 text-amber-300 ring-amber-400/25",
};

const TYPE_BADGE: Record<NotificationType, "brand" | "success" | "warning"> = {
  info: "brand",
  success: "success",
  warning: "warning",
};

const readStorageKey = (centerId: string) => `nexo:notifications:read:${centerId}`;

function loadReadIds(centerId: string): string[] {
  try {
    const raw = localStorage.getItem(readStorageKey(centerId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

function saveReadIds(centerId: string, ids: string[]) {
  try { localStorage.setItem(readStorageKey(centerId), JSON.stringify(ids)); } catch { }
}

export function NotificationsPage() {
  const { center } = useAuth();
  const data = useCenterData();
  const { t } = useI18n();

  const TYPE_LABEL: Record<NotificationType, string> = {
    info: t("notifications.typeInfo"),
    success: t("notifications.typeSuccess"),
    warning: t("notifications.typeWarning"),
  };

  const notifications = React.useMemo<NotificationItem[]>(() => {
    const TIME_LABELS = [
      `2 ${t("notifications.timeHoursAgo")}`,
      `5 ${t("notifications.timeHoursAgo")}`,
      t("notifications.timeToday"),
      t("notifications.timeYesterday"),
      `2 ${t("notifications.timeDaysAgo")}`,
      `3 ${t("notifications.timeDaysAgo")}`,
      `4 ${t("notifications.timeDaysAgo")}`,
      t("notifications.timeWeekAgo"),
      t("notifications.timeWeekAgo"),
      t("notifications.timeWeekAgo"),
    ];
    const items: NotificationItem[] = [];
    const activeGroups = data.groups.filter((g) => g.status === "active");

    activeGroups.slice(0, 2).forEach((g) => {
      items.push({
        id: `group-active-${g.id}`,
        type: "success",
        title: `${t("notifications.groupActivePrefix")} «${g.name}» ${t("notifications.groupActiveSuffix")}`,
        description: t("notifications.groupActiveDesc"),
        time: "",
        Icon: CalendarClock,
      });
    });

    data.students.slice(0, 2).forEach((s) => {
      items.push({
        id: `student-added-${s.id}`,
        type: "info",
        title: `${s.name} ${t("notifications.studentAddedSuffix")}`,
        description: t("notifications.studentAddedDesc"),
        time: "",
        Icon: UserPlus,
      });
    });

    const groupsPerRoom: Record<string, number> = {};
    data.groups.forEach((g) => { groupsPerRoom[g.roomId] = (groupsPerRoom[g.roomId] ?? 0) + 1; });
    const busyRoom = data.rooms.find((r) => (groupsPerRoom[r.id] ?? 0) >= 2);
    if (busyRoom) {
      items.push({
        id: `room-busy-${busyRoom.id}`,
        type: "warning",
        title: `${t("notifications.roomBusyPrefix")} «${busyRoom.name}» ${t("notifications.roomBusySuffix")}`,
        description: `${t("notifications.roomBusyDescPrefix")} ${groupsPerRoom[busyRoom.id]} ${t("notifications.roomBusyDescSuffix")}`,
        time: "",
        Icon: DoorOpen,
      });
    }

    const lessonGroup = activeGroups.find((g) => g.startTime);
    if (lessonGroup) {
      items.push({
        id: `lesson-today-${lessonGroup.id}`,
        type: "info",
        title: `${t("notifications.lessonTodayPrefix")} ${lessonGroup.startTime} ${t("notifications.lessonTodaySuffix")}`,
        description: `${t("notifications.lessonTodayDescPrefix")} «${lessonGroup.name}» ${t("notifications.lessonTodayDescSuffix")}`,
        time: "",
        Icon: CalendarClock,
      });
    }

    items.push({
      id: "payment-reminder",
      type: "warning",
      title: t("notifications.paymentTitle"),
      description: t("notifications.paymentDesc"),
      time: "",
      Icon: Wallet,
    });

    items.push({
      id: "welcome-tip",
      type: "info",
      title: t("notifications.welcomeTitle"),
      description: t("notifications.welcomeDesc"),
      time: "",
      Icon: Info,
    });

    return items.map((n, i) => ({ ...n, time: TIME_LABELS[i] ?? t("notifications.timeEarlier") }));
  }, [data.groups, data.rooms, data.students, t]);

  const [readIds, setReadIds] = React.useState<string[]>([]);
  React.useEffect(() => { if (!center) return; setReadIds(loadReadIds(center.id)); }, [center]);

  const readSet = React.useMemo(() => new Set(readIds), [readIds]);
  const unreadCount = notifications.reduce((n, item) => (readSet.has(item.id) ? n : n + 1), 0);

  const markRead = (id: string) => {
    if (!center || readSet.has(id)) return;
    const next = [...readIds, id];
    setReadIds(next);
    saveReadIds(center.id, next);
  };

  const markAllRead = () => {
    if (!center) return;
    const next = Array.from(new Set([...readIds, ...notifications.map((n) => n.id)]));
    setReadIds(next);
    saveReadIds(center.id, next);
  };

  return (
    <div>
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
        actions={
          <>
            <Badge variant={unreadCount > 0 ? "brand" : "neutral"}>
              <Bell className="h-3 w-3" />
              {unreadCount > 0 ? `${unreadCount} ${t("notifications.badgeNew")}` : t("notifications.badgeAllRead")}
            </Badge>
            <Button size="sm" variant="glass" onClick={markAllRead} disabled={unreadCount === 0}>
              <CheckCheck className="h-4 w-4" /> {t("notifications.markAllRead")}
            </Button>
          </>
        }
      />

      {data.loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : notifications.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-sm font-medium text-white/50">{t("notifications.emptyTitle")}</p>
          <p className="mt-1 text-xs text-white/30">{t("notifications.emptyHint")}</p>
        </GlassCard>
      ) : (
        <Stagger className="space-y-3">
          {notifications.map((n) => {
            const isUnread = !readSet.has(n.id);
            return (
              <FadeItem key={n.id}>
                <GlassCard
                  interactive strong={isUnread} onClick={() => markRead(n.id)}
                  className={cn("cursor-pointer p-4", isUnread ? "border-white/15" : "opacity-80")}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1", TYPE_CHIP[n.type])}>
                      <n.Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn("truncate text-sm font-semibold", isUnread ? "text-white" : "text-white/70")}>
                          {n.title}
                        </p>
                        <span className="shrink-0 whitespace-nowrap text-xs text-white/35">{n.time}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-white/45">{n.description}</p>
                      <div className="mt-2.5">
                        <Badge variant={TYPE_BADGE[n.type]}>{TYPE_LABEL[n.type]}</Badge>
                      </div>
                    </div>
                    {isUnread && (
                      <span aria-label={t("notifications.unread")} className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-400 shadow-glow-sm" />
                    )}
                  </div>
                </GlassCard>
              </FadeItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
