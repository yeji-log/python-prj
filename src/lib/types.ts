export type Difficulty = "상" | "중" | "하";

export const DIFFICULTIES: Difficulty[] = ["상", "중", "하"];

export interface Question {
  id: string;
  /** 화면에 보여줄 질문(설명) */
  prompt: string;
  /** 문제에 딸린 코드 스니펫 (없을 수도 있음) */
  code?: string;
  /** 보기 목록 */
  options: string[];
  /** 정답 보기의 인덱스 */
  answerIndex: number;
}

export type QuestionBank = Record<Difficulty, Question[]>;

export interface ConceptTemplate {
  id: string;
  title: string;
  /** 이 개념을 자료에서 찾아낼 때 사용하는 키워드(소문자 비교) */
  keywords: string[];
  /** 자료에서 설명을 못 찾았을 때 사용할 기본 설명 */
  defaultExplanation: string;
  questionBank: QuestionBank;
}

/** 이 개념이 어떻게 만들어졌는지 (교사 화면에 배지로 표시) */
export type ConceptSource = "template" | "material" | "custom";

export interface Concept {
  id: string;
  title: string;
  explanation: string;
  /** 설명이 붙여넣은 자료에서 왔는지, 기본 설명인지 */
  explanationSource: "material" | "default";
  questionBank: QuestionBank;
  source?: ConceptSource;
  createdAt?: number;
  updatedAt?: number;
}

export type ExtractResult =
  | { ok: true; concepts: Concept[] }
  | { ok: false; reason: "empty" | "no-match" };

export type Role = "teacher" | "student";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
  createdAt?: number;
  lastLoginAt?: number;
}

export interface TestResultRecord {
  id: string;
  studentUid: string;
  studentEmail: string;
  studentName: string | null;
  conceptId: string;
  conceptTitle: string;
  difficulty: Difficulty;
  score: number;
  total: number;
  answeredAt: number;
}
