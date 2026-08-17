"use client";

import { useEffect, useState } from "react";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, firebaseConfigured } from "./firebase";
import { CONCEPT_TEMPLATES } from "./conceptData";
import { extractConcepts } from "./extractConcepts";
import { Concept, ExtractResult, QuestionBank } from "./types";

const CONCEPTS_COLLECTION = "concepts";

function toMillis(value: unknown): number | undefined {
  if (value instanceof Timestamp) return value.toMillis();
  return undefined;
}

function docToConcept(id: string, data: Record<string, unknown>): Concept {
  return {
    id,
    title: (data.title as string) ?? "(제목 없음)",
    explanation: (data.explanation as string) ?? "",
    explanationSource:
      data.explanationSource === "material" ? "material" : "default",
    questionBank: (data.questionBank as QuestionBank) ?? { 상: [], 중: [], 하: [] },
    source: (data.source as Concept["source"]) ?? "custom",
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

/** 개념 목록을 실시간으로 구독한다 (교사가 추가하면 학생 화면에도 바로 반영). */
export function useFirestoreConcepts() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, CONCEPTS_COLLECTION), orderBy("title"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setConcepts(snapshot.docs.map((d) => docToConcept(d.id, d.data())));
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { concepts, loading, error };
}

/** 6개 기본 템플릿 중 하나를 그대로 개념 목록에 추가(있으면 갱신)한다. */
export async function upsertTemplateConcept(templateId: string) {
  const tpl = CONCEPT_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) throw new Error("존재하지 않는 템플릿이에요.");

  await setDoc(
    doc(db, CONCEPTS_COLLECTION, tpl.id),
    {
      title: tpl.title,
      explanation: tpl.defaultExplanation,
      explanationSource: "default",
      questionBank: tpl.questionBank,
      source: "template",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * 붙여넣은 자료(또는 .ipynb에서 뽑은 텍스트)에서 개념을 추출해 그대로
 * Firestore에 저장한다. extractConcepts의 실패 사유를 그대로 반환해서
 * 화면에서 기존 안내 문구를 재사용할 수 있게 한다.
 */
export async function addConceptsFromMaterial(
  rawMaterial: string
): Promise<ExtractResult> {
  const result = extractConcepts(rawMaterial);
  if (!result.ok) return result;

  await Promise.all(
    result.concepts.map((concept) =>
      setDoc(
        doc(db, CONCEPTS_COLLECTION, concept.id),
        {
          title: concept.title,
          explanation: concept.explanation,
          explanationSource: concept.explanationSource,
          questionBank: concept.questionBank,
          source: "material",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    )
  );

  return result;
}

export interface CustomConceptInput {
  title: string;
  explanation: string;
  questionBank: QuestionBank;
}

function slugify(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return base ? `${base}-${suffix}` : `concept-${suffix}`;
}

/** 교사가 자료 없이 직접 개념+문제를 만든다. 새 문서 id를 반환한다. */
export async function addCustomConcept(input: CustomConceptInput): Promise<string> {
  const id = slugify(input.title);
  await setDoc(doc(db, CONCEPTS_COLLECTION, id), {
    title: input.title,
    explanation: input.explanation,
    explanationSource: "material",
    questionBank: input.questionBank,
    source: "custom",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
}

/** 기존 개념(자동/수동 상관없이)의 제목·설명·문제를 덮어쓴다. */
export async function updateConcept(
  id: string,
  input: CustomConceptInput
): Promise<void> {
  await setDoc(
    doc(db, CONCEPTS_COLLECTION, id),
    {
      title: input.title,
      explanation: input.explanation,
      questionBank: input.questionBank,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deleteConcept(id: string): Promise<void> {
  await deleteDoc(doc(db, CONCEPTS_COLLECTION, id));
}
