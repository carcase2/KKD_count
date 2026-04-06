"use client";

import { useState } from "react";
import { useAppState } from "@/context/app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";

function formatPhoneKorea(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

const INQUIRY_TYPES = ["제품문의", "A/S", "견적", "기타"];

export function CallsView() {
  const { addCallLog, callLogs } = useAppState();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState(INQUIRY_TYPES[0]);
  const [assignee, setAssignee] = useState("김직원");

  return (
    <div className="space-y-8">
      <PageHeader
        title="전화 접수 · CS"
        description="접수를 남기면 업무 관리의 「접수」 칸반에 자동으로 카드가 만들어집니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>접수 등록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="cl-name">고객명</Label>
              <Input
                id="cl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cl-phone">연락처</Label>
              <Input
                id="cl-phone"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(formatPhoneKorea(e.target.value))}
                placeholder="010-1234-5678"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="cl-type">문의 유형</Label>
              <select
                id="cl-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base shadow-sm outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25"
              >
                {INQUIRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cl-assignee">담당자 지정</Label>
              <Input
                id="cl-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              if (!name.trim() || !phone.trim()) return;
              void addCallLog({
                customerName: name.trim(),
                phone,
                inquiryType: type,
                assignee: assignee.trim() || "미지정",
              });
              setName("");
              setPhone("");
            }}
          >
            접수 등록
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 접수</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {callLogs.length === 0 ? (
            <p className="text-base text-slate-500">등록된 접수가 없습니다.</p>
          ) : (
            callLogs.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200/90 bg-slate-50/50 px-4 py-3.5 text-base transition-colors hover:bg-white"
              >
                <p className="font-semibold text-slate-900">{c.customerName}</p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {c.phone} · {c.inquiryType} · 담당 {c.assignee}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
