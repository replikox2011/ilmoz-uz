import * as React from "react";
import { Clock, MapPin, ArrowRight, Sparkles, Wallet, Phone, Users } from "lucide-react";
import { MagneticCard } from "../../components/ui/MagneticCard";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";
import { Course, Group, User, Student, WEEKDAYS } from "../../types";
import { useI18n } from "../../i18n/I18nContext";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
        {title}
      </h3>
      {action}
    </div>
  );
}

export function GroupRow({
  group,
  course,
  room,
  teacher,
  onClick,
}: {
  group: Group;
  course?: Course;
  room?: { name: string };
  teacher?: User;
  onClick?: () => void;
}) {
  const { center } = useAuth();
  const currency = center?.currency ?? "UZS";

  const dayLabels = group.days
    .map((d) => WEEKDAYS.find((w) => w.key === d)?.short)
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/12 hover:bg-white/[0.04]",
        onClick && "cursor-pointer"
      )}
    >
      <div
        className="h-11 w-1.5 shrink-0 rounded-full"
        style={{ background: course?.color ?? "#3b6bff" }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-white">{group.name}</p>
          <Badge
            variant={
              group.status === "active"
                ? "success"
                : group.status === "completed"
                ? "brand"
                : "neutral"
            }
          >
            {group.status}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-white/45">
          {course?.name} · {dayLabels}
        </p>
      </div>
      <div className="hidden items-center gap-4 text-xs text-white/50 sm:flex">
        {group.price !== undefined && group.price > 0 && (
          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400">
            <Wallet className="h-3.5 w-3.5 text-emerald-500/70" />
            {new Intl.NumberFormat("ru-RU").format(group.price)} {currency}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {group.startTime}–{group.endTime}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {room?.name ?? "—"}
        </span>
      </div>
      {teacher && (
        <Avatar name={teacher.name} color={teacher.avatarColor} size="sm" />
      )}
      <ArrowRight className="h-4 w-4 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50" />
    </div>
  );
}

export function GroupGridCard({
  group,
  course,
  room,
  teacher,
  onClick,
}: {
  group: Group;
  course?: Course;
  room?: { name: string };
  teacher?: User;
  onClick?: () => void;
}) {
  const { center } = useAuth();
  const currency = center?.currency ?? "UZS";

  const dayLabels = group.days
    .map((d) => WEEKDAYS.find((w) => w.key === d)?.short)
    .filter(Boolean)
    .join(" · ");

  return (
    <MagneticCard className="h-full">
      <div
        onClick={onClick}
        className={cn(
          "bento-card group h-full flex flex-col rounded-3xl p-6 transition-all duration-300",
          onClick && "cursor-pointer"
        )}
      >
        <div className="noise-overlay" />
        <div className="relative z-10 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-4">
            <div
              className="h-10 w-1.5 shrink-0 rounded-full"
              style={{ background: course?.color ?? "#3b6bff" }}
            />
            <Badge
              variant={
                group.status === "active"
                  ? "success"
                  : group.status === "completed"
                  ? "brand"
                  : "neutral"
              }
            >
              {group.status}
            </Badge>
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-1">{group.name}</h3>
          <p className="text-sm text-white/50 mb-4">{course?.name}</p>

          <div className="space-y-2 mt-auto text-xs text-white/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-300" />
              <span>{dayLabels} · {group.startTime}–{group.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-300" />
              <span>{room?.name ?? "—"}</span>
            </div>
            {group.price !== undefined && group.price > 0 && (
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">
                  {new Intl.NumberFormat("ru-RU").format(group.price)} {currency}
                </span>
              </div>
            )}
          </div>

          {teacher && (
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
              <Avatar name={teacher.name} color={teacher.avatarColor} size="sm" />
              <span className="text-sm text-white/80">{teacher.name}</span>
            </div>
          )}
        </div>
      </div>
    </MagneticCard>
  );
}

export function GroupTableRow({
  group,
  course,
  room,
  teacher,
  onClick,
}: {
  group: Group;
  course?: Course;
  room?: { name: string };
  teacher?: User;
  onClick?: () => void;
}) {
  const { center } = useAuth();
  const currency = center?.currency ?? "UZS";

  const dayLabels = group.days
    .map((d) => WEEKDAYS.find((w) => w.key === d)?.short)
    .filter(Boolean)
    .join(", ");

  return (
    <tr
      onClick={onClick}
      className={cn(
        "group border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]",
        onClick && "cursor-pointer"
      )}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-1.5 shrink-0 rounded-full"
            style={{ background: course?.color ?? "#3b6bff" }}
          />
          <span className="font-medium text-white">{group.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-white/60">{course?.name}</td>
      <td className="py-3 px-4 text-sm text-white/60">
        <div className="flex flex-col">
          <span className="text-white/80">{dayLabels}</span>
          <span className="text-xs">{group.startTime}–{group.endTime}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-white/60">{room?.name ?? "—"}</td>
      <td className="py-3 px-4">
        {teacher ? (
          <div className="flex items-center gap-2">
            <Avatar name={teacher.name} color={teacher.avatarColor} size="sm" />
            <span className="text-sm text-white/60">{teacher.name}</span>
          </div>
        ) : (
          <span className="text-white/30">—</span>
        )}
      </td>
      <td className="py-3 px-4">
        <Badge
          variant={
            group.status === "active"
              ? "success"
              : group.status === "completed"
              ? "brand"
              : "neutral"
          }
        >
          {group.status}
        </Badge>
      </td>
      <td className="py-3 px-4 text-right">
        {group.price !== undefined && group.price > 0 && (
          <span className="text-sm font-medium text-emerald-400">
            {new Intl.NumberFormat("ru-RU").format(group.price)} {currency}
          </span>
        )}
      </td>
    </tr>
  );
}

const HOUR_START = 8;
const HOUR_END = 21;

export function TimelineWidget({
  groups,
  courses,
}: {
  groups: Group[];
  courses: Course[];
}) {
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i
  );

  const positioned = groups.map((g) => {
    const [sh, sm] = g.startTime.split(":").map(Number);
    const [eh, em] = g.endTime.split(":").map(Number);
    const top = ((sh + sm / 60 - HOUR_START) / (HOUR_END - HOUR_START)) * 100;
    const height =
      ((eh + em / 60 - (sh + sm / 60)) / (HOUR_END - HOUR_START)) * 100;
    return { g, top, height };
  });

  return (
    <div className="relative h-[420px] pl-12">
      <div className="absolute inset-0 left-12">
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 flex items-center"
            style={{ top: `${(i / (hours.length - 1)) * 100}%` }}
          >
            <span className="absolute -left-12 -translate-y-1/2 text-[10px] tabular-nums text-white/25">
              {String(h).padStart(2, "0")}:00
            </span>
            <div className="h-px w-full bg-white/[0.05]" />
          </div>
        ))}
      </div>

      {positioned.map(({ g, top, height }) => {
        const course = courses.find((c) => c.id === g.courseId);
        return (
          <div
            key={g.id}
            className="absolute left-14 right-1 overflow-hidden rounded-2xl border p-3 backdrop-blur-md transition hover:scale-[1.01]"
            style={{
              top: `${top}%`,
              height: `${Math.max(height, 9)}%`,
              background: `${course?.color ?? "#3b6bff"}1f`,
              borderColor: `${course?.color ?? "#3b6bff"}44`,
            }}
          >
            <p className="truncate text-sm font-semibold text-white">{g.name}</p>
            <p className="truncate text-[11px] text-white/55">
              {g.startTime}–{g.endTime}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  desc,
}: {
  icon: any;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.04]">
        <Icon className="h-6 w-6 text-white/30" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-xs text-white/40">{desc}</p>
      </div>
    </div>
  );
}

export function StudentGridCard({ student, groupCount, username, action }: { student: Student; groupCount: number; username?: string; action?: React.ReactNode }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/students/${username || student.id}`);
  };
  return (
    <MagneticCard className="h-full">
      <div 
        onClick={handleClick}
        className="bento-card group relative h-full flex flex-col rounded-3xl p-5 transition-all duration-300 cursor-pointer"
      >
        <div className="noise-overlay" />
        <div className="relative z-10 flex flex-col flex-1">
          <div className="flex items-start gap-4">
            <Avatar name={student.name} color={student.avatarColor} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">{student.name}</p>
              {username && (
                <p className="mt-0.5 text-xs text-white/35">@{username}</p>
              )}
            </div>
            {action && <div className="absolute right-0 top-0">{action}</div>}
          </div>
          <div className="mt-4 space-y-2">
            {student.phone && (
              <p className="flex items-center gap-1.5 text-xs text-white/50">
                <Phone className="h-3.5 w-3.5 text-brand-400" /> {student.phone}
              </p>
            )}
            <Badge variant={groupCount > 0 ? "brand" : "neutral"} className="w-fit">
              <Users className="h-3 w-3" />
              {groupCount > 0 ? `${groupCount} ${t("students.groupsCount")}` : t("students.noGroup")}
            </Badge>
          </div>
        </div>
      </div>
    </MagneticCard>
  );
}

export function StudentRow({ student, groupCount, username, action }: { student: Student; groupCount: number; username?: string; action?: React.ReactNode }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/students/${username || student.id}`);
  };
  return (
    <div
      onClick={handleClick}
      className="group relative flex items-center gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all duration-300 hover:border-white/12 hover:bg-white/[0.04] cursor-pointer"
    >
      <Avatar name={student.name} color={student.avatarColor} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white group-hover:text-brand-300 transition-colors">{student.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {username && <span className="text-xs text-white/40">@{username}</span>}
        </div>
      </div>
      <div className="hidden items-center gap-4 text-xs text-white/50 sm:flex">
        {student.phone && (
          <span className="inline-flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5" /> {student.phone}
          </span>
        )}
        <Badge variant={groupCount > 0 ? "brand" : "neutral"}>
          {groupCount > 0 ? `${groupCount} ${t("students.groupsCount")}` : t("students.noGroup")}
        </Badge>
      </div>
      {action && <div className="ml-2">{action}</div>}
    </div>
  );
}

export function StudentTableRow({ student, groupCount, username, action }: { student: Student; groupCount: number; username?: string; action?: React.ReactNode }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/students/${username || student.id}`);
  };
  return (
    <tr
      onClick={handleClick}
      className="group relative border-b border-white/[0.04] transition-colors hover:bg-white/[0.02] cursor-pointer"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <Avatar name={student.name} color={student.avatarColor} size="sm" />
          <span className="font-medium text-white group-hover:text-brand-300 transition-colors">{student.name}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-white/60">{username ? `@${username}` : "—"}</td>
      <td className="py-3 px-4 text-sm text-white/60">{student.phone || "—"}</td>
      <td className="py-3 px-4">
        <Badge variant={groupCount > 0 ? "brand" : "neutral"}>
          {groupCount > 0 ? `${groupCount} ${t("students.groupsCount")}` : t("students.noGroup")}
        </Badge>
      </td>
      {action && <td className="py-3 px-4 text-right">{action}</td>}
    </tr>
  );
}

export function AiInsightCard({ text }: { text: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-brand-500/[0.04] p-5">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-brand-500/20 blur-[50px]" />
      <div className="relative flex gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-500/20">
          <Sparkles className="h-5 w-5 text-brand-300" />
        </div>
        <p className="text-sm font-medium leading-relaxed text-brand-100">
          {text}
        </p>
      </div>
    </div>
  );
}
