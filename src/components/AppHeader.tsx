"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthProvider";

export function AppHeader({ title }: { title: string }) {
  const { user, role, signOutUser } = useAuth();

  return (
    <header className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
      <Link href={role === "teacher" ? "/teacher" : "/student"} className="font-bold text-slate-900">
        {title}
      </Link>
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {role === "teacher" ? "교사" : "학생"}
          </span>
          <span className="text-sm text-slate-600 truncate max-w-[140px]">
            {user.displayName ?? user.email}
          </span>
          <button
            onClick={() => signOutUser()}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
