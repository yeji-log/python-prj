"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useConcepts } from "@/lib/ConceptsProvider";
import { ScreenHeader } from "@/components/ScreenHeader";
import { parseNotebookToText } from "@/lib/parseNotebook";

export default function HomePage() {
  const router = useRouter();
  const { generateConcepts, rawMaterial } = useConcepts();
  const [text, setText] = useState(rawMaterial);
  const [error, setError] = useState<string | null>(null);
  const [fileNotice, setFileNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = async (file: File) => {
    setFileNotice(null);

    if (!file.name.toLowerCase().endsWith(".ipynb")) {
      setError(".ipynb 파일만 업로드할 수 있어요.");
      return;
    }

    let raw: string;
    try {
      raw = await file.text();
    } catch {
      setError("파일을 읽는 중 문제가 발생했어요. 다시 시도해주세요.");
      return;
    }

    const result = parseNotebookToText(raw);
    if (!result.ok) {
      if (result.reason === "invalid-json" || result.reason === "invalid-notebook") {
        setError("올바른 .ipynb 노트북 파일이 아니에요. 코랩·주피터에서 내려받은 파일인지 확인해주세요.");
      } else {
        setError("이 노트북에는 불러올 내용(셀)이 없어요.");
      }
      return;
    }

    setText((prev) => (prev.trim() ? `${prev}\n\n${result.text}` : result.text));
    setError(null);
    setFileNotice(`'${file.name}' 파일에서 자료를 불러왔어요. 필요하면 내용을 수정한 뒤 생성하세요.`);
  };

  return (
    <div>
      <ScreenHeader
        title="수업 자료로 개념 만들기"
        subtitle="노션·코랩 내용을 복사해 붙여넣거나, .ipynb 파일을 업로드하세요"
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".ipynb,application/x-ipynb+json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mb-3 w-full rounded-lg border border-dashed border-slate-300 text-slate-600 text-sm font-medium py-3 hover:bg-slate-50 hover:border-slate-400 transition-colors"
        >
          📎 .ipynb 파일 업로드
        </button>

        {fileNotice && (
          <p className="mb-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            {fileNotice}
          </p>
        )}

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder={
            "예)\n반복문(for)\nfor는 정해진 횟수만큼 코드를 반복 실행합니다...\n\n조건문(if)\n조건이 참일 때만 코드를 실행합니다..."
          }
          rows={12}
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
