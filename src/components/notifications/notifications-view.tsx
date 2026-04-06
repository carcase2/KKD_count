"use client";

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAppState } from "@/context/app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export function NotificationsView() {
  const { notifications, markAllNotificationsRead, addNotification } = useAppState();
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || notifications.length > 0) return;
    seeded.current = true;
    addNotification({
      title: "환영합니다",
      body: "인트라넷 데모 알림입니다. 하단 탭에서 언제든 열 수 있습니다.",
    });
  }, [notifications.length, addNotification]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="알림"
        description="모바일 하단 탭과 연결된 알림 목록입니다."
        action={
          <Button type="button" variant="secondary" onClick={markAllNotificationsRead}>
            모두 읽음
          </Button>
        }
      />

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={[
              "overflow-hidden border-slate-200/90 transition-all",
              n.read ? "bg-slate-50/80 opacity-75" : "border-l-4 border-l-blue-500 shadow-sm",
            ].join(" ")}
          >
            <CardHeader className="flex flex-row items-center gap-3 border-slate-100 py-4">
              <div
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  n.read ? "bg-slate-200/60 text-slate-500" : "bg-blue-600/10 text-blue-600",
                ].join(" ")}
              >
                <Bell className="h-5 w-5" />
              </div>
              <CardTitle className="text-base text-slate-900">{n.title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-5 text-base leading-relaxed text-slate-600">
              <p>{n.body}</p>
              <p className="mt-3 text-sm font-medium text-slate-400">
                {new Date(n.createdAt).toLocaleString("ko-KR")}
                {n.read ? " · 읽음" : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
