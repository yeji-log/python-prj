import { Role } from "./types";

const TEACHER_EMAILS = (process.env.NEXT_PUBLIC_TEACHER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isTeacherEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return TEACHER_EMAILS.includes(email.toLowerCase());
}

export function roleForEmail(email: string | null | undefined): Role {
  return isTeacherEmail(email) ? "teacher" : "student";
}
