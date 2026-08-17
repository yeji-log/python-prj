"use client";

import Link from "next/link";
import { useFirestoreConcepts } from "@/lib/firestoreConcepts";
import { useAllResults, useStudents } from "@/lib/firestoreResults";

export default function TeacherDashboardPage() {
  const { concepts, loading: conceptsLoading } = useFirestoreConcepts();
  const { students, loading: studentsLoading } = useStudents();
  const { results, loading: resultsLoading } = useAllResults(5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="개념" value={conceptsLoading ? "-" : concepts.length} />
        <StatCard label="학생" value={studentsLoading ? "-" : students.length} />
        <StatCard label="누적 응시" value={resultsLoading ? "-" : results.length + (results.length >= 5 ? "+" : "")} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <QuickLink
          href="/teacher/materials"
          title="자료 업로드"
          description="수업 자료를 붙여넣거나 .ipynb를 올려 개념·문제를 자동 생성해요."
        />
        <QuickLink
          href="/teacher/concepts"
          title="개념 관리"
          description="개념을 직접 추가·수정하거나 문제를 편집해요."
        />
        <QuickLink
          href="/teacher/students"
          title="학생 관리"
          description="로그인한 학생 목록과 테스트 결과를 확인해요."
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">최근 응시 기록</h2>
        {resultsLoading ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-slate-400">아직 응시 기록이 없어요.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {results.map((r) => (
              <li key={r.id} className="py-2 text-sm flex justify-between">
                <span className="text-slate-700">
                  {r.studentName ?? r.studentEmail} · {r.conceptTitle} ({r.difficulty})
                </span>
                <span className="text-slate-500">
                  {r.score}/{r.total}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-300 hover:shadow transition-all"
    >
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
    </Link>
  );
}
