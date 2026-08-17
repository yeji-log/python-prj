"use client";

import { useState } from "react";
import { useAllResults, useStudents, removeStudent } from "@/lib/firestoreResults";

function formatTime(ms?: number) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TeacherStudentsPage() {
  const { students, loading: studentsLoading } = useStudents();
  const { results, loading: resultsLoading } = useAllResults(500);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const handleRemove = async (uid: string, label: string) => {
    if (!window.confirm(`'${label}' 학생 기록을 삭제할까요? (응시 기록도 함께 삭제돼요)`)) return;
    setBusyUid(uid);
    try {
      const resultIds = results.filter((r) => r.studentUid === uid).map((r) => r.id);
      await removeStudent(uid, resultIds);
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-900">학생 관리</h1>

      {studentsLoading ? (
        <p className="text-sm text-slate-400">불러오는 중...</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-slate-400">아직 구글 로그인으로 접속한 학생이 없어요.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="px-4 py-2 font-medium">이름</th>
                <th className="px-4 py-2 font-medium">이메일</th>
                <th className="px-4 py-2 font-medium">최근 로그인</th>
                <th className="px-4 py-2 font-medium">응시 횟수</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const count = results.filter((r) => r.studentUid === s.uid).length;
                return (
                  <tr key={s.uid} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2 text-slate-800">{s.displayName ?? "-"}</td>
                    <td className="px-4 py-2 text-slate-600">{s.email}</td>
                    <td className="px-4 py-2 text-slate-500">{formatTime(s.lastLoginAt)}</td>
                    <td className="px-4 py-2 text-slate-500">{count}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemove(s.uid, s.displayName ?? s.email)}
                        disabled={busyUid === s.uid}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        기록 삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">전체 응시 기록</h2>
        {resultsLoading ? (
          <p className="text-sm text-slate-400">불러오는 중...</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-slate-400">아직 응시 기록이 없어요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="px-2 py-2 font-medium">학생</th>
                  <th className="px-2 py-2 font-medium">개념</th>
                  <th className="px-2 py-2 font-medium">난이도</th>
                  <th className="px-2 py-2 font-medium">점수</th>
                  <th className="px-2 py-2 font-medium">시각</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-2 py-2 text-slate-700">{r.studentName ?? r.studentEmail}</td>
                    <td className="px-2 py-2 text-slate-700">{r.conceptTitle}</td>
                    <td className="px-2 py-2 text-slate-500">{r.difficulty}</td>
                    <td className="px-2 py-2 text-slate-500">
                      {r.score}/{r.total}
                    </td>
                    <td className="px-2 py-2 text-slate-400">{formatTime(r.answeredAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
