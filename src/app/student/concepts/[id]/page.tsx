"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreConcepts } from "@/lib/firestoreConcepts";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function ConceptLearnPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { concepts, loading } = useFirestoreConcepts();
  const concept = concepts.find((c) => c.id === params.id);

  useEffect(() => {
    if (!loading && !concept) {
      router.replace("/student");
    }
  }, [loading, concept, router]);

  if (loading || !concept) {
    return <p className="text-sm text-slate-400">불러오는 중...</p>;
  }

  return (
    <div>
      <ScreenHeader title={concept.title} backHref="/student" backLabel="개념 목록" />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
          {concept.explanation}
        </p>
      </div>

      <button
        onClick={() => router.push(`/student/concepts/${concept.id}/difficulty`)}
        className="mt-4 w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 transition-colors"
      >
        테스트 시작
      </button>
    </div>
  );
}
