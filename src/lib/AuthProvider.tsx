"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import { roleForEmail } from "./roles";
import { Role } from "./types";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  /** 로그인 상태를 아직 확인 중인지 (첫 로딩 시 깜빡임 방지용) */
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        // 학생 관리 화면에서 볼 수 있도록 프로필을 저장해둔다.
        // 실패해도(오프라인 등) 로그인 자체는 막지 않는다.
        setDoc(
          doc(db, "users", nextUser.uid),
          {
            email: nextUser.email ?? "",
            displayName: nextUser.displayName ?? null,
            photoURL: nextUser.photoURL ?? null,
            role: roleForEmail(nextUser.email),
            lastLoginAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {
          // 무시: 프로필 저장 실패가 로그인 자체를 막지 않도록 한다.
        });
      }
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "로그인 중 문제가 발생했어요. 다시 시도해주세요."
      );
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user ? roleForEmail(user.email) : null,
      loading,
      error,
      signInWithGoogle,
      signOutUser,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
