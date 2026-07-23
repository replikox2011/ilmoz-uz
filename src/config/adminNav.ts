import {
  LayoutDashboard,
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  Receipt,
  BarChart3,
  LifeBuoy,
  Megaphone,
  Globe,
  Sparkles,
  ScrollText,
  GitBranch,
  Flag,
  Wrench,
  Settings,
  Lock,
  type LucideIcon,
} from "lucide-react";

/**
 * Ilmoz Admin (platform console) navigation.
 *
 * The whole `/ilmoz-admin` zone is already gated by <AdminOnly> (isadm || ismod),
 * so items don't carry a role allowlist. `ownerOnly` marks sections restricted
 * to platform owners (isadm) — moderators (ismod) don't see them.
 */
export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  ownerOnly?: boolean;
  translationKey: string;
}

export interface AdminNavGroup {
  title: string;
  translationKey: string;
  items: AdminNavItem[];
}

export function makeAdminNav(base: string): AdminNavGroup[] {
  const p = (path: string) => `${base}${path}`;
  return [
    {
      title: "Overview",
      translationKey: "admin.nav.overview",
      items: [
        { to: base || "/", label: "Dashboard", icon: LayoutDashboard, end: true, translationKey: "admin.nav.dashboard" },
        { to: p("/analytics"), label: "Analytics", icon: BarChart3, translationKey: "admin.nav.analytics" },
        { to: p("/ai"), label: "AI Analytics", icon: Sparkles, translationKey: "admin.nav.ai" },
      ],
    },
    {
      title: "Tenants",
      translationKey: "admin.nav.tenants",
      items: [
        { to: p("/centers"), label: "Organizations", icon: Building2, translationKey: "admin.nav.organizations" },
        { to: p("/users"), label: "Users", icon: Users, translationKey: "admin.nav.users" },
        { to: p("/subdomains"), label: "Subdomains", icon: Globe, translationKey: "admin.nav.subdomains" },
      ],
    },
    {
      title: "Revenue",
      translationKey: "admin.nav.revenue",
      items: [
        { to: p("/subscriptions"), label: "Subscriptions", icon: CreditCard, translationKey: "admin.nav.subscriptions" },
        { to: p("/payments"), label: "Payments", icon: Receipt, translationKey: "admin.nav.payments" },
      ],
    },
    {
      title: "Operations",
      translationKey: "admin.nav.operations",
      items: [
        { to: p("/support"), label: "Support", icon: LifeBuoy, translationKey: "admin.nav.support" },
        { to: p("/marketing"), label: "Marketing", icon: Megaphone, translationKey: "admin.nav.marketing" },
        { to: p("/moderators"), label: "Moderators", icon: ShieldCheck, ownerOnly: true, translationKey: "admin.nav.moderators" },
        { to: p("/logs"), label: "Logs", icon: ScrollText, translationKey: "admin.nav.logs" },
      ],
    },
    {
      title: "Platform",
      translationKey: "admin.nav.platform",
      items: [
        { to: p("/flags"), label: "Feature Flags", icon: Flag, ownerOnly: true, translationKey: "admin.nav.flags" },
        { to: p("/versions"), label: "Version Manager", icon: GitBranch, translationKey: "admin.nav.versions" },
        { to: p("/maintenance"), label: "Maintenance", icon: Wrench, ownerOnly: true, translationKey: "admin.nav.maintenance" },
        { to: p("/security"), label: "Security", icon: Lock, translationKey: "admin.nav.security" },
        { to: p("/settings"), label: "Settings", icon: Settings, ownerOnly: true, translationKey: "admin.nav.settings" },
      ],
    },
  ];
}

/** @deprecated Use makeAdminNav(base) instead */
export const ADMIN_NAV = makeAdminNav("/ilmoz-admin");
