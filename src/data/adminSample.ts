// ---------------------------------------------------------------------------
// Sample fixtures for Ilmoz Admin console sections whose backend model does not
// exist yet (billing, support, logs, moderators, flags, releases, sessions).
//
// These are READ-ONLY demo values so the fully-built UI has something to render.
// Swap each `getX()` for a real repository call when the collection lands.
// Dates are hard-coded ISO strings (deterministic, no Date.now()).
// ---------------------------------------------------------------------------

import {
  Plan,
  PlatformPayment,
  Ticket,
  LogEntry,
  Moderator,
  FeatureFlag,
  ReleaseVersion,
  ActiveSession,
  PlatformSettings,
  PermissionKey,
} from "../types/admin";

// ── Plans (the three published tiers) ────────────────────────────────────────
export const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    priceMonthly: 0,
    priceYearly: 0,
    maxUsers: 5,
    maxStudents: 50,
    storageGb: 1,
    aiCredits: 100,
    features: ["Groups & schedule", "E-Journal", "Basic finance", "Email support"],
  },
  {
    tier: "standard",
    name: "Standard",
    priceMonthly: 29,
    priceYearly: 290,
    maxUsers: 25,
    maxStudents: 400,
    storageGb: 20,
    aiCredits: 2000,
    features: [
      "Everything in Starter",
      "AI Copilot",
      "Analytics",
      "Custom subdomain login",
      "Priority support",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    priceMonthly: 79,
    priceYearly: 790,
    maxUsers: -1,
    maxStudents: -1,
    storageGb: 200,
    aiCredits: 20000,
    features: [
      "Everything in Standard",
      "Unlimited users & students",
      "Advanced AI analytics",
      "White-label branding",
      "Dedicated support",
    ],
  },
];

// ── Platform payments (SaaS billing) ─────────────────────────────────────────
export const SAMPLE_PAYMENTS: PlatformPayment[] = [
  { id: "pp_01", centerId: "c1", centerName: "Applikata", amount: 79, currency: "USD", tier: "pro", cycle: "monthly", status: "succeeded", method: "Visa •• 4242", createdAt: "2026-07-09T09:12:00.000Z" },
  { id: "pp_02", centerId: "c2", centerName: "BrightPath", amount: 290, currency: "USD", tier: "standard", cycle: "yearly", status: "succeeded", method: "Payme", createdAt: "2026-07-08T14:40:00.000Z" },
  { id: "pp_03", centerId: "c3", centerName: "LinguaHub", amount: 29, currency: "USD", tier: "standard", cycle: "monthly", status: "pending", method: "Click", createdAt: "2026-07-08T08:05:00.000Z" },
  { id: "pp_04", centerId: "c4", centerName: "CodeAcademy UZ", amount: 79, currency: "USD", tier: "pro", cycle: "monthly", status: "failed", method: "Mastercard •• 8801", createdAt: "2026-07-07T19:22:00.000Z" },
  { id: "pp_05", centerId: "c5", centerName: "MathPro", amount: 29, currency: "USD", tier: "standard", cycle: "monthly", status: "refunded", method: "Visa •• 1155", createdAt: "2026-07-06T11:30:00.000Z" },
  { id: "pp_06", centerId: "c6", centerName: "SmartKids", amount: 790, currency: "USD", tier: "pro", cycle: "yearly", status: "succeeded", method: "Uzcard", createdAt: "2026-07-05T16:48:00.000Z" },
];

// ── Support tickets ──────────────────────────────────────────────────────────
export const SAMPLE_TICKETS: Ticket[] = [
  { id: "tk_01", subject: "Cannot upload center logo", centerName: "Applikata", requester: "Dilnoza R.", status: "open", priority: "high", createdAt: "2026-07-10T10:00:00.000Z", updatedAt: "2026-07-11T08:20:00.000Z", messages: 3 },
  { id: "tk_02", subject: "Billing invoice request", centerName: "BrightPath", requester: "Sardor K.", status: "pending", priority: "normal", createdAt: "2026-07-09T12:15:00.000Z", updatedAt: "2026-07-10T09:00:00.000Z", messages: 2 },
  { id: "tk_03", subject: "AI Copilot returns error", centerName: "CodeAcademy UZ", requester: "Aziza T.", status: "open", priority: "urgent", createdAt: "2026-07-11T06:30:00.000Z", updatedAt: "2026-07-11T07:10:00.000Z", messages: 5 },
  { id: "tk_04", subject: "How to add a parent account?", centerName: "SmartKids", requester: "Jamshid B.", status: "resolved", priority: "low", createdAt: "2026-07-07T09:45:00.000Z", updatedAt: "2026-07-08T14:00:00.000Z", messages: 4 },
  { id: "tk_05", subject: "Subdomain not resolving", centerName: "LinguaHub", requester: "Malika S.", status: "closed", priority: "high", createdAt: "2026-07-05T11:20:00.000Z", updatedAt: "2026-07-06T10:30:00.000Z", messages: 6 },
];

// ── Audit logs ───────────────────────────────────────────────────────────────
export const SAMPLE_LOGS: LogEntry[] = [
  { id: "lg_01", actor: "Nodirbek", role: "owner", action: "subscription.updated", target: "Applikata → Pro", at: "2026-07-11T08:40:00.000Z", ip: "213.230.98.10", device: "MacBook Pro", browser: "Chrome 126", result: "success" },
  { id: "lg_02", actor: "Moderator A", role: "moderator", action: "organization.blocked", target: "MathPro", at: "2026-07-11T07:55:00.000Z", ip: "84.54.72.3", device: "Windows PC", browser: "Edge 126", result: "success" },
  { id: "lg_03", actor: "Nodirbek", role: "owner", action: "login", at: "2026-07-11T07:10:00.000Z", ip: "213.230.98.10", device: "iPhone 15", browser: "Safari 18", result: "success" },
  { id: "lg_04", actor: "unknown", role: "—", action: "login", target: "admin@ilmoz.uz", at: "2026-07-10T23:12:00.000Z", ip: "45.155.205.99", device: "Linux", browser: "Firefox 128", result: "failure" },
  { id: "lg_05", actor: "Moderator A", role: "moderator", action: "ticket.replied", target: "tk_03", at: "2026-07-10T16:20:00.000Z", ip: "84.54.72.3", device: "Windows PC", browser: "Edge 126", result: "success" },
  { id: "lg_06", actor: "Nodirbek", role: "owner", action: "featureflag.enabled", target: "ai-analytics", at: "2026-07-10T14:02:00.000Z", ip: "213.230.98.10", device: "MacBook Pro", browser: "Chrome 126", result: "success" },
];

// ── Moderators ───────────────────────────────────────────────────────────────
const ALL_PERMS: PermissionKey[] = [
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

export const SAMPLE_MODERATORS: Moderator[] = [
  { id: "md_01", name: "Moderator A", email: "a.mod@ilmoz.uz", avatarColor: "#3b6bff", permissions: ["organizations.view", "organizations.manage", "support.manage", "users.view"], twoFactor: true, blocked: false, lastActive: "2026-07-11T08:00:00.000Z", createdAt: "2026-03-02T10:00:00.000Z" },
  { id: "md_02", name: "Moderator B", email: "b.mod@ilmoz.uz", avatarColor: "#22c55e", permissions: ["support.manage", "logs.view", "users.view"], twoFactor: false, blocked: false, lastActive: "2026-07-10T18:30:00.000Z", createdAt: "2026-05-19T09:00:00.000Z" },
  { id: "md_03", name: "Moderator C", email: "c.mod@ilmoz.uz", avatarColor: "#a855f7", permissions: ["payments.view", "marketing.manage"], twoFactor: true, blocked: true, lastActive: "2026-06-28T12:00:00.000Z", createdAt: "2026-01-11T11:00:00.000Z" },
];

export const ALL_PERMISSIONS = ALL_PERMS;

// ── Feature flags ────────────────────────────────────────────────────────────
export const SAMPLE_FLAGS: FeatureFlag[] = [
  { key: "ai-analytics", name: "AI Analytics", description: "Predictive churn & anomaly detection in the admin console.", enabled: true, centerIds: ["c1", "c6"] },
  { key: "new-journal", name: "New E-Journal", description: "Redesigned attendance grid with bulk actions.", enabled: false, centerIds: [] },
  { key: "parent-app", name: "Parent Mobile App", description: "Early access to the parent-facing mobile experience.", enabled: true, centerIds: [] },
  { key: "telegram-bot", name: "Telegram Notifications", description: "Deliver reminders via a Telegram bot.", enabled: false, centerIds: ["c2"] },
];

// ── Releases ─────────────────────────────────────────────────────────────────
export const SAMPLE_VERSIONS: ReleaseVersion[] = [
  {
    version: "2.4.0",
    date: "2026-07-01T00:00:00.000Z",
    current: true,
    features: ["Ilmoz Admin platform console", "AI Copilot tool-calling rounds", "Subdomain login themes"],
    fixes: ["Fixed StrictMode double-init of Firebase", "Corrected currency formatting in Finance"],
  },
  {
    version: "2.3.1",
    date: "2026-06-12T00:00:00.000Z",
    current: false,
    features: ["Parent portal (children view)"],
    fixes: ["Phone verification redirect loop", "Sidebar active-pill animation jitter"],
  },
  {
    version: "2.3.0",
    date: "2026-05-20T00:00:00.000Z",
    current: false,
    features: ["E-Journal attendance", "Room capacity checks"],
    fixes: ["Group/student denormalization sync bug"],
  },
];

// ── Active sessions ──────────────────────────────────────────────────────────
export const SAMPLE_SESSIONS: ActiveSession[] = [
  { id: "se_01", user: "Nodirbek", role: "owner", device: "MacBook Pro", browser: "Chrome 126", ip: "213.230.98.10", location: "Tashkent, UZ", lastSeen: "2026-07-11T08:45:00.000Z", current: true },
  { id: "se_02", user: "Nodirbek", role: "owner", device: "iPhone 15", browser: "Safari 18", ip: "213.230.98.10", location: "Tashkent, UZ", lastSeen: "2026-07-11T07:10:00.000Z", current: false },
  { id: "se_03", user: "Moderator A", role: "moderator", device: "Windows PC", browser: "Edge 126", ip: "84.54.72.3", location: "Samarkand, UZ", lastSeen: "2026-07-11T08:00:00.000Z", current: false },
];

// ── Platform settings defaults ───────────────────────────────────────────────
export const DEFAULT_SETTINGS: PlatformSettings = {
  rootDomain: "ilmoz.uz",
  supportEmail: "support@ilmoz.uz",
  smtpHost: "smtp.mailgun.org",
  smtpPort: 587,
  aiModel: "openai/gpt-4o",
  registrationOpen: true,
  googleAuth: true,
  emailAuth: true,
  enforce2faOwners: true,
  enforce2faModerators: true,
  loginNotifications: true,
};
