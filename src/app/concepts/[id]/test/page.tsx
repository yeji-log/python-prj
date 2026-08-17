"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConcepts } from "@/lib/ConceptsProvider";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CodeBlock } from "@/components/CodeBlock";
import { buildShuffledQuiz, ShuffledQuestion } from "@/lib/quizUtils";
import { DIFFICULTIES, Difficulty } from "@/lib/types";

type Phase = "test" | "result" | "review";

function isDifficulty(value: string | null): value is Difficulty {
  return !!value && (DIFFICULTIES as string[]).includes(value);
}

function progressKey(conceptId: string, level: Difficulty) {
  return `pyquiz:testprogress:${conceptId}:${level}`;
}

export default function TestPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrated, getConcept } = useConcepts();
  const concept = getConcept(params.id);
  const levelParam = searchParams.get("level");
  const level = isDifficulty(levelParam) ? levelParam : null;

  const [phase, setPhase] = useState<Phase>("test");
  const [quiz, setQuiz] = useState<ShuffledQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [resumedNotice, setResumedNotice] = useState<string | null>(null);

  const startFreshQuiz = useCallback(
    (showResumeCheck: boolean) => {
      if (!concept || !level) return;
      const fresh = buildShuffledQuiz(concept.questionBank[level]);
      setQuiz(fresh);
      setAnswers(new Array(fresh.length).fill(null));
      setCurrentIndex(0);
      setSelected(null);
      setPhase("test");
      setResumedNotice(null);

      const key = progressKey(concept.id, level);
      if (showResumeCheck) {
        try {
          const raw = window.sessionStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw) as { answered: number };
            if (parsed && parsed.answered > 0) {
              setResumedNotice(
                "이전에 진행 중이던 답안·점수가 사라졌어요. 새 문제로 테스트를 다시 시작합니다."
              );
            }
          }
        } catch {
          // 손상된 값은 무시
        }
      }
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // 무시
      }
    },
    [concept, level]
  );

  // 최초 마운트(= 진입/새로고침/뒤로가기로 다시 들어옴) 시 항상 새 문제로 시작
  useEffect(() => {
    if (!hydrated || !concept || !level) return;
    startFreshQuiz(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, concept?.id, level]);

  useEffect(() => {
    if (!hydrated) return;
    if (!concept) {
      router.replace("/concepts");
      return;
    }
    if (!level) {
      router.replace(`/concepts/${concept.id}/difficulty`);
    }
  }, [hydrated, concept, level, router]);

  const score = useMemo(
    () =>
      quiz.reduce(
        (acc, q, i) => (answers[i] === q.displayAnswerIndex ? acc + 1 : acc),
        0
      ),
    [quiz, answers]
  );
  const wrongIndices = useMemo(
    () => quiz.map((_, i) => i).filter((i) => answers[i] !== quiz[i].displayAnswerIndex),
    [quiz, answers]
  );

  if (!hydrated || !concept || !level) {
    return <p className="text-sm text-slate-400">불러오는 중...</p>;
  }

  // 실패 케이스 3 방어: 유효한 문제가 하나도 없는 채로 테스트에 진입한 경우
  if (quiz.length === 0) {
    return (
      <div>
        <ScreenHeader title={`'${concept.title}' 테스트`} />
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          이 난이도는 테스트를 진행할 수 없어요. 다른 난이도나 다른 개념을 선택해주세요.
        </p>
        <button
          onClick={() => router.push(`/concepts/${concept.id}/difficulty`)}
          className="mt-4 w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700"
        >
          난이도 다시 선택
        </button>
      </div>
    );
  }

  const handleSubmitCurrent = () => {
    if (selected === null) return;
    const nextAnswers = [...answers];
    nextAnswers[currentIndex] = selected;
    setAnswers(nextAnswers);

    const answeredCount = nextAnswers.filter((a) => a !== null).length;
    const key = progressKey(concept.id, level);

    if (currentIndex === quiz.length - 1) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // 무시
      }
      setPhase("result");
    } else {
      try {
        window.sessionStorage.setItem(
          key,
          JSON.stringify({ answered: answeredCount, ts: 0 })
        );
      } catch {
        // 무시
      }
      setCurrentIndex(currentIndex + 1);
      setSelected(null);
    }
  };

  if (phase === "test") {
    const q = quiz[currentIndex];
    return (
      <div>
        <ScreenHeader
          title={`${concept.title} 문제 ${currentIndex + 1}/${quiz.length}`}
          subtitle={`난이도: ${level}`}
          backHref={`/concepts/${concept.id}/difficulty`}
          backLabel="난이도 다시 선택"
        />

        {resumedNotice && (
          <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {resumedNotice}
          </p>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <p className="font-medium text-slate-800 mb-3">Q. {q.prompt}</p>
          {q.code && (
            <div className="mb-4">
              <CodeBlock code={q.code} />
            </div>
          )}

          <div className="space-y-2">
            {q.displayOptions.map((option, idx) => (
              <label
                key={idx}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                  selected === idx
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="option"
                  className="h-4 w-4 accent-blue-600"
                  checked={selected === idx}
                  onChange={() => setSelected(idx)}
                />
                <span className="text-slate-800 text-sm">{option}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleSubmitCurrent}
            disabled={selected === null}
            className="mt-5 w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {currentIndex === quiz.length - 1 ? "제출" : "다음"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div>
        <ScreenHeader title={`'${concept.title}' 결과`} />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <p className="text-3xl font-bold text-slate-900">
            정답 {score} / {quiz.length}
          </p>
          <p className="text-sm text-slate-500 mt-1">난이도: {level}</p>

          {wrongIndices.length > 0 && (
            <button
              onClick={() => setPhase("review")}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              틀린 문제 다시보기 ▸
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => startFreshQuiz(false)}
            className="rounded-lg border border-slate-300 text-slate-700 font-medium py-3 hover:bg-slate-50 transition-colors"
          >
            다시 풀기
          </button>
          <button
            onClick={() => router.push("/concepts")}
            className="rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 transition-colors"
          >
            개념 목록
          </button>
        </div>
      </div>
    );
  }

  // phase === 'review'
  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setPhase("result")}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block"
        >
          ◂ 결과
        </button>
        <h1 className="text-2xl font-bold text-slate-900">틀린 문제 다시보기</h1>
      </div>

      <div className="space-y-3">
        {wrongIndices.map((i) => {
          const q = quiz[i];
          const myAnswer = answers[i];
          return (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
            >
              <p className="font-medium text-slate-800 mb-2">
                Q{i + 1}. {q.prompt}
              </p>
              {q.code && (
                <div className="mb-2">
                  <CodeBlock code={q.code} />
                </div>
              )}
              <p className="text-sm">
                <span className="text-red-600">
                  내 답: {myAnswer !== null ? q.displayOptions[myAnswer] : "(응답 없음)"}
                </span>
                <span className="text-slate-400 mx-2">/</span>
                <span className="text-green-700">
                  정답: {q.displayOptions[q.displayAnswerIndex]}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => setPhase("result")}
          className="rounded-lg border border-slate-300 text-slate-700 font-medium py-3 hover:bg-slate-50 transition-colors"
        >
          결과로
        </button>
        <button
          onClick={() => startFreshQuiz(false)}
          className="rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 transition-colors"
        >
          다시 풀기
        </button>
      </div>
    </div>
  );
}
