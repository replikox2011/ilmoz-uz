// ---------------------------------------------------------------------------
// Ilmoz — core domain types
// ---------------------------------------------------------------------------

export type Role =
  | "owner"
  | "director"
  | "administrator"
  | "teacher"
  | "student"
  | "parent";

export const ROLES: Role[] = [
  "owner",
  "director",
  "administrator",
  "teacher",
  "student",
  "parent",
];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  director: "Director",
  administrator: "Administrator",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
};

/**
 * Per-center customization of the subdomain login page.
 * All fields optional — an unset `loginTheme` falls back to the default Ilmoz look.
 * Edited via a visual builder in Settings; no code required.
 */
export interface LoginTheme {
  /** One of the ids in `src/config/loginTemplates.ts` (e.g. "aurora"). */
  templateId: string;
  /** Accent color as hex — overrides the template's default accent. */
  accent?: string;
  /** Big headline shown on the brand panel (defaults to center name). */
  headline?: string;
  /** Sub-headline / tagline under the headline. */
  tagline?: string;
  /** Firebase Storage URL for a background/cover image (used by image templates). */
  backgroundUrl?: string;
  /** Hide the "Powered by Ilmoz" footer/badge. */
  hidePoweredBy?: boolean;
}

/** A learning center = an isolated tenant workspace. */
export interface Center {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;      // unique subdomain, e.g. "applikata" → applikata.ilmoz.app
  description?: string;    // short center description shown on subdomain login page
  logoUrl?: string;        // Firebase Storage download URL
  currency: string;
  createdAt: string;
  loginTheme?: LoginTheme; // subdomain login page customization (visual builder)
  // ── Network / Branch support ───────────────────────────────────────────────
  networkId?: string;        // id of the CenterNetwork this center belongs to
  isHeadquarters?: boolean;  // true for the root/HQ center of a network
  ownerEmail?: string;       // email of the center owner (used for multi-tenant account recovery)
}

/**
 * A network groups one HQ center with one or more branch centers.
 * Only the owner of the HQ center can manage the network.
 */
export interface CenterNetwork {
  id: string;
  name: string;
  ownerId: string;               // Firebase UID of the HQ owner
  headquartersCenterId: string;  // Center.id of the HQ
  branchIds: string[];           // Center.id[] of every branch
  createdAt: string;             // ISO string
}


export interface User {
  id: string;          // Firebase Auth UID
  centerId: string;
  name: string;
  email?: string;      // null for phone-only accounts
  phone?: string;      // null for email/Google accounts
  username?: string;
  role: Role;
  avatarColor: string;
  phoneVerified?: boolean; // false = must verify phone on first login (students)
  isadm?: boolean;         // platform-level admin (access to ilmoz.app)
  ismod?: boolean;         // platform-level moderator (access to ilmoz.app)
  createdAt?: string;      // ISO string
  birthDate?: string;      // "YYYY-MM-DD"
  parentId?: string;       // for student role — UID of parent userProfile
}

export interface Room {
  id: string;
  centerId: string;
  name: string;
}

export interface Course {
  id: string;
  centerId: string;
  name: string;
  color: string;
  description?: string;
  teacherIds?: string[];
  rooms?: string[]; // аудитории курса, напр. ["400", "401", "402"]
}

export type GroupStatus = "active" | "completed" | "archived";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const WEEKDAYS: { key: Weekday; short: string; label: string }[] = [
  { key: "mon", short: "Mon", label: "Monday" },
  { key: "tue", short: "Tue", label: "Tuesday" },
  { key: "wed", short: "Wed", label: "Wednesday" },
  { key: "thu", short: "Thu", label: "Thursday" },
  { key: "fri", short: "Fri", label: "Friday" },
  { key: "sat", short: "Sat", label: "Saturday" },
  { key: "sun", short: "Sun", label: "Sunday" },
];

export interface Group {
  id: string;
  centerId: string;
  name: string;
  courseId: string;
  teacherId: string;
  roomId: string;
  days: Weekday[];
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  startDate: string;
  endDate?: string;
  maxStudents: number;
  studentIds: string[];
  status: GroupStatus;
  price?: number;
}

export interface Assignment {
  id: string;
  title: string;
  /** Maximum score a student can earn for this assignment. */
  maxScore: number;
  /** Minimum score a student must reach to pass this assignment. */
  passScore: number;
}

export interface Lesson {
  id: string;
  centerId: string;
  groupId: string;
  date: string;        // "YYYY-MM-DD"
  topic: string;
  homework?: string;
  notes?: string;
  /** studentId → present */
  attendance: Record<string, boolean>;
  /** Graded tasks for this lesson; each has its own max score. */
  assignments?: Assignment[];
  /** studentId → (assignmentId → score earned). */
  grades?: Record<string, Record<string, number>>;
}

export interface Student {
  id: string;
  centerId: string;
  name: string;
  phone?: string;
  parentId?: string;
  groupIds: string[];
  avatarColor: string;
  createdAt?: string;  // ISO string
  birthDate?: string;  // "YYYY-MM-DD"
}

export type TestQuestionType = "mcq" | "short";

export interface TestQuestion {
  id: string;
  type: TestQuestionType;
  prompt: string;
  /** MCQ only. */
  options?: string[];
  /** MCQ: index into options. Short: expected answer text (case-insensitive match). */
  correctAnswer: string | number;
  points: number;
}

export type TestStatus = "draft" | "active" | "closed";

/** An AI-generated test, scoped to a center and (once activated) a single group. */
export interface Test {
  id: string;
  centerId: string;
  title: string;
  topic: string;
  createdBy: string; // teacher user id
  questions: TestQuestion[];
  status: TestStatus;
  groupId?: string;      // set when activated for a group
  activatedAt?: string;  // ISO string
  createdAt: string;     // ISO string
  sources?: { title: string; url: string }[]; // web-search citations used during generation
}

/** A single student's attempt/result for an activated test. */
export interface TestSubmission {
  id: string;
  centerId: string;
  testId: string;
  groupId: string;
  studentId: string;
  /** questionId → student's answer (option index as string, or free text). */
  answers: Record<string, string>;
  score: number;
  maxScore: number;
  submittedAt: string; // ISO string
}

export type PaymentStatus = "paid" | "pending" | "overdue";
export type PaymentType = "tuition" | "registration" | "material" | "other";

export interface Payment {
  id: string;
  centerId: string;
  studentId: string;
  groupId?: string;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  dueDate: string;      // "YYYY-MM-DD"
  paidDate?: string;    // "YYYY-MM-DD"
  note?: string;
  createdAt: string;
}
