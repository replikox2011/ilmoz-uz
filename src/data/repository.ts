import { Center, CenterNetwork, Course, Group, Lesson, Payment, Room, Student, Test, TestSubmission, User } from "../types";
import {
  LogEntry,
  Moderator,
  Ticket,
  PlatformPayment,
  FeatureFlag,
  ReleaseVersion,
  MaintenanceState,
  PlatformSettings,
  Plan,
  NewsPost,
  Campaign,
  Coupon,
} from "../types/admin";

export interface Repository {
  // Tenancy
  getCenter(centerId: string): Promise<Center | null>;
  createCenter(input: { name: string; subdomain?: string; description?: string; logoUrl?: string; currency?: string; id?: string }): Promise<Center>;
  updateCenter(centerId: string, patch: Partial<Omit<Center, "id">>): Promise<Center>;
  isSubdomainAvailable(subdomain: string): Promise<boolean>;
  getSubdomainCenterId(subdomain: string): Promise<string | null>;

  // Networks (multi-branch)
  getNetwork(networkId: string): Promise<CenterNetwork | null>;
  getNetworkByOwner(ownerId: string): Promise<CenterNetwork | null>;
  getNetworkByCenterId(centerId: string): Promise<CenterNetwork | null>;
  createNetwork(input: { name: string; ownerId: string; headquartersCenterId: string }): Promise<CenterNetwork>;
  createBranch(networkId: string, branchInput: { name: string; subdomain?: string; currency?: string; description?: string }): Promise<Center>;
  removeBranchFromNetwork(networkId: string, branchCenterId: string): Promise<void>;
  getNetworkBranches(networkId: string): Promise<Center[]>;

  // Users
  listUsers(centerId: string): Promise<User[]>;
  getUserByLogin(login: string): Promise<User | null>;
  isPhoneUnique(phone: string, exceptUid?: string): Promise<boolean>;
  createUser(input: Omit<User, "id"> & { id?: string }): Promise<User>;
  /** True if at least one user exists on the whole platform (used for first-launch bootstrap). */
  hasAnyUser(): Promise<boolean>;
  /** True if a platform admin (isadm: true) already exists. */
  hasAnyAdmin(): Promise<boolean>;
  /** Write public flag so hasAnyAdmin works without auth. */
  markPlatformInitialized(): Promise<void>;

  // Rooms
  listRooms(centerId: string): Promise<Room[]>;
  createRoom(input: Omit<Room, "id">): Promise<Room>;
  deleteRoom(centerId: string, roomId: string): Promise<void>;

  // Courses
  listCourses(centerId: string): Promise<Course[]>;
  createCourse(input: Omit<Course, "id">): Promise<Course>;
  updateCourse(centerId: string, courseId: string, data: Partial<Course>): Promise<void>;
  deleteCourse(centerId: string, courseId: string): Promise<void>;

  // Groups
  listGroups(centerId: string): Promise<Group[]>;
  createGroup(input: Omit<Group, "id">): Promise<Group>;
  updateGroup(centerId: string, groupId: string, patch: Partial<Omit<Group, "id" | "centerId">>): Promise<void>;

  // Students
  listStudents(centerId: string): Promise<Student[]>;
  createStudent(input: Omit<Student, "id"> & { id?: string }): Promise<Student>;
  updateStudent(centerId: string, studentId: string, patch: Partial<Omit<Student, "id" | "centerId">>): Promise<void>;

  // Lessons (E-Journal)
  listLessons(centerId: string, groupId: string): Promise<Lesson[]>;
  createLesson(input: Omit<Lesson, "id">): Promise<Lesson>;
  updateLesson(centerId: string, lessonId: string, patch: Partial<Omit<Lesson, "id" | "centerId">>): Promise<Lesson>;

  // Tests (AI-generated quizzes)
  listTests(centerId: string): Promise<Test[]>;
  createTest(input: Omit<Test, "id">): Promise<Test>;
  updateTest(centerId: string, testId: string, patch: Partial<Omit<Test, "id" | "centerId">>): Promise<void>;
  deleteTest(centerId: string, testId: string): Promise<void>;

  // Test submissions
  listTestSubmissions(centerId: string, testId: string): Promise<TestSubmission[]>;
  createTestSubmission(input: Omit<TestSubmission, "id">): Promise<TestSubmission>;

  // Payments (Finance)
  listPayments(centerId: string): Promise<Payment[]>;
  createPayment(input: Omit<Payment, "id">): Promise<Payment>;
  updatePayment(centerId: string, paymentId: string, patch: Partial<Omit<Payment, "id" | "centerId">>): Promise<void>;
  deletePayment(centerId: string, paymentId: string): Promise<void>;

  // Platform admin — access requires isadm: true or ismod: true in caller's Firestore profile
  adminListAllCenters(): Promise<Center[]>;
  adminListAllUsers(): Promise<User[]>;
  adminListUsersOfCenter(centerId: string): Promise<User[]>;
  adminUpdateCenter(centerId: string, patch: Partial<Omit<Center, "id">>): Promise<Center>;

  // Platform admin — moderators (stored in userProfiles with ismod: true)
  adminListModerators(): Promise<Moderator[]>;
  adminUpdateModerator(id: string, patch: Partial<Omit<Moderator, "id">>): Promise<void>;
  adminDeleteModerator(id: string): Promise<void>;

  // Platform admin — audit logs
  adminListLogs(limitCount?: number): Promise<LogEntry[]>;
  adminAddLog(entry: Omit<LogEntry, "id">): Promise<LogEntry>;

  // Platform admin — support tickets
  adminListTickets(): Promise<Ticket[]>;
  adminUpdateTicket(id: string, patch: Partial<Omit<Ticket, "id">>): Promise<void>;

  // Platform admin — platform-level payments
  adminListPlatformPayments(): Promise<PlatformPayment[]>;

  // Platform admin — feature flags
  adminListFeatureFlags(): Promise<FeatureFlag[]>;
  adminUpdateFeatureFlag(key: string, patch: Partial<Omit<FeatureFlag, "key">>): Promise<void>;

  // Platform admin — release versions
  adminListVersions(): Promise<ReleaseVersion[]>;

  // Platform admin — platform settings (single doc: platformConfig/settings)
  adminGetPlatformSettings(): Promise<PlatformSettings | null>;
  adminUpdatePlatformSettings(patch: Partial<PlatformSettings>): Promise<void>;

  // Platform admin — maintenance mode (single doc: platformConfig/maintenance)
  adminGetMaintenance(): Promise<MaintenanceState | null>;
  adminSetMaintenance(state: MaintenanceState): Promise<void>;

  // Platform admin — subscription plans (platformPlans collection)
  adminListPlans(): Promise<Plan[]>;
  adminUpdatePlan(tier: string, patch: Partial<Omit<Plan, "tier">>): Promise<void>;

  // Platform admin — marketing collections
  adminListNews(): Promise<NewsPost[]>;
  adminListCampaigns(): Promise<Campaign[]>;
  adminListCoupons(): Promise<Coupon[]>;
}

