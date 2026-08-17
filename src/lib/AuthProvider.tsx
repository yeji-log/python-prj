"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FirebaseError } from "firebase/app";
import {
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseConfigured, googleProvider } from "./firebase";
import { roleForEmail } from "./roles";
import { Role } from "./types";

const CONFIG_ERROR =
  "Firebase 설정이 안 되어 있어요. 배포 환경변수(NEXT_PUBLIC_FIREBASE_*)를 확인해주세요.";

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

// 팝업이 아예 막혀서 리다이렉트로 대체 진행해야 하는 경우
const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/cancelled-popup-request",
]);

function friendlyAuthError(code: string | undefined): string {
  switch (code) {
    case "auth/unauthorized-domain":
      return "이 주소는 Firebase 콘솔 > Authentication > Settings > 승인된 도메인에 등록되어 있지 않아요. 관리자에게 문의해주세요.";
    case "auth/network-request-failed":
      return "네트워크 연결을 확인한 뒤 다시 시도해주세요.";
    default:
      return "로그인 중 문제가 발생했어요. 다시 시도해주세요.";
  }
}

function upsertProfile(user: User) {
  setDoc(
    doc(db, "users", user.uid),
    {
      email: user.email ?? "",
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      role: roleForEmail(user.email),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  ).catch(() => {
    // 무시: 프로필 저장 실패가 로그인 자체를 막지 않도록 한다.
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [error, setError] = useState<string | null>(
    firebaseConfigured ? null : CONFIG_ERROR
  );

  useEffect(() => {
    if (!firebaseConfigured) return;

    // signInWithRedirect로 구글 로그인 페이지에 다녀온 직후라면 그 결과를 처리한다.
    getRedirectResult(auth).catch((e: unknown) => {
      const code = e instanceof FirebaseError ? e.code : undefined;
      if (code && code !== "auth/popup-closed-by-user") {
        setError(friendlyAuthError(code));
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) upsertProfile(nextUser);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    if (!firebaseConfigured) {
      setError(CONFIG_ERROR);
      return;
    }
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : undefined;

      if (code === "auth/popup-closed-by-user") {
        // 사용자가 스스로 닫은 경우: 에러로 취급하지 않는다.
        return;
      }

      if (code && POPUP_FALLBACK_CODES.has(code)) {
        // 팝업이 브라우저 정책으로 막힌 경우 페이지 이동 방식으로 재시도한다.
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (e2) {
          const code2 = e2 instanceof FirebaseError ? e2.code : undefined;
          setError(friendlyAuthError(code2));
        }
        return;
      }

      setError(friendlyAuthError(code));
    }
  };

  const signOutUser = async () => {
    if (!firebaseConfigured) return;
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
