"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConceptForm } from "@/components/ConceptForm";
import { updateConcept, useFirestoreConcepts } from "@/lib/firestoreConcepts";

export default function EditConceptPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { concepts, loading } = useFirestoreConcepts();
  const concept = concepts.find((c) => c.id === params.id);

  return (
    <div>
      <Link href="/teacher/concepts" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
        ◂ 개념 관리
      </Link>
      <h1 className="text-xl font-bold text-slate-900 mb-4">개념 수정</h1>

      {loading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : !concept ? (
        <p className="text-sm text-slate-400">개념을 찾을 수 없어요.</p>
      ) : (
        <ConceptForm
          key={concept.id}
          initial={concept}
          submitLabel="저장하기"
          onSubmit={async (input) => {
            await updateConcept(concept.id, input);
            router.push("/teacher/concepts");
          }}
        />
      )}
    </div>
  );
}
