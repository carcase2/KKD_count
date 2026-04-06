"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function IntranetBoot({ children }: { children: ReactNode }) {
  const { configured, loading, session } = useAuth();

  if (configured && loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" aria-hidden />
        <p className="text-sm font-medium text-slate-600">세션 확인 중…</p>
      </div>
    );
  }

  if (configured && !session) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6">
        <h1 className="text-xl font-bold text-slate-900">로그인이 필요합니다</h1>
        <p className="text-slate-600">
          쿠키 세션이 없습니다. <a className="font-medium text-blue-600 underline" href="/login">로그인</a>
          으로 이동하세요.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
