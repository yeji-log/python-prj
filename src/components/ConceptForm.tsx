"use client";

import { useState } from "react";
import { CustomConceptInput } from "@/lib/firestoreConcepts";
import { Concept, DIFFICULTIES, Difficulty, QuestionBank } from "@/lib/types";

interface DraftQuestion {
  key: string;
  prompt: string;
  code: string;
  options: [string, string, string, string];
  answerIndex: number;
}

type DraftBank = Record<Difficulty, DraftQuestion[]>;

let keySeq = 0;
function nextKey() {
  keySeq += 1;
  return `q-${keySeq}`;
}

function blankQuestion(): DraftQuestion {
  return {
    key: nextKey(),
    prompt: "",
    code: "",
    options: ["", "", "", ""],
    answerIndex: 0,
  };
}

function bankToDraft(bank?: QuestionBank): DraftBank {
  const draft = {} as DraftBank;
  for (const level of DIFFICULTIES) {
    const questions = bank?.[level] ?? [];
    draft[level] = questions.length
      ? questions.map((q) => ({
          key: nextKey(),
          prompt: q.prompt,
          code: q.code ?? "",
          options: [
            q.options[0] ?? "",
            q.options[1] ?? "",
            q.options[2] ?? "",
            q.options[3] ?? "",
          ],
          answerIndex: q.answerIndex ?? 0,
        }))
      : [];
  }
  return draft;
}

function isDraftValid(q: DraftQuestion): boolean {
  return (
    q.prompt.trim() !== "" &&
    q.options.every((o) => o.trim() !== "") &&
    q.answerIndex >= 0 &&
    q.answerIndex < q.options.length
  );
}

function draftToBank(draft: DraftBank, conceptId: string): QuestionBank {
  const bank = {} as QuestionBank;
  for (const level of DIFFICULTIES) {
    bank[level] = draft[level]
      .filter(isDraftValid)
      .map((q, idx) => ({
        id: `${conceptId || "custom"}-${level}-${idx}-${q.key}`,
        prompt: q.prompt.trim(),
        code: q.code.trim() || undefined,
        options: q.options.map((o) => o.trim()),
        answerIndex: q.answerIndex,
      }));
  }
  return bank;
}

export function ConceptForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Concept;
  onSubmit: (input: CustomConceptInput) => Promise<void>;
  submitLabel: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [draft, setDraft] = useState<DraftBank>(() => bankToDraft(initial?.questionBank));
  const [activeLevel, setActiveLevel] = useState<Difficulty>("하");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateQuestion = (level: Difficulty, key: string, patch: Partial<DraftQuestion>) => {
    setDraft((prev) => ({
      ...prev,
      [level]: prev[level].map((q) => (q.key === key ? { ...q, ...patch } : q)),
    }));
  };

  const addQuestion = (level: Difficulty) => {
    setDraft((prev) => ({ ...prev, [level]: [...prev[level], blankQuestion()] }));
  };

  const removeQuestion = (level: Difficulty, key: string) => {
    setDraft((prev) => ({ ...prev, [level]: prev[level].filter((q) => q.key !== key) }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!title.trim()) {
      setError("개념 이름을 입력해주세요.");
      return;
    }
    if (!explanation.trim()) {
      setError("개념 설명을 입력해주세요.");
      return;
    }
    const bank = draftToBank(draft, initial?.id ?? title);
    const totalValid = DIFFICULTIES.reduce((acc, level) => acc + bank[level].length, 0);
    if (totalValid === 0) {
      setError("문제를 하나 이상 완성해주세요. (질문·보기 4개·정답이 모두 채워져야 해요)");
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), explanation: explanation.trim(), questionBank: bank });
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 중 문제가 발생했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">개념 이름</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 재귀함수"
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">개념 설명</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            placeholder="학생이 학습 화면에서 볼 설명을 적어주세요."
            className="w-full resize-y rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex gap-2 mb-4">
          {DIFFICULTIES.map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeLevel === level
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {level} ({draft[level].filter(isDraftValid).length}/{draft[level].length})
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {draft[activeLevel].length === 0 && (
            <p className="text-sm text-slate-400">아직 문제가 없어요. 아래에서 추가해주세요.</p>
          )}
          {draft[activeLevel].map((q, idx) => (
            <div key={q.key} className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">문제 {idx + 1}</span>
                <button
                  onClick={() => removeQuestion(activeLevel, q.key)}
                  className="text-xs text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
              <input
                value={q.prompt}
                onChange={(e) => updateQuestion(activeLevel, q.key, { prompt: e.target.value })}
                placeholder="질문 (예: 아래 코드의 실행 결과는?)"
                className="w-full rounded-md border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={q.code}
                onChange={(e) => updateQuestion(activeLevel, q.key, { code: e.target.value })}
                placeholder="코드 (선택 사항)"
                rows={3}
                className="w-full resize-y rounded-md border border-slate-300 p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="space-y-1.5">
                {q.options.map((option, optIdx) => (
                  <label key={optIdx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`answer-${q.key}`}
                      checked={q.answerIndex === optIdx}
                      onChange={() => updateQuestion(activeLevel, q.key, { answerIndex: optIdx })}
                      className="h-4 w-4 accent-blue-600 shrink-0"
                    />
                    <input
                      value={option}
                      onChange={(e) => {
                        const next = [...q.options] as DraftQuestion["options"];
                        next[optIdx] = e.target.value;
                        updateQuestion(activeLevel, q.key, { options: next });
                      }}
                      placeholder={`보기 ${optIdx + 1}${q.answerIndex === optIdx ? " (정답)" : ""}`}
                      className="flex-1 rounded-md border border-slate-300 p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => addQuestion(activeLevel)}
          className="mt-3 w-full rounded-lg border border-dashed border-slate-300 text-slate-500 text-sm py-2 hover:bg-slate-50"
        >
          + {activeLevel} 문제 추가
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full rounded-lg bg-blue-600 text-white font-medium py-3 hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {saving ? "저장 중..." : submitLabel}
      </button>
    </div>
  );
}
