import {
  LayoutDashboard, Users, CalendarDays,
  Wallet, BarChart3, Sparkles,
  UserSquare2, BookMarked, ClipboardList, type LucideIcon,
} from "lucide-react";
import { Role } from "../types";
import { TranslationKey } from "../i18n/I18nContext";

export interface NavItem {
  labelKey: TranslationKey;
  to: string;
  icon: LucideIcon;
  roles: Role[];
}

const ALL: Role[] = ["owner", "director", "administrator", "teacher", "student", "parent"];

export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.dashboard",     to: "/",              icon: LayoutDashboard, roles: ALL },
  { labelKey: "nav.groups",        to: "/groups",        icon: Users,           roles: ["owner","director","administrator","teacher"] },
  { labelKey: "nav.schedule",      to: "/schedule",      icon: CalendarDays,    roles: ["owner","director","administrator","teacher","student"] },
  { labelKey: "nav.tests",         to: "/tests",         icon: ClipboardList,   roles: ["owner","director","administrator","teacher","student"] },
  { labelKey: "nav.users",         to: "/users",         icon: Users,           roles: ["owner","director","administrator"] },
  { labelKey: "nav.courses",       to: "/courses",       icon: BookMarked,      roles: ["owner","director","administrator"] },
  { labelKey: "nav.finance",       to: "/finance",       icon: Wallet,          roles: ["owner","director","administrator"] },
  { labelKey: "nav.analytics",     to: "/analytics",     icon: BarChart3,       roles: ["owner","director","administrator"] },
  { labelKey: "nav.copilot",       to: "/ai",            icon: Sparkles,        roles: ["owner","director","administrator","teacher"] },
  { labelKey: "nav.children",      to: "/children",      icon: UserSquare2,     roles: ["parent"] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}
