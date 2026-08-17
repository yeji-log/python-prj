"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConcepts } from "@/lib/ConceptsProvider";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function ConceptLearnPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { hydrated, getConcept } = useConcepts();
  const concept = getConcept(params.id);

  useEffect(() => {
    if (hydrated && !concept) {
      router.replace("/concepts");
    }
  }, [hydrated, concept, router]);

  if (!hydrated || !concept) {
    return <p className="text-sm text-slate-400">불러오는 중...</p>;
  }

  return (
    <div>
      <ScreenHeader title={concept.title} backHref="/concepts" backLabel="개념 목록" />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
          {concept.explanation}
        </p>
        {concept.explanationSource === "default" && (
          <p className="mt-3 text-xs text-slate-400">
            ※ 붙여넣은 자료에서 이 개념에 대한 설명을 찾지 못해 기본 설명을 보여주고 있어요.
          </p>
        )}
      </div>

      <button
        onClick={() => router.push(`/concepts/${concept.id}/difficulty`)}
        className="mt-4 w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 transition-colors"
      >
        테스트 시작
      </button>
    </div>
  );
}
