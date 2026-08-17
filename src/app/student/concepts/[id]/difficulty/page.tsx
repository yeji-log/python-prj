"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreConcepts } from "@/lib/firestoreConcepts";
import { ScreenHeader } from "@/components/ScreenHeader";
import { sanitizeQuestions } from "@/lib/quizUtils";
import { DIFFICULTIES, Difficulty } from "@/lib/types";

export default function DifficultySelectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { concepts, loading } = useFirestoreConcepts();
  const concept = concepts.find((c) => c.id === params.id);
  const [selected, setSelected] = useState<Difficulty | null>(null);

  useEffect(() => {
    if (!loading && !concept) {
      router.replace("/student");
    }
  }, [loading, concept, router]);

  if (loading || !concept) {
    return <p className="text-sm text-slate-400">불러오는 중...</p>;
  }

  const availableCount = selected
    ? sanitizeQuestions(concept.questionBank[selected]).length
    : null;
  const noQuestions = selected !== null && availableCount === 0;

  return (
    <div>
      <ScreenHeader
        title={`'${concept.title}' 테스트 난이도`}
        backHref={`/student/concepts/${concept.id}`}
        backLabel="개념 학습으로"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="grid grid-cols-3 gap-3">
          {DIFFICULTIES.map((level) => {
            const count = sanitizeQuestions(concept.questionBank[level]).length;
            const disabled = count === 0;
            return (
              <button
                key={level}
                onClick={() => setSelected(level)}
                disabled={disabled}
                className={`rounded-lg border py-4 font-semibold transition-colors ${
                  selected === level
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {level}
                <span className="block text-xs font-normal text-slate-400 mt-1">
                  문제 {count}개
                </span>
              </button>
            );
          })}
        </div>

        {noQuestions && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            이 난이도는 아직 테스트를 진행할 수 없어요. 다른 난이도를 선택하거나
            <button
              onClick={() => router.push("/student")}
              className="underline ml-1"
            >
              다른 개념
            </button>
            을 선택해주세요.
          </p>
        )}
      </div>

      <button
        onClick={() =>
          selected && router.push(`/student/concepts/${concept.id}/test?level=${encodeURIComponent(selected)}`)
        }
        disabled={!selected || noQuestions}
        className="mt-4 w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        시작하기
      </button>
    </div>
  );
}
