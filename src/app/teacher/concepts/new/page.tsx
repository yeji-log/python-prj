"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConceptForm } from "@/components/ConceptForm";
import { addCustomConcept } from "@/lib/firestoreConcepts";

export default function NewConceptPage() {
  const router = useRouter();

  return (
    <div>
      <Link href="/teacher/concepts" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
        ◂ 개념 관리
      </Link>
      <h1 className="text-xl font-bold text-slate-900 mb-4">새 개념 직접 만들기</h1>
      <ConceptForm
        submitLabel="개념 만들기"
        onSubmit={async (input) => {
          const id = await addCustomConcept(input);
          router.push(`/teacher/concepts?created=${id}`);
        }}
      />
    </div>
  );
}
