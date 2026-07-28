import { Center, CenterNetwork, Course, Group, Lesson, Payment, Room, Student, Test, TestSubmission, User } from "../types";
import { uid } from "../lib/utils";
import { Repository } from "./repository";
import { DEMO_CENTER, DEMO_COURSES, DEMO_GROUPS, DEMO_ROOMS, DEMO_STUDENTS, DEMO_USERS } from "./seed";

const KEY = "nexo:db:v1";

interface DB {
  centers: Center[];
  users: User[];
  rooms: Room[];
  courses: Course[];
  groups: Group[];
  students: Student[];
  lessons: Lesson[];
  payments: Payment[];
  tests?: Test[];
  testSubmissions?: TestSubmission[];
  networks: CenterNetwork[];
}

function seedDB(): DB {
  return { 
    centers: [DEMO_CENTER], 
    users: DEMO_USERS, 
    rooms: DEMO_ROOMS, 
    courses: DEMO_COURSES, 
    groups: DEMO_GROUPS, 
    students: DEMO_STUDENTS, 
    lessons: [], 
    payments: [],
    networks: [],
  };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { const f = seedDB(); localStorage.setItem(KEY, JSON.stringify(f)); return f; }
    return JSON.parse(raw) as DB;
  } catch { return seedDB(); }
}

function save(db: DB) { localStorage.setItem(KEY, JSON.stringify(db)); }

const delay = <T,>(v: T, ms = 220): Promise<T> => new Promise(r => setTimeout(() => r(v), ms));
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export class MockRepository implements Repository {
  async getCenter(centerId: string) {
    return delay(load().centers.find(x => x.id === centerId) ?? null);
  }
  async createCenter(input: { name: string; subdomain?: string; description?: string; logoUrl?: string; currency?: string; id?: string }) {
    const db = load();
    const center: Center = {
      id: (input as any).id ?? uid("center"),
      name: input.name,
      slug: slugify(input.name),
      ...(input.subdomain ? { subdomain: input.subdomain } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.logoUrl ? { logoUrl: input.logoUrl } : {}),
      currency: input.currency ?? "USD",
      createdAt: new Date(0).toISOString(),
    };
    db.centers.push(center); save(db); return delay(center);
  }
  async isSubdomainAvailable(_subdomain: string) { return delay(true); }
  async getSubdomainCenterId(_subdomain: string) { return delay(null as string | null); }
  async updateCenter(centerId: string, patch: Partial<Omit<Center, "id">>) {
    const db = load();
    const idx = db.centers.findIndex(c => c.id === centerId);
    if (idx === -1) throw new Error("Center not found");
    db.centers[idx] = Object.assign({}, db.centers[idx], patch);
    save(db); return delay(db.centers[idx]);
  }

  // Networks
  async getNetwork(id: string) { return delay(load().networks.find(n => n.id === id) || null); }
  async getNetworkByOwner(ownerId: string) { return delay(load().networks.find(n => n.ownerId === ownerId) || null); }
  async getNetworkByCenterId(centerId: string) { return delay(load().networks.find(n => n.headquartersCenterId === centerId || n.branchIds.includes(centerId)) || null); }
  async createNetwork(input: any): Promise<CenterNetwork> { throw new Error("Not implemented in mock"); }
  async createBranch(networkId: string, branchInput: any): Promise<Center> { throw new Error("Not implemented in mock"); }
  async linkBranchToNetwork(networkId: string, subdomain: string): Promise<Center> { throw new Error("Not implemented in mock"); }
  async removeBranchFromNetwork(networkId: string, branchCenterId: string): Promise<void> { throw new Error("Not implemented in mock"); }
  async getNetworkBranches(networkId: string): Promise<Center[]> { return delay([]); }

  async listUsers(centerId: string) { return delay(load().users.filter(u => u.centerId === centerId)); }
  async getUserByLogin(login: string) {
    const key = login.trim().toLowerCase();
    return delay(load().users.find(u =>
      u.email?.toLowerCase() === key ||
      u.username?.toLowerCase() === key ||
      u.phone === key
    ) ?? null);
  }
  async isPhoneUnique(phone: string, exceptUid?: string) {
    const found = load().users.find(u => u.phone === phone && u.id !== exceptUid);
    return delay(!found);
  }
  async createUser(input: Omit<User, "id"> & { id?: string }) {
    const db = load();
    const { id: providedId, ...rest } = input as any;
    const user: User = { id: providedId ?? uid("u"), ...rest };
    db.users.push(user); save(db); return delay(user);
  }
  async hasAnyUser() { return delay(load().users.length > 0); }
  async hasAnyAdmin() { return delay(load().users.some((u: any) => u.isadm)); }
  async markPlatformInitialized() { return delay(undefined as void); }

  async listRooms(centerId: string) { return delay(load().rooms.filter(r => r.centerId === centerId)); }
  async createRoom(input: Omit<Room, "id">) {
    const db = load();
    const room: Room = { id: uid("room"), ...input };
    db.rooms.push(room); save(db); return delay(room);
  }
  async deleteRoom(centerId: string, roomId: string) {
    const db = load();
    db.rooms = db.rooms.filter(r => !(r.id === roomId && r.centerId === centerId));
    save(db); return delay(undefined as void);
  }

  async listCourses(centerId: string) { return delay(load().courses.filter(x => x.centerId === centerId)); }
  async createCourse(input: Omit<Course, "id">) {
    const db = load();
    const course: Course = { id: uid("course"), ...input };
    db.courses.push(course); save(db); return delay(course);
  }
  async updateCourse(centerId: string, courseId: string, data: Partial<Course>) {
    const db = load();
    db.courses = db.courses.map(c => c.id === courseId && c.centerId === centerId ? { ...c, ...data } : c);
    save(db); return delay(undefined as void);
  }
  async deleteCourse(centerId: string, courseId: string) {
    const db = load();
    db.courses = db.courses.filter(c => !(c.id === courseId && c.centerId === centerId));
    save(db); return delay(undefined as void);
  }

  async listGroups(centerId: string) { return delay(load().groups.filter(g => g.centerId === centerId)); }
  async createGroup(input: Omit<Group, "id">) {
    const db = load();
    const group: Group = { id: uid("group"), ...input };
    db.groups.push(group); save(db); return delay(group);
  }
  async updateGroup(centerId: string, groupId: string, patch: Partial<Omit<Group, "id" | "centerId">>) {
    const db = load();
    db.groups = db.groups.map(g => g.id === groupId && g.centerId === centerId ? { ...g, ...patch } : g);
    save(db); return delay(undefined as void);
  }

  async listStudents(centerId: string) { return delay(load().students.filter(s => s.centerId === centerId)); }
  async createStudent(input: Omit<Student, "id">) {
    const db = load();
    const student: Student = { id: uid("student"), ...input };
    db.students.push(student); save(db); return delay(student);
  }
  async updateStudent(centerId: string, studentId: string, patch: Partial<Omit<Student, "id" | "centerId">>) {
    const db = load();
    db.students = db.students.map(s => s.id === studentId && s.centerId === centerId ? { ...s, ...patch } : s);
    save(db); return delay(undefined as void);
  }

  async listLessons(centerId: string, groupId: string) {
    return delay(load().lessons.filter(l => l.centerId === centerId && l.groupId === groupId));
  }
  async createLesson(input: Omit<Lesson, "id">) {
    const db = load();
    const lesson: Lesson = { id: uid("lesson"), ...input };
    db.lessons.push(lesson); save(db); return delay(lesson);
  }
  async updateLesson(centerId: string, lessonId: string, patch: Partial<Omit<Lesson, "id" | "centerId">>) {
    const db = load();
    const idx = db.lessons.findIndex(l => l.id === lessonId && l.centerId === centerId);
    if (idx === -1) throw new Error("Lesson not found");
    db.lessons[idx] = { ...db.lessons[idx], ...patch };
    save(db); return delay(db.lessons[idx]);
  }

  // ── Tests ─────────────────────────────────────────────────────────────────
  async listTests(centerId: string) {
    const db = load();
    return delay((db.tests || []).filter(t => t.centerId === centerId));
  }
  async createTest(input: Omit<Test, "id">) {
    const db = load();
    if (!db.tests) db.tests = [];
    const test: Test = { id: uid("test"), ...input };
    db.tests.push(test); save(db); return delay(test);
  }
  async updateTest(centerId: string, testId: string, patch: Partial<Omit<Test, "id" | "centerId">>) {
    const db = load();
    if (!db.tests) db.tests = [];
    db.tests = db.tests.map(t => t.id === testId && t.centerId === centerId ? { ...t, ...patch } : t);
    save(db); return delay(undefined as void);
  }
  async deleteTest(centerId: string, testId: string) {
    const db = load();
    db.tests = (db.tests || []).filter(t => !(t.id === testId && t.centerId === centerId));
    save(db); return delay(undefined as void);
  }

  // ── Test submissions ─────────────────────────────────────────────────────
  async listTestSubmissions(centerId: string, testId: string) {
    const db = load();
    return delay((db.testSubmissions || []).filter(s => s.centerId === centerId && s.testId === testId));
  }
  async createTestSubmission(input: Omit<TestSubmission, "id">) {
    const db = load();
    if (!db.testSubmissions) db.testSubmissions = [];
    const submission: TestSubmission = { id: uid("submission"), ...input };
    db.testSubmissions.push(submission); save(db); return delay(submission);
  }

  // ── Payments (Finance) ────────────────────────────────────────────────────
  async listPayments(centerId: string) {
    const db = load();
    const payments = db.payments || [];
    return delay(payments.filter(p => p.centerId === centerId));
  }
  async createPayment(input: Omit<Payment, "id">) {
    const db = load();
    if (!db.payments) db.payments = [];
    const payment: Payment = { id: uid("payment"), ...input };
    db.payments.push(payment);
    save(db);
    return delay(payment);
  }
  async updatePayment(centerId: string, paymentId: string, patch: Partial<Omit<Payment, "id" | "centerId">>) {
    const db = load();
    if (!db.payments) db.payments = [];
    const idx = db.payments.findIndex(p => p.id === paymentId && p.centerId === centerId);
    if (idx !== -1) {
      db.payments[idx] = { ...db.payments[idx], ...patch };
      save(db);
    }
    return delay(undefined);
  }
  async deletePayment(centerId: string, paymentId: string) {
    const db = load();
    if (!db.payments) db.payments = [];
    db.payments = db.payments.filter(p => !(p.id === paymentId && p.centerId === centerId));
    save(db);
    return delay(undefined);
  }

  // Platform admin stubs (mock only returns empty data)
  async adminListAllCenters() { return delay([]); }
  async adminListAllUsers() { return delay([]); }
  async adminListUsersOfCenter(_centerId: string) { return delay([]); }
  async adminUpdateCenter(centerId: string, patch: any) { return this.updateCenter(centerId, patch); }
  async adminListModerators() { return delay([]); }
  async adminUpdateModerator(_id: string, _patch: any) { return delay(undefined); }
  async adminDeleteModerator(_id: string) { return delay(undefined); }
  async adminListLogs() { return delay([]); }
  async adminAddLog(entry: any) { return delay({ id: uid("log"), ...entry }); }
  async adminListTickets() { return delay([]); }
  async adminUpdateTicket(_id: string, _patch: any) { return delay(undefined); }
  async adminListPlatformPayments() { return delay([]); }
  async adminListFeatureFlags() { return delay([]); }
  async adminUpdateFeatureFlag(_key: string, _patch: any) { return delay(undefined); }
  async adminListVersions() { return delay([]); }
  async adminGetPlatformSettings() { return delay(null); }
  async adminUpdatePlatformSettings(_patch: any) { return delay(undefined); }
  async adminGetMaintenance() { return delay(null); }
  async adminSetMaintenance(_state: any) { return delay(undefined); }
  async adminListPlans() { return delay([]); }
  async adminUpdatePlan(_tier: string, _patch: any) { return delay(undefined); }
  async adminListNews() { return delay([]); }
  async adminListCampaigns() { return delay([]); }
  async adminListCoupons() { return delay([]); }
}

export const repository: Repository = new MockRepository();
