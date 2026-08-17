"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { AppHeader } from "@/components/AppHeader";
import { PageShell } from "@/components/PageShell";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <PageShell>
        <p className="text-sm text-slate-400">불러오는 중...</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <AppHeader title="파이썬 개념 테스트" />
      {children}
    </PageShell>
  );
}
