import * as React from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Course, Group, Room, Student, User, Payment, Test } from "../types";
import { useAuth } from "../context/AuthContext";

interface CenterData {
  loading: boolean;
  groups: Group[];
  rooms: Room[];
  courses: Course[];
  students: Student[];
  teachers: User[];
  users: User[];
  payments: Payment[];
  tests: Test[];
}

/**
 * Subscribes (realtime, via Firestore onSnapshot) to everything for the
 * current tenant, then **scopes the result to the signed-in user's role**
 * so pages never render data a role shouldn't see:
 *
 *  - owner / director / administrator → full center data
 *  - teacher  → only their own groups, the students in those groups, self
 *  - student  → only their own groups, themselves, the teachers who teach them
 *  - parent   → only their children, their children's groups + teachers
 *
 * Scoping here means every consumer (dashboards + feature pages) inherits the
 * same guarantees without repeating filter logic. Because the listeners are
 * live, any create/update/delete (e.g. adding a teacher) shows up everywhere
 * immediately — no page reload needed.
 */
export function useCenterData(): CenterData {
  const { center, user } = useAuth();
  const [state, setState] = React.useState<Omit<CenterData, "loading" | "teachers">>({
    groups: [],
    rooms: [],
    courses: [],
    students: [],
    users: [],
    payments: [],
    tests: [],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!center) return;
    setLoading(true);

    // Track which collections have delivered their first snapshot so we can
    // flip `loading` off exactly once, after all of them are in.
    const pending = new Set(["groups", "rooms", "courses", "students", "users", "payments", "tests"]);
    const markReady = (key: string) => {
      pending.delete(key);
      if (pending.size === 0) setLoading(false);
    };

    const subCol = <T,>(colName: string, key: keyof Omit<CenterData, "loading" | "teachers">) =>
      onSnapshot(
        collection(db, "centers", center.id, colName),
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
          setState((prev) => ({ ...prev, [key]: items } as typeof prev));
          markReady(key);
        },
        // On permission errors etc. keep the app usable — just leave the list empty.
        () => markReady(key)
      );

    const unsubs = [
      subCol<Group>("groups", "groups"),
      subCol<Room>("rooms", "rooms"),
      subCol<Course>("courses", "courses"),
      subCol<Student>("students", "students"),
      subCol<Payment>("payments", "payments"),
      subCol<Test>("tests", "tests"),
      // userProfiles is a top-level collection scoped by centerId field
      onSnapshot(
        query(collection(db, "userProfiles"), where("centerId", "==", center.id)),
        (snap) => {
          const users = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as User[];
          setState((prev) => ({ ...prev, users }));
          markReady("users");
        },
        () => markReady("users")
      ),
    ];

    return () => unsubs.forEach((u) => u());
  }, [center]);

  // ── Role scoping ──────────────────────────────────────────────────────────
  const scoped = React.useMemo<Omit<CenterData, "loading">>(() => {
    const full = { ...state, teachers: state.users.filter((u) => u.role === "teacher") };
    if (!user) return full;

    const isStaff =
      user.role === "owner" || user.role === "director" || user.role === "administrator";
    if (isStaff) return full; // full center visibility

    if (user.role === "teacher") {
      const myGroups = full.groups.filter((g) => g.teacherId === user.id);
      const myGroupIds = new Set(myGroups.map((g) => g.id));
      const studentIds = new Set(myGroups.flatMap((g) => g.studentIds));
      const myStudents = full.students.filter((s) => studentIds.has(s.id));
      const studentUserIds = new Set(myStudents.map((s) => s.id));
      return {
        ...full,
        groups: myGroups,
        students: myStudents,
        teachers: full.teachers.filter((t) => t.id === user.id),
        payments: full.payments.filter((p) => studentUserIds.has(p.studentId)),
        tests: full.tests.filter((t) => t.createdBy === user.id || (t.groupId ? myGroupIds.has(t.groupId) : false)),
      };
    }

    if (user.role === "student") {
      const myGroups = full.groups.filter((g) => g.studentIds.includes(user.id));
      const myGroupIds = new Set(myGroups.map((g) => g.id));
      const teacherIds = new Set(myGroups.map((g) => g.teacherId));
      return {
        ...full,
        groups: myGroups,
        students: full.students.filter((s) => s.id === user.id),
        teachers: full.teachers.filter((t) => teacherIds.has(t.id)),
        payments: full.payments.filter((p) => p.studentId === user.id),
        // Students only ever see tests that are activated for one of their groups.
        tests: full.tests.filter((t) => t.status === "active" && t.groupId && myGroupIds.has(t.groupId)),
      };
    }

    if (user.role === "parent") {
      // Primary: students with parentId pointing to this user
      // Fallback: find via userProfiles list (for older records where student.parentId may be missing)
      const myChildren = full.students.filter((s) => s.parentId === user.id);
      const childIdsFromUsers = new Set(
        full.users.filter((u) => u.parentId === user.id).map((u) => u.id)
      );
      const allChildren = myChildren.length > 0
        ? myChildren
        : full.students.filter((s) => childIdsFromUsers.has(s.id));
      const childIds = new Set(allChildren.map((s) => s.id));
      const childGroupIds = new Set(allChildren.flatMap((s) => s.groupIds));
      const childGroups = full.groups.filter((g) => childGroupIds.has(g.id));
      const teacherIds = new Set(childGroups.map((g) => g.teacherId));
      return {
        ...full,
        groups: childGroups,
        students: allChildren,
        teachers: full.teachers.filter((t) => teacherIds.has(t.id)),
        payments: full.payments.filter((p) => childIds.has(p.studentId)),
        tests: [],
      };
    }

    return full;
  }, [state, user]);

  return { loading, ...scoped };
}
