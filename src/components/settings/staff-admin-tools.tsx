"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DEFAULT_EMPLOYEE_PASSWORD } from "@/lib/auth/default-password";
import type { CompanyUser } from "@/lib/types";

import { useAppState } from "@/context/app-state";

type Props = {
  user: CompanyUser;
  onDone: () => void;
};

export function StaffAdminTools({ user, onDone }: Props) {
  const { removeUser } = useAppState();
  const [busy, setBusy] = useState<null | "activate" | "reset" | "toggle" | "remove">(null);

  const activate = async () => {
    setBusy("activate");
    const res = await fetch("/api/auth/admin/activate-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accountId: user.id }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      toast.error(json.error ?? "발급 실패");
      return;
    }
    toast.success(
      `로그인 아이디는 이름(${user.name})과 같습니다. 초기 비밀번호는 ${DEFAULT_EMPLOYEE_PASSWORD} 입니다.`,
    );
    onDone();
  };

  const reset = async () => {
    setBusy("reset");
    const res = await fetch("/api/auth/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accountId: user.id }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      toast.error(json.error ?? "초기화 실패");
      return;
    }
    toast.success(
      `「${user.email}」 계정 비밀번호를 ${DEFAULT_EMPLOYEE_PASSWORD}로 초기화했습니다. 다음 로그인 시 변경합니다.`,
    );
    onDone();
  };

  const toggleLogin = async (enabled: boolean) => {
    setBusy("toggle");
    const res = await fetch("/api/auth/admin/login-enabled", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ accountId: user.id, enabled }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    if (!res.ok) {
      toast.error(json.error ?? "저장 실패");
      return;
    }
    toast.message(enabled ? "로그인을 허용했습니다." : "로그인을 제한했습니다.");
    onDone();
  };

  if (user.pendingLogin) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <p className="w-full text-sm font-medium text-amber-900">
          로그인 계정 미발급 — 로그인 아이디는 이름(<strong>{user.name}</strong>)과 동일하고, 초기 비밀번호는{" "}
          <strong>{DEFAULT_EMPLOYEE_PASSWORD}</strong>로 설정됩니다.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="primary"
            className="min-h-9"
            disabled={busy !== null}
            onClick={() => void activate()}
          >
            {busy === "activate" ? "처리 중…" : "계정 발급"}
          </Button>
          <Button
            type="button"
            variant="danger"
            className="min-h-9"
            disabled={busy !== null}
            onClick={async () => {
              if (!confirm(`'${user.name}' 직원을 정말 삭제하시겠습니까?`)) return;
              setBusy("remove");
              await removeUser(user.id);
              setBusy(null);
              onDone();
            }}
          >
            {busy === "remove" ? "처리 중…" : "삭제"}
          </Button>
        </div>
      </div>
    );
  }

  const loginId = user.email.trim();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="w-full border-b border-slate-200/90 pb-2 lg:w-auto lg:flex-1 lg:border-b-0 lg:pb-0 lg:pr-4">
        <p className="text-xs font-medium text-slate-500">이 직원 행</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-900">
          로그인 아이디 <span className="text-blue-700">{loginId || "—"}</span>
          {user.name.trim() && user.name.trim() !== loginId ? (
            <span className="font-normal text-slate-600"> · {user.name.trim()}</span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-slate-500">로그인 허용·비밀번호 초기화는 위 아이디에만 적용됩니다.</p>
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`login-en-${user.id}`}
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300"
          checked={user.loginEnabled}
          disabled={busy !== null}
          onChange={(e) => void toggleLogin(e.target.checked)}
        />
        <Label htmlFor={`login-en-${user.id}`} className="cursor-pointer text-sm font-normal">
          로그인 허용
        </Label>
      </div>
      <div className="flex flex-1 flex-wrap items-end gap-2 border-t border-slate-200 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <Button
          type="button"
          variant="secondary"
          className="min-h-9"
          disabled={busy !== null}
          aria-label={`${loginId} 계정 비밀번호 ${DEFAULT_EMPLOYEE_PASSWORD}로 초기화`}
          onClick={() => void reset()}
        >
          {busy === "reset"
            ? "처리 중…"
            : `「${loginId}」 비밀번호 ${DEFAULT_EMPLOYEE_PASSWORD}로 초기화`}
        </Button>
        <Button
          type="button"
          variant="danger"
          className="min-h-9 ml-2"
          disabled={busy !== null}
          onClick={async () => {
            if (!confirm(`'${user.name}' 직원을 정말 삭제하시겠습니까?`)) return;
            setBusy("remove");
            await removeUser(user.id);
            setBusy(null);
            onDone();
          }}
        >
          {busy === "remove" ? "처리 중…" : "삭제"}
        </Button>
      </div>
      {user.mustChangePassword ? (
        <p className="w-full text-xs text-slate-600">다음 로그인 시 비밀번호 변경이 필요한 상태입니다.</p>
      ) : null}
    </div>
  );
}
