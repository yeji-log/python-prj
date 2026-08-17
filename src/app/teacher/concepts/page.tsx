"use client";

import { useState } from "react";
import Link from "next/link";
import { useFirestoreConcepts, upsertTemplateConcept, deleteConcept } from "@/lib/firestoreConcepts";
import { CONCEPT_TEMPLATES } from "@/lib/conceptData";
import { DIFFICULTIES } from "@/lib/types";

const SOURCE_LABEL: Record<string, string> = {
  template: "템플릿",
  material: "자료 추출",
  custom: "직접 작성",
};

export default function TeacherConceptsPage() {
  const { concepts, loading, error } = useFirestoreConcepts();
  const [busyId, setBusyId] = useState<string | null>(null);

  const existingIds = new Set(concepts.map((c) => c.id));
  const availableTemplates = CONCEPT_TEMPLATES.filter((t) => !existingIds.has(t.id));

  const handleQuickAdd = async (templateId: string) => {
    setBusyId(templateId);
    try {
      await upsertTemplateConcept(templateId);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`'${title}' 개념을 삭제할까요? 이 개념의 문제도 모두 사라져요.`)) return;
    setBusyId(id);
    try {
      await deleteConcept(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">개념 관리</h1>
        <Link
          href="/teacher/concepts/new"
          className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 hover:bg-blue-700"
        >
          + 새 개념 직접 만들기
        </Link>
      </div>

      {availableTemplates.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">템플릿에서 빠르게 추가</p>
          <div className="flex flex-wrap gap-2">
            {availableTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleQuickAdd(tpl.id)}
                disabled={busyId === tpl.id}
                className="rounded-full border border-slate-300 text-sm text-slate-600 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50"
              >
                + {tpl.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : concepts.length === 0 ? (
        <p className="text-sm text-slate-400">
          아직 개념이 없어요. 위 템플릿을 추가하거나, 자료 업로드 / 직접 만들기로 시작해보세요.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {concepts.map((concept) => (
            <div key={concept.id} className="p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-800">{concept.title}</span>
                  <span className="text-[11px] text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                    {SOURCE_LABEL[concept.source ?? "custom"]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{concept.explanation}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {DIFFICULTIES.map((level) => `${level} ${concept.questionBank[level]?.length ?? 0}문제`).join(" · ")}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/teacher/concepts/${concept.id}/edit`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  수정
                </Link>
                <button
                  onClick={() => handleDelete(concept.id, concept.title)}
                  disabled={busyId === concept.id}
                  className="text-sm text-red-500 hover:underline disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
