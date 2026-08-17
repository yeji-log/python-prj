"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestoreConcepts } from "@/lib/firestoreConcepts";
import { useMyResults } from "@/lib/firestoreResults";
import { useAuth } from "@/lib/AuthProvider";
import { ScreenHeader } from "@/components/ScreenHeader";

function formatTime(ms: number) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudentConceptListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { concepts, loading, error } = useFirestoreConcepts();
  const { results, loading: resultsLoading } = useMyResults(user?.uid);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      <ScreenHeader title="개념 목록" />

      {error && (
        <p className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : concepts.length === 0 ? (
        <p className="text-sm text-slate-400">아직 선생님이 만든 개념이 없어요. 잠시 후 다시 확인해주세요.</p>
      ) : (
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
      )}

      <button
        onClick={() => selectedId && router.push(`/student/concepts/${selectedId}`)}
        disabled={!selectedId}
        className="mt-4 w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        선택한 개념 학습
      </button>

      {!resultsLoading && results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-600 mb-2">내 최근 기록</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            {results.slice(0, 5).map((r) => (
              <div key={r.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="text-slate-700">
                  {r.conceptTitle} · {r.difficulty}
                </span>
                <span className="text-slate-500">
                  {r.score}/{r.total}
                  <span className="text-slate-300 ml-2">{formatTime(r.answeredAt)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
