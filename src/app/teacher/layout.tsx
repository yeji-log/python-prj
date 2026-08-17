"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";
import { AppHeader } from "@/components/AppHeader";
import { PageShell } from "@/components/PageShell";

const TABS = [
  { href: "/teacher", label: "대시보드" },
  { href: "/teacher/materials", label: "자료 업로드" },
  { href: "/teacher/concepts", label: "개념 관리" },
  { href: "/teacher/students", label: "학생 관리" },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (role !== "teacher") {
      router.replace("/student");
    }
  }, [loading, user, role, router]);

  if (loading || !user || role !== "teacher") {
    return (
      <PageShell wide>
        <p className="text-sm text-slate-400">불러오는 중...</p>
      </PageShell>
    );
  }

  return (
    <PageShell wide>
      <AppHeader title="교사 페이지" />
      <nav className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </PageShell>
  );
}
