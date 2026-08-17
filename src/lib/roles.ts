import { Role } from "./types";

// 배포 환경변수(NEXT_PUBLIC_TEACHER_EMAILS)가 비어있어도 교사 화면 접근이
// 막히지 않도록 기본값을 둔다. firestore.rules의 isTeacher() 목록과 같이
// 맞춰둬야 한다.
const DEFAULT_TEACHER_EMAILS = "rhythm016@nyschool.co.kr,yeji.sdh@gmail.com";

const TEACHER_EMAILS = (
  process.env.NEXT_PUBLIC_TEACHER_EMAILS || DEFAULT_TEACHER_EMAILS
)
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
