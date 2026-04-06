"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useAppState } from "@/context/app-state";
import { useAuth } from "@/context/auth-context";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { PushRegisterDraft } from "@/components/pwa/push-register-draft";
import { SERVICE_WORKER_PUSH_HANDLER_SNIPPET } from "@/lib/web-push-draft";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";

export function GeneralView() {
  const { configured, session } = useAuth();
  const {
    useDatabase,
    role,
    setRole,
    telegram,
    setTelegram,
    persistTelegram,
    companyUsers,
    companyProfile,
    updateCompanyProfile,
    isAdmin,
  } = useAppState();

  const [editingCompany, setEditingCompany] = useState(false);
  const [compName, setCompName] = useState("");

  useEffect(() => {
    if (companyProfile) {
      setCompName(companyProfile.name);
    }
  }, [companyProfile, editingCompany]);

  const supabase = createBrowserSupabaseClient();

  const myDeptLabel = useMemo(() => {
    if (!session?.id) return null;
    const u = companyUsers.find((x) => x.id === session.id);
    return u?.departmentName ?? (u?.departmentId ? "부서" : null);
  }, [companyUsers, session]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="일반 설정"
        description="계정, 텔레그램 연동, 데모 권한 및 기타 시스템 설정을 관리합니다."
      />

      {configured && session ? (
        <Card>
          <CardHeader>
            <CardTitle>계정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-base">
            {useDatabase && companyProfile ? (
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-medium text-slate-800">회사</span> ·{" "}
                {editingCompany ? (
                  <div className="flex items-center gap-2 h-8">
                    <Input
                      className="h-8 w-40"
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      placeholder="회사 이름"
                    />
                    <Button
                      variant="secondary"
                      className="h-8"
                      onClick={() => {
                        void updateCompanyProfile(compName).then(() => setEditingCompany(false));
                      }}
                    >
                      저장
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8"
                      onClick={() => {
                        if (companyProfile) setCompName(companyProfile.name);
                        setEditingCompany(false);
                      }}
                    >
                      취소
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-slate-900">{companyProfile.name}</span>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        className="ml-2 h-7 px-2 text-xs"
                        onClick={() => setEditingCompany(true)}
                      >
                        이름 변경
                      </Button>
                    )}
                  </>
                )}
              </div>
            ) : null}
            <p className="text-slate-600">
              <span className="font-medium text-slate-800">아이디</span> ·{" "}
              <span className="font-semibold text-slate-900">{session.username}</span>
            </p>
            {useDatabase ? (
              <>
                <p className="text-slate-600">
                  <span className="font-medium text-slate-800">전화번호</span> ·{" "}
                  <span className="font-semibold text-slate-900">{session.phone?.trim() || "—"}</span>
                </p>
                <p className="text-slate-600">
                  <span className="font-medium text-slate-800">부서</span> ·{" "}
                  <span className="font-semibold text-slate-900">{myDeptLabel ?? "—"}</span>
                </p>
              </>
            ) : null}
            <p className="text-slate-600">
              DB 역할 · <span className="font-semibold text-slate-900">{session.role}</span>
              {useDatabase ? " (intranet_accounts)" : ""}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <Link href="/change-password">
                <Button variant="secondary" className="h-8 text-xs">
                  비밀번호 변경
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500 pt-2">
              로그아웃은 모바일 상단 메뉴 또는 왼쪽 사이드바 하단에서 할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!useDatabase ? (
        <Card>
          <CardHeader>
            <CardTitle>데모 권한</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-base">
            <p className="leading-relaxed text-slate-600">
              Supabase 미연동 시에만 로컬에서 역할을 바꿔 UI를 미리 볼 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={role === "admin" ? "primary" : "secondary"}
                onClick={() => setRole("admin")}
              >
                사장 (Admin)
              </Button>
              <Button
                type="button"
                variant={role === "user" ? "primary" : "secondary"}
                onClick={() => setRole("user")}
              >
                직원 (User)
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>권한</CardTitle>
          </CardHeader>
          <CardContent className="text-base text-slate-600">
            직원은 <Link href="/signup" className="font-medium text-blue-600 underline">등록 신청</Link> 후 관리자가{" "}
            <strong>로그인 아이디만 발급</strong>합니다. 초기 비밀번호는 항상 <strong>1234</strong>이며, 첫 로그인 시
            화면에서 변경합니다.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>텔레그램 연동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            봇 토큰과 채널 ID는 서버 환경변수 또는 암호화 저장 권장. 여기서는 로컬 데모만.
          </p>
          <div className="space-y-1">
            <Label htmlFor="tg-token">봇 토큰 (Token)</Label>
            <Input
              id="tg-token"
              type="password"
              autoComplete="off"
              value={telegram.botToken}
              onChange={(e) => setTelegram({ ...telegram, botToken: e.target.value })}
              placeholder="123456:ABC..."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tg-channel">채널 ID</Label>
            <Input
              id="tg-channel"
              value={telegram.channelId}
              onChange={(e) => setTelegram({ ...telegram, channelId: e.target.value })}
              placeholder="@channel 또는 -100..."
            />
          </div>
          {useDatabase ? (
            <Button type="button" variant="secondary" onClick={() => void persistTelegram()}>
              텔레그램 설정 DB에 저장
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supabase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-base text-slate-600">
          {supabase ? (
            <>
              <p>브라우저 클라이언트가 연결되었습니다.</p>
              <p className="text-sm">
                스키마는 <code className="rounded bg-slate-100 px-1">supabase/migrations/</code> SQL을 대시보드 SQL
                편집기에서 실행해 주세요.
              </p>
            </>
          ) : (
            <p>
              <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> 과 공개 키(anon 또는
              publishable)를 설정하세요.
            </p>
          )}
        </CardContent>
      </Card>

      <PushRegisterDraft />

      <Card>
        <CardHeader>
          <CardTitle>Web Push — Service Worker 스니펫 (초안)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-slate-600">
            next-pwa 생성 SW에 병합하거나 별도 파일로 등록해 사용하세요.
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg border border-border bg-slate-900 p-3 text-xs text-slate-100">
            {SERVICE_WORKER_PUSH_HANDLER_SNIPPET.trim()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
