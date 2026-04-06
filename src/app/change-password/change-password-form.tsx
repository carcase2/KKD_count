"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirm) {
      setMessage("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "변경에 실패했습니다.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
    >
      <p className="text-sm text-slate-600">
        보안을 위해 <strong>현재(또는 관리자가 알려준 초기) 비밀번호</strong>를 입력한 뒤 새 비밀번호로 바꿉니다.
      </p>
      <div className="space-y-1">
        <Label htmlFor="cur">현재 비밀번호</Label>
        <Input
          id="cur"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="nw">새 비밀번호</Label>
        <Input
          id="nw"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={4}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cf">새 비밀번호 확인</Label>
        <Input
          id="cf"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={4}
        />
      </div>
      {message ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200">{message}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            저장 중…
          </>
        ) : (
          "비밀번호 변경"
        )}
      </Button>
    </form>
  );
}
