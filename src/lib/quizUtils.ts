import { Question } from "./types";

/**
 * 문제 데이터가 손상되어 있어도(선택지 누락, 정답 인덱스 범위 밖 등)
 * 테스트 전체가 멈추지 않도록 걸러내는 방어 함수.
 * (PRO_PLAN 실패 케이스 5)
 */
export function sanitizeQuestions(questions: Question[] | undefined | null): Question[] {
  if (!Array.isArray(questions)) return [];
  return questions.filter((q): q is Question => {
    if (!q || typeof q !== "object") return false;
    if (typeof q.id !== "string" || !q.id) return false;
    if (typeof q.prompt !== "string" || !q.prompt.trim()) return false;
    if (!Array.isArray(q.options) || q.options.length < 2) return false;
    if (!q.options.every((o) => typeof o === "string" && o.trim() !== "")) return false;
    if (typeof q.answerIndex !== "number") return false;
    if (q.answerIndex < 0 || q.answerIndex >= q.options.length) return false;
    return true;
  });
}

/** Fisher-Yates 셔플 (원본 배열은 건드리지 않음) */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface ShuffledQuestion extends Question {
  /** 화면에 보여줄 순서로 섞인 보기 */
  displayOptions: string[];
  /** displayOptions 기준 정답 인덱스 */
  displayAnswerIndex: number;
}

/** 문제 순서와, 문제별 보기 순서를 함께 섞는다 */
export function buildShuffledQuiz(questions: Question[]): ShuffledQuestion[] {
  const ordered = shuffle(sanitizeQuestions(questions));
  return ordered.map((q) => {
    const optionOrder = shuffle(q.options.map((_, idx) => idx));
    return {
      ...q,
      displayOptions: optionOrder.map((idx) => q.options[idx]),
      displayAnswerIndex: optionOrder.indexOf(q.answerIndex),
    };
  });
}
