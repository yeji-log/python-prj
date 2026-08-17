"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConcepts } from "@/lib/ConceptsProvider";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function HomePage() {
  const router = useRouter();
  const { generateConcepts, rawMaterial } = useConcepts();
  const [text, setText] = useState(rawMaterial);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    const result = generateConcepts(text);
    setSubmitting(false);

    if (!result.ok) {
      if (result.reason === "empty") {
        setError("자료를 먼저 입력해주세요.");
      } else {
        setError(
          "붙여넣은 자료에서 파이썬 개념을 찾지 못했어요. 코랩 실행 로그만 있는 경우처럼 개념 설명이 없는 자료는 인식할 수 없어요. 개념 설명이 담긴 자료를 다시 붙여넣어주세요."
        );
      }
      return;
    }

    setError(null);
    router.push("/concepts");
  };

  return (
    <div>
      <ScreenHeader
        title="수업 자료로 개념 만들기"
        subtitle="노션·코랩 내용을 복사해 아래에 붙여넣으세요"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={
            "예)\n반복문(for)\nfor는 정해진 횟수만큼 코드를 반복 실행합니다...\n\n조건문(if)\n조건이 참일 때만 코드를 실행합니다..."
          }
          rows={14}
          className="w-full resize-y rounded-lg border border-slate-300 p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          개념 생성하기
        </button>
      </div>
    </div>
  );
}
