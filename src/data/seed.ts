import {
  Center,
  Course,
  Group,
  Room,
  Student,
  User,
} from "../types";

// A single demo tenant so the app is alive on first run.
export const DEMO_CENTER: Center = {
  id: "center_demo",
  name: "Nexo Academy",
  slug: "nexo-academy",
  currency: "USD",
  createdAt: "2026-01-05T09:00:00.000Z",
};

const c = DEMO_CENTER.id;

export const DEMO_USERS: User[] = [
  { id: "u_owner", centerId: c, name: "Aziz Karimov", email: "owner@nexo.dev", username: "aziz", role: "owner", avatarColor: "#3b6bff" },
  { id: "u_director", centerId: c, name: "Dilnoza Rasulova", email: "director@nexo.dev", username: "dilnoza", role: "director", avatarColor: "#8b5cf6" },
  { id: "u_admin", centerId: c, name: "Sardor Yusupov", email: "admin@nexo.dev", username: "sardor", role: "administrator", avatarColor: "#06b6d4" },
  { id: "u_teacher", centerId: c, name: "Malika Tolipova", email: "teacher@nexo.dev", username: "malika", role: "teacher", avatarColor: "#10b981" },
  { id: "u_teacher2", centerId: c, name: "John Peterson", email: "john@nexo.dev", username: "john", role: "teacher", avatarColor: "#f59e0b" },
  { id: "u_student", centerId: c, name: "Jasur Alimov", email: "student@nexo.dev", username: "jasur", role: "student", avatarColor: "#ef4444" },
  { id: "u_parent", centerId: c, name: "Nodira Alimova", email: "parent@nexo.dev", username: "nodira", role: "parent", avatarColor: "#ec4899" },
];

export const DEMO_ROOMS: Room[] = [
  { id: "room_101", centerId: c, name: "Room 101", capacity: 14 },
  { id: "room_203", centerId: c, name: "Room 203", capacity: 12 },
  { id: "room_lab", centerId: c, name: "Computer Lab", capacity: 20 },
];

export const DEMO_COURSES: Course[] = [
  { id: "course_ielts", centerId: c, name: "IELTS Preparation", color: "#3b6bff" },
  { id: "course_general", centerId: c, name: "General English", color: "#10b981" },
  { id: "course_kids", centerId: c, name: "Young Learners", color: "#f59e0b" },
];

export const DEMO_STUDENTS: Student[] = [
  { id: "st_1", centerId: c, name: "Jasur Alimov", phone: "+998901112233", parentId: "u_parent", groupIds: ["grp_ielts_am"], avatarColor: "#ef4444" },
  { id: "st_2", centerId: c, name: "Kamila Nazarova", phone: "+998901112244", groupIds: ["grp_ielts_am"], avatarColor: "#8b5cf6" },
  { id: "st_3", centerId: c, name: "Bekzod Toirov", phone: "+998901112255", groupIds: ["grp_ielts_pm"], avatarColor: "#06b6d4" },
  { id: "st_4", centerId: c, name: "Sevara Umarova", phone: "+998901112266", groupIds: ["grp_general"], avatarColor: "#10b981" },
];

export const DEMO_GROUPS: Group[] = [
  {
    id: "grp_ielts_am",
    centerId: c,
    name: "IELTS Morning",
    courseId: "course_ielts",
    teacherId: "u_teacher",
    roomId: "room_101",
    days: ["mon", "wed", "fri"],
    startTime: "09:00",
    endTime: "10:30",
    startDate: "2026-02-01",
    maxStudents: 14,
    studentIds: ["st_1", "st_2"],
    status: "active",
  },
  {
    id: "grp_ielts_pm",
    centerId: c,
    name: "IELTS Evening",
    courseId: "course_ielts",
    teacherId: "u_teacher",
    roomId: "room_203",
    days: ["tue", "thu"],
    startTime: "18:00",
    endTime: "19:30",
    startDate: "2026-02-01",
    maxStudents: 12,
    studentIds: ["st_3"],
    status: "active",
  },
  {
    id: "grp_general",
    centerId: c,
    name: "General English B1",
    courseId: "course_general",
    teacherId: "u_teacher2",
    roomId: "room_lab",
    days: ["mon", "wed"],
    startTime: "14:00",
    endTime: "15:30",
    startDate: "2026-02-10",
    maxStudents: 20,
    studentIds: ["st_4"],
    status: "active",
  },
];
