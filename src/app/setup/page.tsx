"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ConfigRes = {
  configured: boolean;
  url: string | null;
  hasKey: boolean;
};

export default function SetupPage() {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/system/supabase-config", { cache: "no-store" });
      const json = (await res.json()) as ConfigRes;
      setConfigured(json.configured);
      setUrl(json.url ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/system/supabase-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          url: url.trim(),
          publishableKey: key.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setError(json.error ?? "저장에 실패했습니다.");
        return;
      }
      setMessage(
        json.message ?? "저장 완료. 서버를 재시작하면 로그인/데이터 연결이 활성화됩니다.",
      );
      setConfigured(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Supabase 연결 설정</h1>
        <p className="mt-2 text-sm text-slate-600">
          회사별 Supabase URL/키를 입력해 연결합니다. 최초 설정 후에는 관리자만 변경할 수 있습니다.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-slate-500">설정 상태 확인 중…</p>
        ) : (
          <>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Supabase URL</label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xxxx.supabase.co"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Publishable(또는 anon) key
                </label>
                <Input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sb_publishable_..."
                  disabled={saving}
                />
              </div>
            </div>

            {configured && (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                이미 설정된 상태입니다. 수정은 관리자 권한이 필요합니다.
              </p>
            )}
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </p>
            )}
            {message && (
              <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
                {message}
              </p>
            )}

            <div className="mt-6 flex items-center gap-2">
              <Button onClick={() => void save()} disabled={saving || !url.trim() || !key.trim()}>
                {saving ? "저장 중…" : "설정 저장"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">로그인으로 이동</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              저장 후에는 개발 서버를 재시작해야 반영됩니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
