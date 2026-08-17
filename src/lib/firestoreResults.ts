"use client";

import { useEffect, useState } from "react";
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db, firebaseConfigured } from "./firebase";
import { Difficulty, TestResultRecord, UserProfile } from "./types";

const RESULTS_COLLECTION = "results";
const USERS_COLLECTION = "users";

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return 0;
}

function docToResult(id: string, data: Record<string, unknown>): TestResultRecord {
  return {
    id,
    studentUid: (data.studentUid as string) ?? "",
    studentEmail: (data.studentEmail as string) ?? "",
    studentName: (data.studentName as string | null) ?? null,
    conceptId: (data.conceptId as string) ?? "",
    conceptTitle: (data.conceptTitle as string) ?? "",
    difficulty: (data.difficulty as Difficulty) ?? "하",
    score: (data.score as number) ?? 0,
    total: (data.total as number) ?? 0,
    answeredAt: toMillis(data.answeredAt),
  };
}

export async function saveTestResult(params: {
  user: User;
  conceptId: string;
  conceptTitle: string;
  difficulty: Difficulty;
  score: number;
  total: number;
}) {
  await addDoc(collection(db, RESULTS_COLLECTION), {
    studentUid: params.user.uid,
    studentEmail: params.user.email ?? "",
    studentName: params.user.displayName ?? null,
    conceptId: params.conceptId,
    conceptTitle: params.conceptTitle,
    difficulty: params.difficulty,
    score: params.score,
    total: params.total,
    answeredAt: serverTimestamp(),
  });
}

/** 교사 화면: 전체 학생의 최근 응시 기록. */
export function useAllResults(limitCount = 200) {
  const [results, setResults] = useState<TestResultRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, RESULTS_COLLECTION), orderBy("answeredAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setResults(
          snapshot.docs.slice(0, limitCount).map((d) => docToResult(d.id, d.data()))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { results, loading };
}

/** 학생 화면: 내 응시 기록. */
export function useMyResults(uid: string | undefined) {
  const [results, setResults] = useState<TestResultRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid || !firebaseConfigured) {
      setResults([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, RESULTS_COLLECTION),
      where("studentUid", "==", uid),
      orderBy("answeredAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setResults(snapshot.docs.map((d) => docToResult(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [uid]);

  return { results, loading };
}

function docToProfile(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: id,
    email: (data.email as string) ?? "",
    displayName: (data.displayName as string | null) ?? null,
    photoURL: (data.photoURL as string | null) ?? null,
    role: data.role === "teacher" ? "teacher" : "student",
    lastLoginAt: toMillis(data.lastLoginAt) || undefined,
  };
}

/** 교사 화면: 로그인한 적 있는 학생 목록. */
export function useStudents() {
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, USERS_COLLECTION), where("role", "==", "student"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setStudents(snapshot.docs.map((d) => docToProfile(d.id, d.data())));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, []);

  return { students, loading };
}

/** 학생 기록 삭제(교사 전용): 프로필과 그 학생의 모든 응시 기록을 지운다. */
export async function removeStudent(uid: string, resultIds: string[]) {
  await Promise.all([
    deleteDoc(doc(db, USERS_COLLECTION, uid)),
    ...resultIds.map((id) => deleteDoc(doc(db, RESULTS_COLLECTION, id))),
  ]);
}
