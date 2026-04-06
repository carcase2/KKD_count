"use client";

import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

const items = [
  { title: "신입 온보딩", desc: "회사 소개 및 계정 사용법 (데모)" },
  { title: "보안 가이드", desc: "비밀번호·2단계 인증 권장 사항" },
  { title: "견적·결재 프로세스", desc: "스마트 견적기와 전자결재 흐름" },
];

export function TrainingView() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="교육 자료"
        description="온보딩·보안·프로세스 문서를 모아 두는 사내 허브 화면 목업입니다."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card
            key={it.title}
            className="group overflow-hidden border-slate-200/80 transition-all hover:border-blue-200/80 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center gap-3 border-slate-100 bg-gradient-to-r from-slate-50/80 to-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 transition-transform group-hover:scale-105">
                <BookOpen className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{it.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-base leading-relaxed text-slate-600">{it.desc}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
