import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, query, where, limit, orderBy, writeBatch, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { db } from "../lib/firebase";
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
import { Repository } from "./repository";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function genId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
function strip(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
function fromSnap<T>(d: any): T {
  return { id: d.id, ...d.data() } as T;
}

export class FirestoreRepository implements Repository {
  // ── Centers ───────────────────────────────────────────────────────────────
  async getCenter(id: string) {
    const s = await getDoc(doc(db, "centers", id));
    return s.exists() ? fromSnap<Center>(s) : null;
  }
  async createCenter(input: { name: string; subdomain?: string; description?: string; logoUrl?: string; currency?: string; id?: string; ownerEmail?: string }) {
    const id = (input as any).id ?? genId("center");
    const c: Center = {
      id,
      name: input.name,
      slug: slugify(input.name),
      ...(input.subdomain ? { subdomain: input.subdomain } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.logoUrl ? { logoUrl: input.logoUrl } : {}),
      ...(input.ownerEmail ? { ownerEmail: input.ownerEmail } : {}),
      currency: input.currency ?? "USD",
      createdAt: new Date().toISOString(),
    };
    if (input.subdomain) {
      const batch = writeBatch(db);
      batch.set(doc(db, "centers", id), c);
      batch.set(doc(db, "subdomains", input.subdomain), { centerId: id });
      await batch.commit();
    } else {
      await setDoc(doc(db, "centers", id), c);
    }
    return c;
  }
  async isSubdomainAvailable(subdomain: string) {
    const snap = await getDoc(doc(db, "subdomains", subdomain));
    return !snap.exists();
  }
  async getSubdomainCenterId(subdomain: string) {
    const snap = await getDoc(doc(db, "subdomains", subdomain));
    return snap.exists() ? (snap.data() as { centerId: string }).centerId : null;
  }
  async updateCenter(centerId: string, patch: Partial<Omit<Center, "id">>) {
    await updateDoc(doc(db, "centers", centerId), strip(patch as any));
    return (await this.getCenter(centerId))!;
  }

  // ── Networks (multi-branch) ────────────────────────────────────────────────
  async getNetwork(networkId: string) {
    const s = await getDoc(doc(db, "networks", networkId));
    return s.exists() ? fromSnap<CenterNetwork>(s) : null;
  }
  async getNetworkByOwner(ownerId: string): Promise<CenterNetwork | null> {
    const s = await getDocs(query(collection(db, "networks"), where("ownerId", "==", ownerId), limit(1)));
    return s.empty ? null : fromSnap<CenterNetwork>(s.docs[0]);
  }
  async getNetworkByCenterId(centerId: string): Promise<CenterNetwork | null> {
    // HQ check
    const hqSnap = await getDocs(query(collection(db, "networks"), where("headquartersCenterId", "==", centerId), limit(1)));
    if (!hqSnap.empty) return fromSnap<CenterNetwork>(hqSnap.docs[0]);
    // Branch check
    const brSnap = await getDocs(query(collection(db, "networks"), where("branchIds", "array-contains", centerId), limit(1)));
    return brSnap.empty ? null : fromSnap<CenterNetwork>(brSnap.docs[0]);
  }
  async createNetwork(input: { name: string; ownerId: string; headquartersCenterId: string }): Promise<CenterNetwork> {
    const id = genId("net");
    const network: CenterNetwork = {
      id,
      name: input.name,
      ownerId: input.ownerId,
      headquartersCenterId: input.headquartersCenterId,
      branchIds: [],
      createdAt: new Date().toISOString(),
    };
    const batch = writeBatch(db);
    batch.set(doc(db, "networks", id), network);
    // Mark HQ center
    batch.update(doc(db, "centers", input.headquartersCenterId), { networkId: id, isHeadquarters: true });
    await batch.commit();
    return network;
  }
  async createBranch(networkId: string, branchInput: { name: string; subdomain?: string; currency?: string; description?: string }): Promise<Center> {
    const network = await this.getNetwork(networkId);
    if (!network) throw new Error("Network not found");
    // Create the branch center
    const branch = await this.createCenter({ ...branchInput, currency: branchInput.currency ?? "USD" });
    // Link to network
    const batch = writeBatch(db);
    batch.update(doc(db, "centers", branch.id), { networkId, isHeadquarters: false });
    batch.update(doc(db, "networks", networkId), { branchIds: arrayUnion(branch.id) });
    await batch.commit();
    return { ...branch, networkId, isHeadquarters: false };
  }
  async linkBranchToNetwork(networkId: string, subdomain: string): Promise<Center> {
    const network = await this.getNetwork(networkId);
    if (!network) throw new Error("Tarmoq topilmadi");

    const centerId = await this.getSubdomainCenterId(subdomain);
    if (!centerId) throw new Error("Bunday subdomain topilmadi");

    const branch = await this.getCenter(centerId);
    if (!branch) throw new Error("Markaz topilmadi");
    if (branch.networkId) throw new Error("Bu filial allaqachon tarmoqqa ulangan");

    const batch = writeBatch(db);
    batch.update(doc(db, "centers", branch.id), { networkId, isHeadquarters: false });
    batch.update(doc(db, "networks", networkId), { branchIds: arrayUnion(branch.id) });
    await batch.commit();
    return { ...branch, networkId, isHeadquarters: false };
  }
  async removeBranchFromNetwork(networkId: string, branchCenterId: string): Promise<void> {
    const batch = writeBatch(db);
    batch.update(doc(db, "networks", networkId), { branchIds: arrayRemove(branchCenterId) });
    batch.update(doc(db, "centers", branchCenterId), { networkId: null, isHeadquarters: false });
    await batch.commit();
  }
  async getNetworkBranches(networkId: string): Promise<Center[]> {
    const network = await this.getNetwork(networkId);
    if (!network || network.branchIds.length === 0) return [];
    const snaps = await Promise.all(network.branchIds.map(id => getDoc(doc(db, "centers", id))));
    return snaps.filter(s => s.exists()).map(s => fromSnap<Center>(s));
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  async listUsers(centerId: string) {
    const s = await getDocs(query(collection(db, "userProfiles"), where("centerId", "==", centerId)));
    return s.docs.map((d: any) => fromSnap<User>(d));
  }
  async getUserByLogin(login: string) {
    const key = login.trim().toLowerCase();

    // 1. Try the public username index (readable without auth).
    //    Each entry: userLogins/{username} = { email }
    try {
      const snap = await getDoc(doc(db, "userLogins", key));
      if (snap.exists()) {
        const email = (snap.data() as any).email as string | undefined;
        if (email) {
          // Return a minimal profile stub — caller only needs .email
          return { email } as any;
        }
      }
    } catch {
      // collection doesn't exist yet or rules don't allow — fall through
    }

    // 2. Fallback: query userProfiles directly (requires Firestore rules that
    //    allow unauthenticated list — works in test/dev mode).
    try {
      const s1 = await getDocs(query(collection(db, "userProfiles"), where("email", "==", key)));
      if (!s1.empty) return fromSnap<User>(s1.docs[0]);
      const s2 = await getDocs(query(collection(db, "userProfiles"), where("username", "==", key)));
      if (!s2.empty) return fromSnap<User>(s2.docs[0]);
      const s3 = await getDocs(query(collection(db, "userProfiles"), where("phone", "==", key)));
      return s3.empty ? null : fromSnap<User>(s3.docs[0]);
    } catch {
      return null;
    }
  }
  async isPhoneUnique(phone: string, exceptUid?: string) {
    const s = await getDocs(query(collection(db, "userProfiles"), where("phone", "==", phone)));
    if (s.empty) return true;
    if (exceptUid && s.docs.length === 1 && s.docs[0].id === exceptUid) return true;
    return false;
  }
  async createUser(input: Omit<User, "id"> & { id?: string }) {
    const { id: pid, ...rest } = input as any;
    const id: string = pid ?? genId("u");
    const user: User = {
      id,
      createdAt: input.createdAt ?? new Date().toISOString(),
      ...rest
    };
    const docId = user.centerId ? `${user.centerId}_${id}` : id;
    await setDoc(doc(db, "userProfiles", docId), strip(user as any));

    // Write a public username→email index so pre-auth login lookups work
    // even when Firestore rules require auth for userProfiles.
    // Firestore rule needed:  match /userLogins/{k} { allow read: if true; }
    if (user.username && user.email) {
      try {
        await setDoc(doc(db, "userLogins", user.username.toLowerCase()), { email: user.email });
      } catch {
        // non-fatal: fallback query path still used
      }
    }

    return user;
  }
  async hasAnyUser() {
    const s = await getDocs(query(collection(db, "userProfiles"), limit(1)));
    return !s.empty;
  }
  async hasAnyAdmin() {
    // Read from public meta doc (no auth required) instead of querying userProfiles
    try {
      const snap = await getDoc(doc(db, "platformConfig", "publicMeta"));
      if (snap.exists()) return (snap.data() as any).initialized === true;
    } catch {
      // fall through to authenticated query
    }
    try {
      const s = await getDocs(query(collection(db, "userProfiles"), where("isadm", "==", true), limit(1)));
      return !s.empty;
    } catch {
      return false;
    }
  }
  async markPlatformInitialized() {
    await setDoc(doc(db, "platformConfig", "publicMeta"), { initialized: true });
  }

  // ── Rooms ─────────────────────────────────────────────────────────────────
  async listRooms(centerId: string) {
    const s = await getDocs(collection(db, "centers", centerId, "rooms"));
    return s.docs.map((d: any) => fromSnap<Room>(d));
  }
  async createRoom(input: Omit<Room, "id">) {
    const data = strip(input as any);
    const ref = await addDoc(collection(db, "centers", input.centerId, "rooms"), data);
    return { id: ref.id, ...data } as Room;
  }
  async deleteRoom(centerId: string, roomId: string) {
    await deleteDoc(doc(db, "centers", centerId, "rooms", roomId));
  }

  // ── Courses ───────────────────────────────────────────────────────────────
  async listCourses(centerId: string) {
    const s = await getDocs(collection(db, "centers", centerId, "courses"));
    return s.docs.map((d: any) => fromSnap<Course>(d));
  }
  async createCourse(input: Omit<Course, "id">) {
    const data = strip(input as any);
    const ref = await addDoc(collection(db, "centers", input.centerId, "courses"), data);
    return { id: ref.id, ...data } as Course;
  }
  async updateCourse(centerId: string, courseId: string, data: Partial<Course>) {
    await updateDoc(doc(db, "centers", centerId, "courses", courseId), strip(data as any));
  }
  async deleteCourse(centerId: string, courseId: string) {
    await deleteDoc(doc(db, "centers", centerId, "courses", courseId));
  }

  // ── Groups ────────────────────────────────────────────────────────────────
  async listGroups(centerId: string) {
    const s = await getDocs(collection(db, "centers", centerId, "groups"));
    return s.docs.map((d: any) => fromSnap<Group>(d));
  }
  async createGroup(input: Omit<Group, "id">) {
    const data = strip(input as any);
    const ref = await addDoc(collection(db, "centers", input.centerId, "groups"), data);
    return { id: ref.id, ...data } as Group;
  }
  async updateGroup(centerId: string, groupId: string, patch: Partial<Omit<Group, "id" | "centerId">>) {
    await updateDoc(doc(db, "centers", centerId, "groups", groupId), strip(patch as any));
  }

  // ── Students ──────────────────────────────────────────────────────────────
  async listStudents(centerId: string) {
    const s = await getDocs(collection(db, "centers", centerId, "students"));
    return s.docs.map((d: any) => fromSnap<Student>(d));
  }
  async createStudent(input: Omit<Student, "id"> & { id?: string }) {
    const { id: customId, ...rest } = input as any;
    const studentData = strip({
      createdAt: input.createdAt ?? new Date().toISOString(),
      ...rest,
    });
    if (customId) {
      await setDoc(doc(db, "centers", rest.centerId, "students", customId), studentData);
      return { id: customId, ...studentData } as Student;
    }
    const ref = await addDoc(collection(db, "centers", rest.centerId, "students"), studentData);
    return { id: ref.id, ...studentData } as Student;
  }
  async updateStudent(centerId: string, studentId: string, patch: Partial<Omit<Student, "id" | "centerId">>) {
    await updateDoc(doc(db, "centers", centerId, "students", studentId), strip(patch as any));
  }

  // ── Lessons ───────────────────────────────────────────────────────────────
  async listLessons(centerId: string, groupId: string) {
    const s = await getDocs(
      query(collection(db, "centers", centerId, "lessons"), where("groupId", "==", groupId))
    );
    return s.docs.map((d: any) => fromSnap<Lesson>(d));
  }
  async createLesson(input: Omit<Lesson, "id">) {
    const data = strip(input as any);
    const ref = await addDoc(collection(db, "centers", input.centerId, "lessons"), data);
    return { id: ref.id, ...data } as Lesson;
  }
  async updateLesson(centerId: string, lessonId: string, patch: Partial<Omit<Lesson, "id" | "centerId">>) {
    const ref = doc(db, "centers", centerId, "lessons", lessonId);
    await updateDoc(ref, strip(patch as any));
    const s = await getDoc(ref);
    return fromSnap<Lesson>(s);
  }

  // ── Tests ─────────────────────────────────────────────────────────────────
  async listTests(centerId: string) {
    const s = await getDocs(collection(db, "centers", centerId, "tests"));
    return s.docs.map((d: any) => fromSnap<Test>(d));
  }
  async createTest(input: Omit<Test, "id">) {
    const data = strip(input as any);
    const ref = await addDoc(collection(db, "centers", input.centerId, "tests"), data);
    return { id: ref.id, ...data } as Test;
  }
  async updateTest(centerId: string, testId: string, patch: Partial<Omit<Test, "id" | "centerId">>) {
    await updateDoc(doc(db, "centers", centerId, "tests", testId), strip(patch as any));
  }
  async deleteTest(centerId: string, testId: string) {
    await deleteDoc(doc(db, "centers", centerId, "tests", testId));
  }

  // ── Test submissions ─────────────────────────────────────────────────────
  async listTestSubmissions(centerId: string, testId: string) {
    const s = await getDocs(
      query(collection(db, "centers", centerId, "testSubmissions"), where("testId", "==", testId))
    );
    return s.docs.map((d: any) => fromSnap<TestSubmission>(d));
  }
  async createTestSubmission(input: Omit<TestSubmission, "id">) {
    const data = strip(input as any);
    const ref = await addDoc(collection(db, "centers", input.centerId, "testSubmissions"), data);
    return { id: ref.id, ...data } as TestSubmission;
  }

  // ── Payments ──────────────────────────────────────────────────────────────
  async listPayments(centerId: string) {
    const s = await getDocs(collection(db, "centers", centerId, "payments"));
    return s.docs.map((d: any) => fromSnap<Payment>(d));
  }
  async createPayment(input: Omit<Payment, "id">) {
    const data = strip(input as any);
    const ref = await addDoc(collection(db, "centers", input.centerId, "payments"), data);
    return { id: ref.id, ...data } as Payment;
  }
  async updatePayment(centerId: string, paymentId: string, patch: Partial<Omit<Payment, "id" | "centerId">>) {
    await updateDoc(doc(db, "centers", centerId, "payments", paymentId), strip(patch as any));
  }
  async deletePayment(centerId: string, paymentId: string) {
    await deleteDoc(doc(db, "centers", centerId, "payments", paymentId));
  }

  // ── Platform admin ────────────────────────────────────────────────────────
  async adminListAllCenters() {
    const s = await getDocs(collection(db, "centers"));
    return s.docs.map((d: any) => fromSnap<Center>(d));
  }
  async adminListAllUsers() {
    const s = await getDocs(collection(db, "userProfiles"));
    return s.docs.map((d: any) => fromSnap<User>(d));
  }
  async adminListUsersOfCenter(centerId: string) {
    const s = await getDocs(query(collection(db, "userProfiles"), where("centerId", "==", centerId)));
    return s.docs.map((d: any) => fromSnap<User>(d));
  }
  async adminUpdateCenter(centerId: string, patch: Partial<Omit<Center, "id">>) {
    await updateDoc(doc(db, "centers", centerId), strip(patch as any));
    return (await this.getCenter(centerId))!;
  }

  // ── Moderators ────────────────────────────────────────────────────────────
  async adminListModerators(): Promise<Moderator[]> {
    const s = await getDocs(query(collection(db, "userProfiles"), where("ismod", "==", true)));
    return s.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name ?? data.displayName ?? data.email ?? d.id,
        email: data.email ?? "",
        avatarColor: data.avatarColor ?? "#3b6bff",
        permissions: data.permissions ?? [],
        twoFactor: data.twoFactor ?? false,
        blocked: data.blocked ?? false,
        lastActive: data.lastActive ?? data.createdAt ?? new Date().toISOString(),
        createdAt: data.createdAt ?? new Date().toISOString(),
      } as Moderator;
    });
  }
  async adminUpdateModerator(id: string, patch: Partial<Omit<Moderator, "id">>): Promise<void> {
    const s = await getDocs(query(collection(db, "userProfiles"), where("id", "==", id), limit(1)));
    const docId = !s.empty ? s.docs[0].id : id;
    await updateDoc(doc(db, "userProfiles", docId), strip(patch as any));
  }
  async adminDeleteModerator(id: string): Promise<void> {
    const s = await getDocs(query(collection(db, "userProfiles"), where("id", "==", id), limit(1)));
    const docId = !s.empty ? s.docs[0].id : id;
    await updateDoc(doc(db, "userProfiles", docId), { ismod: false });
  }

  // ── Audit logs ──────────────────────────────────────��─────────────────────
  async adminListLogs(limitCount = 200): Promise<LogEntry[]> {
    const s = await getDocs(
      query(collection(db, "auditLogs"), orderBy("at", "desc"), limit(limitCount))
    );
    return s.docs.map((d: any) => fromSnap<LogEntry>(d));
  }
  async adminAddLog(entry: Omit<LogEntry, "id">): Promise<LogEntry> {
    const ref = await addDoc(collection(db, "auditLogs"), entry);
    return { id: ref.id, ...entry };
  }

  // ── Support tickets ───────────────────────────────────────────────────────
  async adminListTickets(): Promise<Ticket[]> {
    const s = await getDocs(
      query(collection(db, "supportTickets"), orderBy("createdAt", "desc"))
    );
    return s.docs.map((d: any) => fromSnap<Ticket>(d));
  }
  async adminUpdateTicket(id: string, patch: Partial<Omit<Ticket, "id">>): Promise<void> {
    await updateDoc(doc(db, "supportTickets", id), { ...strip(patch as any), updatedAt: new Date().toISOString() });
  }

  // ── Platform payments ─────────────────────────────────────────────────────
  async adminListPlatformPayments(): Promise<PlatformPayment[]> {
    const s = await getDocs(
      query(collection(db, "platformPayments"), orderBy("createdAt", "desc"))
    );
    return s.docs.map((d: any) => fromSnap<PlatformPayment>(d));
  }

  // ── Feature flags ─────────────────────────────────────────────────────────
  async adminListFeatureFlags(): Promise<FeatureFlag[]> {
    const s = await getDocs(collection(db, "featureFlags"));
    return s.docs.map((d: any) => ({ key: d.id, ...d.data() }) as FeatureFlag);
  }
  async adminUpdateFeatureFlag(key: string, patch: Partial<Omit<FeatureFlag, "key">>): Promise<void> {
    await setDoc(doc(db, "featureFlags", key), strip(patch as any), { merge: true });
  }

  // ── Release versions ──────────────────────────────────────────────────────
  async adminListVersions(): Promise<ReleaseVersion[]> {
    const s = await getDocs(
      query(collection(db, "platformVersions"), orderBy("date", "desc"))
    );
    return s.docs.map((d: any) => ({ ...d.data() }) as ReleaseVersion);
  }

  // ── Platform settings ─────────────────────────────────────────────────────
  async adminGetPlatformSettings(): Promise<PlatformSettings | null> {
    const s = await getDoc(doc(db, "platformConfig", "settings"));
    return s.exists() ? (s.data() as PlatformSettings) : null;
  }
  async adminUpdatePlatformSettings(patch: Partial<PlatformSettings>): Promise<void> {
    await setDoc(doc(db, "platformConfig", "settings"), strip(patch as any), { merge: true });
  }

  // ── Maintenance mode ──────────────────────────────────────────────────────
  async adminGetMaintenance(): Promise<MaintenanceState | null> {
    const s = await getDoc(doc(db, "platformConfig", "maintenance"));
    return s.exists() ? (s.data() as MaintenanceState) : null;
  }
  async adminSetMaintenance(state: MaintenanceState): Promise<void> {
    await setDoc(doc(db, "platformConfig", "maintenance"), state);
  }

  // ── Subscription plans ────────────────────────────────────────────────────
  async adminListPlans(): Promise<Plan[]> {
    const snap = await getDocs(collection(db, "platformPlans"));
    return snap.docs.map((d) => fromSnap<Plan>(d));
  }
  async adminUpdatePlan(tier: string, patch: Partial<Omit<Plan, "tier">>): Promise<void> {
    await setDoc(doc(db, "platformPlans", tier), strip(patch as any), { merge: true });
  }

  // ── Marketing ─────────────────────────────────────────────────────────────
  async adminListNews(): Promise<NewsPost[]> {
    const snap = await getDocs(query(collection(db, "platformNews"), orderBy("date", "desc")));
    return snap.docs.map((d) => fromSnap<NewsPost>(d));
  }
  async adminListCampaigns(): Promise<Campaign[]> {
    const snap = await getDocs(query(collection(db, "platformCampaigns"), orderBy("scheduledAt", "desc")));
    return snap.docs.map((d) => fromSnap<Campaign>(d));
  }
  async adminListCoupons(): Promise<Coupon[]> {
    const snap = await getDocs(collection(db, "platformCoupons"));
    return snap.docs.map((d) => fromSnap<Coupon>(d));
  }
}

export const firestoreRepository: Repository = new FirestoreRepository();
