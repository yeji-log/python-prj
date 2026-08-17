"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { PageShell } from "@/components/PageShell";

export default function LandingPage() {
  const router = useRouter();
  const { user, role, loading, error, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (!loading && user && role) {
      router.replace(role === "teacher" ? "/teacher" : "/student");
    }
  }, [loading, user, role, router]);

  if (loading || (user && role)) {
    return (
      <PageShell>
        <p className="text-sm text-slate-400">불러오는 중...</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col items-center text-center mt-16">
        <h1 className="text-2xl font-bold text-slate-900">파이썬 개념 테스트</h1>
        <p className="text-sm text-slate-500 mt-2 mb-8">
          구글 계정으로 로그인하고 파이썬 개념을 학습·테스트해보세요.
        </p>

        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.97 10.73A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.19.29-1.73V4.94H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.06l3.01-2.33z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
            />
          </svg>
          Google로 로그인
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </PageShell>
  );
}
