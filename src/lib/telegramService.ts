import { firestoreRepository as repo } from "../data/firestoreRepository";

export interface AttendanceNotificationPayload {
  centerId: string;
  studentId: string;
  studentName: string;
  status: "present" | "late" | "absent" | boolean | string;
  points?: number | string;
  maxPoints?: number | string;
  topic?: string;
  date?: string;
}

/**
 * Send parent notification via Telegram Bot API when student attendance or grade is saved.
 */
export async function sendParentAttendanceNotification(payload: AttendanceNotificationPayload): Promise<boolean> {
  try {
    // 1. Find student record to get parentId or direct student telegramChatId
    const student = await repo.getStudent(payload.centerId, payload.studentId);
    let chatId: string | undefined;

    // Check if student has direct telegramChatId
    if (student && (student as any).telegramChatId) {
      chatId = (student as any).telegramChatId;
    }

    // If student has a linked parent, check parent's profile for telegramChatId
    if (!chatId && student?.parentId) {
      const parentUser = await repo.getUser(student.parentId);
      if (parentUser && (parentUser as any).telegramChatId) {
        chatId = (parentUser as any).telegramChatId;
      }
    }

    // Fallback: check student profile in userProfiles
    if (!chatId) {
      const studentUser = await repo.getUser(payload.studentId);
      if (studentUser && (studentUser as any).telegramChatId) {
        chatId = (studentUser as any).telegramChatId;
      }
    }

    if (!chatId) {
      // No telegramChatId found for parent or student
      return false;
    }

    // 2. Call Vercel serverless notification endpoint
    const res = await fetch("/api/telegram-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        studentName: payload.studentName || student?.name || "Ученик",
        status: payload.status,
        points: payload.points,
        maxPoints: payload.maxPoints || 10,
        topic: payload.topic,
        date: payload.date || new Date().toISOString().slice(0, 10),
      }),
    });

    return res.ok;
  } catch (err) {
    console.error("Failed to send Telegram notification:", err);
    return false;
  }
}
