"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatDateTimeKst } from "@/lib/datetime-kst";

export function SignupForm() {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const requestAtKst = useMemo(() => formatDateTimeKst(), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!configured) {
      setMessage("Supabase 환경변수를 설정한 뒤 신청할 수 있습니다.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: companyName.trim(),
        adminName: adminName.trim(),
        username: username.trim(),
        password: password.trim(),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      inviteCode?: string | null;
      tenantSlug?: string | null;
      tenantUrl?: string | null;
    };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "회사 가입에 실패했습니다.");
      return;
    }
    setCompanyName("");
    setAdminName("");
    setUsername("");
    setPassword("");
    const inviteText = json.inviteCode ? ` (회사코드: ${json.inviteCode})` : "";
    const tenantText = json.tenantUrl
      ? ` · 접속주소: ${json.tenantUrl}`
      : json.tenantSlug
        ? ` · 테넌트: ${json.tenantSlug}`
        : "";
    router.replace(
      `/login?registered=1&msg=${encodeURIComponent(`회사 가입 완료${inviteText}${tenantText}`)}`,
    );
    router.refresh();
  };

  if (!configured) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-lg font-bold text-slate-900">회사 가입</h1>
        <p className="mt-3 text-slate-600">
          <code className="rounded bg-slate-100 px-1 text-sm">NEXT_PUBLIC_SUPABASE_URL</code> 과 공개 키를 설정한 뒤
          다시 시도하세요.
        </p>
        <Link href="/login" className="mt-6 inline-block font-semibold text-blue-600 underline">
          로그인으로
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
      <h1 className="text-lg font-bold text-slate-900">회사 가입</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        회사를 처음 생성하고 관리자 계정을 함께 만듭니다. 가입 완료 후 입력한 관리자 계정으로 바로 로그인할 수
        있습니다.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <Label htmlFor="company">회사명</Label>
          <Input
            id="company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="예: KKD 인트라넷"
            required
            autoComplete="organization"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="adminName">관리자 이름</Label>
          <Input
            id="adminName"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="관리자 이름"
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="username">관리자 아이디</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="로그인 아이디"
            required
            autoComplete="username"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">관리자 비밀번호</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="4자 이상"
            required
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="req-at">신청 일시 (KST)</Label>
          <Input id="req-at" readOnly tabIndex={-1} className="bg-slate-50 text-slate-700" value={requestAtKst} />
          <p className="text-xs text-slate-500">화면을 연 시점의 한국 시각입니다. 실제 접수 시각은 서버에 저장됩니다.</p>
        </div>

        {message ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">{message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              가입 중…
            </>
          ) : (
            "회사 가입하기"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        이미 관리자 계정이 있나요?{" "}
        <Link href="/login" className="font-semibold text-blue-600 underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
