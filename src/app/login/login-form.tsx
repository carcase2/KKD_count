"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEFAULT_EMPLOYEE_PASSWORD } from "@/lib/auth/default-password";

// ─── 계정 발급 대기 화면 ─────────────────────────────────
function PendingScreen({ name }: { name?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-xl shadow-slate-900/10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-200">
          <Clock className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-amber-900">계정 발급 대기 중</h2>
        {name && (
          <p className="mt-1 text-sm font-medium text-amber-700">{name} 님</p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-amber-800">
          신청이 완료되었습니다.<br />
          <strong>관리자가 로그인 계정을 발급</strong>하면<br />
          이름과 동일한 아이디로 로그인할 수 있습니다.
        </p>
        <div className="mt-6 rounded-xl bg-white/70 px-4 py-3 text-xs text-amber-700 ring-1 ring-amber-200">
          발급 후 초기 비밀번호 : <strong>{DEFAULT_EMPLOYEE_PASSWORD}</strong>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 text-xs text-amber-600 underline underline-offset-2 hover:text-amber-800"
        >
          발급됐나요? 다시 시도하기
        </button>
      </div>
    </div>
  );
}

// ─── 로그인 폼 ───────────────────────────────────────────
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const registered = searchParams.get("registered") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: username.trim(), password: password.trim() }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      // 계정 미발급 상태 → 대기 화면으로 전환
      if (json.error?.includes("관리자가 로그인 계정을 발급")) {
        setPendingName(username.trim());
        return;
      }
      setMessage(json.error ?? "로그인에 실패했습니다.");
      return;
    }
    router.replace(next);
    router.refresh();
  };

  // 계정 발급 대기 화면
  if (pendingName !== null) {
    return <PendingScreen name={pendingName} />;
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-xl font-bold text-slate-900">로그인 비활성</h1>
          <p className="mt-2 text-slate-600">
            Supabase URL·키가 없으면 로그인 없이 데모만 사용할 수 있습니다.{" "}
            <Link className="text-blue-600 underline" href="/dashboard">
              대시보드로
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-lg">
          K
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">회사 인트라넷</p>
          <p className="text-sm text-slate-500">관리자 발급 아이디 · 비밀번호</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/10"
      >
        {registered && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-200/80">
            신청이 완료됐습니다. <strong>관리자가 계정을 발급</strong>하면 이름과 동일한 아이디·기본 비밀번호{" "}
            <strong>{DEFAULT_EMPLOYEE_PASSWORD}</strong>로 로그인하세요.
          </p>
        )}

        <Input
          id="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="아이디"
        />
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="비밀번호"
        />

        {message && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">
            {message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로그인 중…
            </>
          ) : (
            "로그인"
          )}
        </Button>

        <p className="text-center text-sm text-slate-500">
          <Link href="/signup" className="font-medium text-blue-600 underline">
            회원가입
          </Link>
          {" · "}
          직원은 신청 후 발급 아이디·기본 비밀번호 {DEFAULT_EMPLOYEE_PASSWORD}로 로그인합니다.
        </p>
      </form>
    </div>
  );
}
