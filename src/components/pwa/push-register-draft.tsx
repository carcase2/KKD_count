"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Web Push 등록 플로우 초안 (VAPID 키·서버 구독 저장 필요)
 */
export function PushRegisterDraft() {
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);

  const checkRegistration = async () => {
    if (!("serviceWorker" in navigator)) return;
    const r = await navigator.serviceWorker.getRegistration();
    setReg(r ?? null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Web Push 등록 (초안)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-600">
        <p>브라우저: Push API 지원 {supported ? "예" : "아니오 (SSR/구형 브라우저)"}</p>
        <p>Service Worker 등록: {reg ? reg.scope : "확인 전"}</p>
        <Button type="button" variant="secondary" onClick={() => void checkRegistration()}>
          등록 상태 확인
        </Button>
        <p className="pt-2 text-xs">
          실제 푸시는 VAPID 키 발급 → 구독 객체를 서버에 저장 → FCM 등으로 전송하는 단계가 필요합니다.
        </p>
      </CardContent>
    </Card>
  );
}
