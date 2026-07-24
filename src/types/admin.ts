// ---------------------------------------------------------------------------
// Ilmoz Admin (platform console) — types
//
// These model platform-operations concepts (billing, support, moderation,
// logs, releases, feature flags, settings) that do not yet have a Firestore
// backend. They exist so the Admin Workspace UI is fully typed today and can be
// wired to real collections later without reshaping the pages.
// ---------------------------------------------------------------------------

// ── Subscriptions / plans ────────────────────────────────────────────────────
export type PlanTier = "starter" | "standard" | "pro";
export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  tier: PlanTier;
  name: string;
  priceMonthly: number; // USD
  priceYearly: number; // USD
  /** -1 = unlimited */
  maxUsers: number;
  maxStudents: number;
  storageGb: number;
  aiCredits: number; // monthly AI request allowance
  features: string[];
}

export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled";

export interface Subscription {
  centerId: string;
  tier: PlanTier;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  startedAt: string; // ISO
  renewsAt: string; // ISO
  seats: number;
}

// ── Platform-level payments (SaaS billing, not tuition) ──────────────────────
export type PlatformPaymentStatus = "succeeded" | "pending" | "failed" | "refunded";

export interface PlatformPayment {
  id: string;
  centerId: string;
  centerName: string;
  amount: number;
  currency: string;
  tier: PlanTier;
  cycle: BillingCycle;
  status: PlatformPaymentStatus;
  method: string; // "Visa •• 4242", "Payme", …
  createdAt: string; // ISO
}

// ── Support tickets ──────────────────────────────────────────────────────────
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface Ticket {
  id: string;
  subject: string;
  centerName: string;
  requester: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  messages: number;
}

// ── Audit / activity logs ────────────────────────────────────────────────────
export type LogResult = "success" | "failure";

export interface LogEntry {
  id: string;
  actor: string;
  role: string;
  action: string;
  target?: string;
  at: string; // ISO
  ip: string;
  device: string;
  browser: string;
  result: LogResult;
}

// ── Moderators + RBAC ────────────────────────────────────────────────────────
export type PermissionKey =
  | "organizations.view"
  | "organizations.manage"
  | "users.view"
  | "users.manage"
  | "subscriptions.manage"
  | "payments.view"
  | "support.manage"
  | "marketing.manage"
  | "logs.view"
  | "settings.manage"
  | "moderators.manage";

export const ALL_PERMISSIONS: PermissionKey[] = [
  "organizations.view",
  "organizations.manage",
  "users.view",
  "users.manage",
  "subscriptions.manage",
  "payments.view",
  "support.manage",
  "marketing.manage",
  "logs.view",
  "settings.manage",
  "moderators.manage",
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "organizations.view": "View organizations",
  "organizations.manage": "Manage organizations",
  "users.view": "View users",
  "users.manage": "Manage users",
  "subscriptions.manage": "Manage subscriptions",
  "payments.view": "View payments",
  "support.manage": "Manage support",
  "marketing.manage": "Manage marketing",
  "logs.view": "View logs",
  "settings.manage": "Manage settings",
  "moderators.manage": "Manage moderators",
};

export interface Moderator {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  permissions: PermissionKey[];
  twoFactor: boolean;
  blocked: boolean;
  lastActive: string; // ISO
  createdAt: string; // ISO
}

// ── Feature flags ────────────────────────────────────────────────────────────
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  /** center ids the flag is rolled out to; empty + enabled = everyone */
  centerIds: string[];
}

// ── Version manager ──────────────────────────────────────────────────────────
export interface ReleaseVersion {
  version: string;
  date: string; // ISO
  current: boolean;
  features: string[];
  fixes: string[];
}

// ── Maintenance mode ─────────────────────────────────────────────────────────
export interface MaintenanceState {
  enabled: boolean;
  title: string;
  message: string;
  /** ISO timestamp of estimated end, or "" */
  until: string;
}

// ── Session / security ───────────────────────────────────────────────────────
export interface ActiveSession {
  id: string;
  user: string;
  role: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastSeen: string; // ISO
  current: boolean;
}

// ── Marketing ────────────────────────────────────────────────────────────────
export type NewsStatus = "published" | "draft";
export interface NewsPost {
  id: string;
  title: string;
  date: string; // ISO
  status: NewsStatus;
}

export type CampaignStatus = "sent" | "scheduled" | "draft";
export interface Campaign {
  id: string;
  name: string;
  type: "email" | "push";
  sent: number;
  opens: number; // percent
  status: CampaignStatus;
  scheduledAt?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: string;
  uses: number;
  cap: number;
  expiresAt?: string;
}

// ── Platform settings ────────────────────────────────────────────────────────
export interface PlatformSettings {
  rootDomain: string;
  supportEmail: string;
  smtpHost: string;
  smtpPort: number;
  aiModel: string;
  registrationOpen: boolean;
  googleAuth: boolean;
  emailAuth: boolean;
  enforce2faOwners: boolean;
  enforce2faModerators: boolean;
  loginNotifications: boolean;
}
