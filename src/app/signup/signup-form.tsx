"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatKoreanMobileInput } from "@/lib/phone-format";
import { formatDateTimeKst } from "@/lib/datetime-kst";

export function SignupForm() {
  const router = useRouter();
  const configured = isSupabaseConfigured();

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
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
        displayName: displayName.trim(),
        phone: phone.trim(),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "신청에 실패했습니다.");
      return;
    }
    setDisplayName("");
    setPhone("");
    router.replace("/login?registered=1");
    router.refresh();
  };

  if (!configured) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-lg font-bold text-slate-900">직원 등록 신청</h1>
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
      <h1 className="text-lg font-bold text-slate-900">직원 등록 신청</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        이름과 연락처만 제출합니다. <strong>로그인 아이디·초기 비밀번호는 관리자가 발급</strong>한 뒤 로그인할 수
        있습니다.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <Label htmlFor="display">이름</Label>
          <Input
            id="display"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="실명"
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">전화번호</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatKoreanMobileInput(e.target.value))}
            placeholder="010-1234-5678"
            required
            autoComplete="tel"
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
              전송 중…
            </>
          ) : (
            "신청 보내기"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-semibold text-blue-600 underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
