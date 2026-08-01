import { firestoreRepository as repo } from "../../data/firestoreRepository";
import { Group, Student, User, Room, Test, TestQuestion } from "../../types";
import { generateTestWithWebSearch } from "./generateTest";

const AVATAR_COLORS = ["#3b6bff","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#be185d","#65a30d"];
const pickColor = (s: string) => AVATAR_COLORS[s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

export interface CenterSnapshot {
  groups: Group[];
  students: Student[];
  teachers: User[];
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
      name: "create_student",
      description: "Create a new student in the center",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the student" },
          phone: { type: "string", description: "Student phone number (optional)" },
          parentName: { type: "string", description: "Parent/guardian full name (optional)" },
          parentPhone: { type: "string", description: "Parent/guardian phone number (optional)" },
        },
        required: ["name"] as string[],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_teacher",
      description: "Create a new teacher account. Username must be unique, lowercase.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name" },
          username: { type: "string", description: "Unique login username (lowercase, no spaces)" },
          email: { type: "string", description: "Email address (optional)" },
          phone: { type: "string", description: "Phone number (optional)" },
        },
        required: ["name", "username"] as string[],
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
];

export async function executeTool(
  name: string,
  args: Record<string, any>,
  centerId: string,
  snapshot: CenterSnapshot,
): Promise<any> {
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

    case "create_student": {
      const studentData: any = {
        centerId,
        name: String(args.name),
        groupIds: [],
        avatarColor: pickColor(String(args.name)),
      };
      if (args.phone) studentData.phone = String(args.phone);
      if (args.parentName) studentData.parentName = String(args.parentName);
      if (args.parentPhone) studentData.parentPhone = String(args.parentPhone);
      return await repo.createStudent(studentData);
    }

    case "create_teacher": {
      const username = String(args.username).toLowerCase().trim();
      const existing = await repo.getUserByLogin(username);
      if (existing) {
        return { error: `Username "${username}" is already taken. Choose a different one.` };
      }
      const teacherData: any = {
        centerId,
        name: String(args.name),
        username,
        role: "teacher",
        avatarColor: pickColor(String(args.name)),
      };
      if (args.email) teacherData.email = String(args.email);
      if (args.phone) teacherData.phone = String(args.phone);
      return await repo.createUser(teacherData);
    }

    case "create_room":
      return await repo.createRoom({
        centerId,
        name: String(args.name),
      });

    case "create_course":
      return await repo.createCourse({
        centerId,
        name: String(args.name),
        color: String(args.color ?? "#3b6bff"),
        description: args.description ? String(args.description) : undefined,
      });

    case "create_group":
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

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
