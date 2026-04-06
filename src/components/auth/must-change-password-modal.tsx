"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { DEFAULT_EMPLOYEE_PASSWORD } from "@/lib/auth/default-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MustChangePasswordModal() {
  const { configured, loading, session, refreshSession, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const open = Boolean(configured && !loading && session?.must_change_password);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const cur = DEFAULT_EMPLOYEE_PASSWORD;
    const nw = newPassword.trim();
    const cf = confirm.trim();
    if (nw !== cf) {
      setMessage("새 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (nw.length < 4) {
      setMessage("새 비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage(json.error ?? "변경에 실패했습니다.");
      return;
    }
    setNewPassword("");
    setConfirm("");
    await refreshSession();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwd-change-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/20">
        <h2 id="pwd-change-title" className="text-lg font-bold text-slate-900">
          비밀번호 변경
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          기본 비밀번호({DEFAULT_EMPLOYEE_PASSWORD})로 로그인하셨습니다. 보안을 위해 새 비밀번호로 변경해 주세요.
        </p>
        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label htmlFor="mcp-nw">새 비밀번호</Label>
            <Input
              id="mcp-nw"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mcp-cf">새 비밀번호 확인</Label>
            <Input
              id="mcp-cf"
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
              "변경하고 계속하기"
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">
          <button
            type="button"
            className="font-medium text-blue-600 underline"
            onClick={() => void signOut().then(() => (window.location.href = "/login"))}
          >
            로그아웃
          </button>
        </p>
      </div>
    </div>
  );
}
