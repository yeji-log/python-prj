"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { extractConcepts } from "./extractConcepts";
import { Concept, ExtractResult } from "./types";

const STORAGE_KEY = "pyquiz:concepts:v1";

interface StoredState {
  rawMaterial: string;
  concepts: Concept[];
}

interface ConceptsContextValue {
  /** sessionStorage에서 초기 복원이 끝났는지 (끝나기 전엔 리다이렉트 판단 보류) */
  hydrated: boolean;
  rawMaterial: string;
  concepts: Concept[];
  /** 자료 텍스트로 개념 목록을 생성한다. 실패 시 상태는 바뀌지 않는다. */
  generateConcepts: (raw: string) => ExtractResult;
  getConcept: (id: string) => Concept | undefined;
  /** 처음 자료 입력 화면으로 되돌아갈 때 사용 */
  reset: () => void;
}

const ConceptsContext = createContext<ConceptsContextValue | null>(null);

export function ConceptsProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [rawMaterial, setRawMaterial] = useState("");
  const [concepts, setConcepts] = useState<Concept[]>([]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: StoredState = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.concepts)) {
          setRawMaterial(parsed.rawMaterial ?? "");
          setConcepts(parsed.concepts);
        }
      }
    } catch {
      // 저장된 값이 손상된 경우 그냥 빈 상태로 시작
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = useCallback((next: StoredState) => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 저장 실패는 무시 (앱 동작 자체는 계속 가능)
    }
  }, []);

  const generateConcepts = useCallback(
    (raw: string): ExtractResult => {
      const result = extractConcepts(raw);
      if (result.ok) {
        setRawMaterial(raw);
        setConcepts(result.concepts);
        persist({ rawMaterial: raw, concepts: result.concepts });
      }
      return result;
    },
    [persist]
  );

  const getConcept = useCallback(
    (id: string) => concepts.find((c) => c.id === id),
    [concepts]
  );

  const reset = useCallback(() => {
    setRawMaterial("");
    setConcepts([]);
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
  }, []);

  const value = useMemo<ConceptsContextValue>(
    () => ({ hydrated, rawMaterial, concepts, generateConcepts, getConcept, reset }),
    [hydrated, rawMaterial, concepts, generateConcepts, getConcept, reset]
  );

  return <ConceptsContext.Provider value={value}>{children}</ConceptsContext.Provider>;
}

export function useConcepts() {
  const ctx = useContext(ConceptsContext);
  if (!ctx) {
    throw new Error("useConcepts는 ConceptsProvider 내부에서만 사용할 수 있습니다.");
  }
  return ctx;
}
