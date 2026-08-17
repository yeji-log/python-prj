"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConcepts } from "@/lib/ConceptsProvider";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function ConceptListPage() {
  const router = useRouter();
  const { hydrated, concepts } = useConcepts();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && concepts.length === 0) {
      router.replace("/");
    }
  }, [hydrated, concepts.length, router]);

  if (!hydrated) {
    return <p className="text-sm text-slate-400">불러오는 중...</p>;
  }

  if (concepts.length === 0) {
    // 리다이렉트되기 전 짧은 순간을 위한 안내
    return (
      <p className="text-sm text-slate-500">
        생성된 개념이 없어요. 자료 입력 화면으로 이동합니다...
      </p>
    );
  }

  return (
    <div>
      <ScreenHeader title="개념 목록" backHref="/" backLabel="자료 다시 입력" />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {concepts.map((concept) => (
          <label
            key={concept.id}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50"
          >
            <input
              type="radio"
              name="concept"
              className="h-4 w-4 accent-blue-600"
              checked={selectedId === concept.id}
              onChange={() => setSelectedId(concept.id)}
            />
            <span className="text-slate-800">{concept.title}</span>
          </label>
        ))}
      </div>

      <button
        onClick={() => selectedId && router.push(`/concepts/${selectedId}`)}
        disabled={!selectedId}
        className="mt-4 w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        선택한 개념 학습
      </button>

      <p className="mt-3 text-center text-sm">
        <Link href="/" className="text-slate-500 hover:text-slate-700">
          + 다른 자료로 새로 만들기
        </Link>
      </p>
    </div>
  );
}
