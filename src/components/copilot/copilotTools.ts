import { createUserWithEmailAndPassword } from "firebase/auth";
import { secondaryAuth } from "../../lib/firebase";
import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Group, Student, User, Room, Test, TestQuestion, Role } from "../../types";
import { generateTestWithWebSearch } from "./generateTest";

const AVATAR_COLORS = ["#3b6bff","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#be185d","#65a30d"];
const pickColor = (s: string) => AVATAR_COLORS[s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

/** Домены псевдо-email по ролям — вход идёт по username, email только для Firebase Auth. */
const ROLE_EMAIL_DOMAIN: Partial<Record<Role, string>> = {
  student: "ilmoz.student",
  teacher: "ilmoz.teacher",
  parent: "ilmoz.parent",
};

/**
 * Заводит логин так же, как ручные формы: аккаунт в Firebase Auth через
 * secondaryAuth (чтобы не разлогинить админа) + профиль в userProfiles.
 * Без этого пользователь не сможет войти — только карточка в списке.
 */
async function createAccount(input: {
  centerId: string;
  name: string;
  username: string;
  password: string;
  role: Role;
  phone?: string;
  parentId?: string;
  birthDate?: string;
}): Promise<{ uid: string; avatarColor: string } | { error: string }> {
  const username = input.username.toLowerCase().trim();
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { error: `Username "${username}" is invalid. Use lowercase letters, digits and _ only.` };
  }
  if (input.password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (await repo.getUserByLogin(username)) {
    return { error: `Username "${username}" is already taken. Choose a different one.` };
  }

  const email = `${username}@${ROLE_EMAIL_DOMAIN[input.role] ?? "ilmoz.user"}`;
  let uid: string;
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, input.password);
    uid = cred.user.uid;
  } catch (e: any) {
    return { error: e?.code === "auth/email-already-in-use"
      ? `Username "${username}" is already taken. Choose a different one.`
      : (e?.message ?? "Failed to create the account.") };
  } finally {
    await secondaryAuth.signOut().catch(() => {});
  }

  const avatarColor = pickColor(input.name + uid);
  await repo.createUser({
    id: uid,
    centerId: input.centerId,
    name: input.name,
    email,
    username,
    role: input.role,
    avatarColor,
    phoneVerified: false,
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.parentId ? { parentId: input.parentId } : {}),
    ...(input.birthDate ? { birthDate: input.birthDate } : {}),
  });

  return { uid, avatarColor };
}

export interface CenterSnapshot {
  groups: Group[];
  students: Student[];
  teachers: User[];
  parents: User[];
  rooms: Room[];
  courses: { id: string; name: string; color: string }[];
  /** UID of the signed-in user — used to attribute created records (e.g. tests). */
  currentUserId?: string;
}

export const COPILOT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "list_groups",
      description: "List all learning groups in the center with status, student count, teacher, room, schedule",
      parameters: { type: "object", properties: {}, required: [] as string[] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_students",
      description: "List all students enrolled in the center",
      parameters: { type: "object", properties: {}, required: [] as string[] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_teachers",
      description: "List all teachers in the center with their IDs",
      parameters: { type: "object", properties: {}, required: [] as string[] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_rooms",
      description: "List all classrooms/rooms available in the center with IDs",
      parameters: { type: "object", properties: {}, required: [] as string[] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_courses",
      description: "List all courses offered by the center with IDs",
      parameters: { type: "object", properties: {}, required: [] as string[] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_parents",
      description: "List all parent accounts in the center with their IDs. Call before choose_parent.",
      parameters: { type: "object", properties: {}, required: [] as string[] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_student",
      description: "Create a new student with a login account. Ask the user for name, username and password first. To attach a parent, pass parentId from list_parents or create_parent.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the student" },
          username: { type: "string", description: "Unique login username (lowercase letters, digits, _)" },
          password: { type: "string", description: "Login password, at least 6 characters" },
          phone: { type: "string", description: "Student phone number (optional)" },
          birthDate: { type: "string", description: "Birth date YYYY-MM-DD (optional)" },
          parentId: { type: "string", description: "Existing parent user ID from list_parents or create_parent (optional)" },
        },
        required: ["name", "username", "password"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_parent",
      description: "Create a new parent account with a login. Ask the user for name, username and password first. Returns the parent ID to pass into create_student or choose_parent.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the parent" },
          username: { type: "string", description: "Unique login username (lowercase letters, digits, _)" },
          password: { type: "string", description: "Login password, at least 6 characters" },
          phone: { type: "string", description: "Parent phone number (optional)" },
        },
        required: ["name", "username", "password"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "choose_parent",
      description: "Attach an existing parent to an existing student. Call list_parents and list_students first to get valid IDs.",
      parameters: {
        type: "object",
        properties: {
          studentId: { type: "string", description: "Student ID from list_students" },
          parentId: { type: "string", description: "Parent user ID from list_parents" },
        },
        required: ["studentId", "parentId"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_teacher",
      description: "Create a new teacher account with a login. Ask the user for name, username and password first.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name" },
          username: { type: "string", description: "Unique login username (lowercase letters, digits, _)" },
          password: { type: "string", description: "Login password, at least 6 characters" },
          phone: { type: "string", description: "Phone number (optional)" },
        },
        required: ["name", "username", "password"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_room",
      description: "Create a new classroom or room in the center",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Room name or number e.g. 'Room 101'" },
        },
        required: ["name"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_group",
      description: "Create a new learning group. Call list_courses, list_teachers, list_rooms first to get valid IDs.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Group name e.g. 'English A1 Morning'" },
          courseId: { type: "string", description: "Course ID from list_courses" },
          teacherId: { type: "string", description: "Teacher user ID from list_teachers" },
          roomId: { type: "string", description: "Room ID from list_rooms" },
          days: {
            type: "array",
            items: { type: "string", enum: ["mon","tue","wed","thu","fri","sat","sun"] },
            description: "Class days of the week",
          },
          startTime: { type: "string", description: "Start time in HH:MM format e.g. '09:00'" },
          endTime: { type: "string", description: "End time in HH:MM format e.g. '10:30'" },
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
          maxStudents: { type: "number", description: "Maximum number of students" },
          price: { type: "number", description: "Monthly tuition price (default 0)" },
        },
        required: ["name","courseId","teacherId","roomId","days","startTime","endTime","startDate","maxStudents"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generate_test",
      description: "Generate a quiz/test on a topic using real-time web search for up-to-date facts. Creates a draft test the teacher can review and later activate for a group. Ask the user for the topic and how many questions before calling.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short title for the test, e.g. 'Present Perfect Tense'" },
          topic: { type: "string", description: "The subject/topic to generate questions about" },
          questionCount: { type: "number", description: "Total number of questions (default 5)" },
          mcqCount: { type: "number", description: "How many of them should be multiple-choice (rest will be short-answer). Default: all." },
        },
        required: ["title", "topic"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_course",
      description: "Create a new course in the center",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Course name e.g. 'English Upper-Intermediate'" },
          color: { type: "string", description: "Optional course color code e.g. '#3b6bff' or '#10b981'" },
          description: { type: "string", description: "Optional description of the course content" }
        },
        required: ["name"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "mark_attendance",
      description: "Mark or update student attendance for a group lesson (present/пришел/келди, absent/не пришел/келмади, or late/опоздал/кечикди).",
      parameters: {
        type: "object",
        properties: {
          groupId: { type: "string", description: "Group ID from list_groups or group name" },
          date: { type: "string", description: "Lesson date in YYYY-MM-DD format (defaults to today)" },
          topic: { type: "string", description: "Optional lesson topic" },
          homework: { type: "string", description: "Optional homework description" },
          records: {
            type: "array",
            description: "List of attendance marks for students in this group",
            items: {
              type: "object",
              properties: {
                studentId: { type: "string", description: "Student ID or student name" },
                status: {
                  type: "string",
                  enum: ["present", "absent", "late"],
                  description: "Attendance status: 'present' (пришел), 'absent' (не пришел), or 'late' (опоздал)",
                },
              },
              required: ["studentId", "status"],
            },
          },
        },
        required: ["groupId", "records"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_lessons",
      description: "List past or recorded lessons and attendance records for a group",
      parameters: {
        type: "object",
        properties: {
          groupId: { type: "string", description: "Group ID from list_groups" },
        },
        required: ["groupId"] as string[],
      },
    },
  },
];

export async function executeTool(
  name: string,
  args: Record<string, any>,
  centerId: string,
  snapshot: CenterSnapshot,
): Promise<any> {
  const currentUserId = snapshot.currentUserId;
  const isStaff = () => {
    // But we don't have the user role directly in the snapshot if they are owner/director. 
    // Wait, teachers array includes all staff users in useCenterData.ts. Let's check it.
    const currentUser = snapshot.teachers.find(t => t.id === currentUserId);
    return currentUser && ["owner", "director", "administrator", "teacher"].includes(currentUser.role);
  };
  const requireStaff = () => {
    if (!isStaff()) throw new Error("Permission denied: You must be a staff member to perform this action.");
  };

  switch (name) {
    case "list_groups":
      return snapshot.groups.map(g => ({
        id: g.id,
        name: g.name,
        status: g.status,
        studentCount: g.studentIds.length,
        teacherId: g.teacherId,
        roomId: g.roomId,
        courseId: g.courseId,
        days: g.days,
        startTime: g.startTime,
        endTime: g.endTime,
      }));

    case "list_students":
      return snapshot.students.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone ?? null,
        groupIds: s.groupIds,
      }));

    case "list_teachers":
      return snapshot.teachers.map(t => ({
        id: t.id,
        name: t.name,
        username: t.username,
        email: t.email ?? null,
        phone: t.phone ?? null,
      }));

    case "list_rooms":
      return snapshot.rooms.map(r => ({
        id: r.id,
        name: r.name,
      }));

    case "list_courses":
      return snapshot.courses.map(c => ({
        id: c.id,
        name: c.name,
      }));

    case "list_parents":
      return snapshot.parents.map(p => ({
        id: p.id,
        name: p.name,
        username: p.username,
        phone: p.phone ?? null,
      }));

    case "create_student": {
      try { requireStaff(); } catch (e: any) { return { error: e.message }; }
      const account = await createAccount({
        centerId,
        name: String(args.name),
        username: String(args.username ?? ""),
        password: String(args.password ?? ""),
        role: "student",
        phone: args.phone ? String(args.phone) : undefined,
        parentId: args.parentId ? String(args.parentId) : undefined,
        birthDate: args.birthDate ? String(args.birthDate) : undefined,
      });
      if ("error" in account) return account;

      // Запись студента использует тот же UID, что и профиль — так их связывают журнал и оплаты.
      return await repo.createStudent({
        id: account.uid,
        centerId,
        name: String(args.name),
        groupIds: [],
        avatarColor: account.avatarColor,
        ...(args.phone ? { phone: String(args.phone) } : {}),
        ...(args.parentId ? { parentId: String(args.parentId) } : {}),
        ...(args.birthDate ? { birthDate: String(args.birthDate) } : {}),
      });
    }

    case "create_parent": {
      try { requireStaff(); } catch (e: any) { return { error: e.message }; }
      const account = await createAccount({
        centerId,
        name: String(args.name),
        username: String(args.username ?? ""),
        password: String(args.password ?? ""),
        role: "parent",
        phone: args.phone ? String(args.phone) : undefined,
      });
      if ("error" in account) return account;
      return { id: account.uid, name: String(args.name), role: "parent" };
    }

    case "choose_parent": {
      try { requireStaff(); } catch (e: any) { return { error: e.message }; }
      const studentId = String(args.studentId);
      const parentId = String(args.parentId);
      const student = snapshot.students.find(s => s.id === studentId);
      if (!student) return { error: `Student "${studentId}" not found. Call list_students first.` };
      const parent = snapshot.parents.find(p => p.id === parentId);
      if (!parent) return { error: `Parent "${parentId}" not found. Call list_parents first.` };

      // Раздел «Мои дети» у родителя строится по student.parentId (см. useCenterData).
      await repo.updateStudent(centerId, studentId, { parentId });
      return { studentId, studentName: student.name, parentId, parentName: parent.name };
    }

    case "create_teacher": {
      try { requireStaff(); } catch (e: any) { return { error: e.message }; }
      const account = await createAccount({
        centerId,
        name: String(args.name),
        username: String(args.username ?? ""),
        password: String(args.password ?? ""),
        role: "teacher",
        phone: args.phone ? String(args.phone) : undefined,
      });
      if ("error" in account) return account;
      return { id: account.uid, name: String(args.name), role: "teacher" };
    }

    case "create_room":
      try { requireStaff(); } catch (e: any) { return { error: e.message }; }
      return await repo.createRoom({
        centerId,
        name: String(args.name),
      });

    case "create_course":
      try { requireStaff(); } catch (e: any) { return { error: e.message }; }
      return await repo.createCourse({
        centerId,
        name: String(args.name),
        color: String(args.color ?? "#3b6bff"),
        description: args.description ? String(args.description) : undefined,
      });

    case "create_group":
      try { requireStaff(); } catch (e: any) { return { error: e.message }; }
      return await repo.createGroup({
        centerId,
        name: String(args.name),
        courseId: String(args.courseId),
        teacherId: String(args.teacherId),
        roomId: String(args.roomId),
        days: args.days as any[],
        startTime: String(args.startTime),
        endTime: String(args.endTime),
        startDate: String(args.startDate),
        maxStudents: Number(args.maxStudents),
        price: Number(args.price) || 0,
        studentIds: [],
        status: "active",
      });

    case "generate_test": {
      const questionCount = Math.min(20, Math.max(1, Number(args.questionCount) || 5));
      const mcqCount = args.mcqCount === undefined
        ? questionCount
        : Math.min(questionCount, Math.max(0, Number(args.mcqCount)));
      try {
        const { questions, sources } = await generateTestWithWebSearch(
          String(args.topic), questionCount, mcqCount,
        );
        if (questions.length === 0) {
          return { error: "AI could not generate any questions. Try rephrasing the topic." };
        }
        const test: Omit<Test, "id"> = {
          centerId,
          title: String(args.title || args.topic),
          topic: String(args.topic),
          createdBy: snapshot.currentUserId ?? "",
          questions,
          status: "draft",
          createdAt: new Date().toISOString(),
          ...(sources.length ? { sources } : {}),
        };
        const saved = await repo.createTest(test);
        return {
          id: saved.id,
          title: saved.title,
          questionCount: questions.length,
          mcqCount: questions.filter((q: TestQuestion) => q.type === "mcq").length,
          shortCount: questions.filter((q: TestQuestion) => q.type === "short").length,
          sourcesUsed: sources.length,
          message: `Draft test "${saved.title}" created with ${questions.length} questions. It's saved as a draft — open the Tests page to review and activate it for a group.`,
        };
      } catch (e: any) {
        return { error: e?.message ?? "Failed to generate test" };
      }
    }

    case "list_lessons": {
      const groupId = String(args.groupId);
      const group = snapshot.groups.find(g => g.id === groupId || g.name.toLowerCase().includes(groupId.toLowerCase()));
      const targetGroupId = group ? group.id : groupId;
      const lessons = await repo.listLessons(centerId, targetGroupId);
      return lessons.map(l => ({
        id: l.id,
        date: l.date,
        topic: l.topic ?? null,
        homework: l.homework ?? null,
        attendance: l.attendance,
      }));
    }

    case "mark_attendance": {
      try { requireStaff(); } catch (e: any) { return { error: e.message }; }
      const groupIdArg = String(args.groupId ?? "");
      const group = snapshot.groups.find(g => g.id === groupIdArg || g.name.toLowerCase().includes(groupIdArg.toLowerCase()));
      if (!group) return { error: `Group "${groupIdArg}" not found. Call list_groups first.` };

      const targetGroupId = group.id;
      const todayStr = new Date().toISOString().slice(0, 10);
      const dateStr = args.date ? String(args.date) : todayStr;

      const existingLessons = await repo.listLessons(centerId, targetGroupId);
      let lesson = existingLessons.find(l => l.date === dateStr);

      const attendanceMap: Record<string, boolean | "late"> = { ...(lesson?.attendance ?? {}) };
      const records = Array.isArray(args.records) ? args.records : [];
      const updatedDetails: Array<{ studentId: string; studentName: string; status: string }> = [];

      for (const r of records) {
        const rawId = String(r.studentId ?? r.studentName ?? "");
        const student = snapshot.students.find(s =>
          s.id === rawId || s.name.toLowerCase().includes(rawId.toLowerCase())
        );
        if (!student) continue;

        let st: boolean | "late" = true;
        if (r.status === "absent" || r.status === false || r.status === "false") st = false;
        else if (r.status === "late") st = "late";
        else st = true;

        attendanceMap[student.id] = st;
        updatedDetails.push({
          studentId: student.id,
          studentName: student.name,
          status: st === true ? "Пришел (келди)" : st === "late" ? "Опоздал (кечикди)" : "Отсутствовал (келмади)",
        });
      }

      if (lesson) {
        lesson = await repo.updateLesson(centerId, lesson.id, {
          attendance: attendanceMap,
          ...(args.topic ? { topic: String(args.topic) } : {}),
          ...(args.homework ? { homework: String(args.homework) } : {}),
        });
      } else {
        lesson = await repo.createLesson({
          centerId,
          groupId: targetGroupId,
          date: dateStr,
          topic: args.topic ? String(args.topic) : "Dars",
          homework: args.homework ? String(args.homework) : "",
          attendance: attendanceMap,
        });
      }

      return {
        success: true,
        lessonId: lesson.id,
        groupName: group.name,
        date: dateStr,
        updatedStudentsCount: updatedDetails.length,
        records: updatedDetails,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
