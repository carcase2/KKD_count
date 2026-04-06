"use client";

import { useMemo, useState } from "react";
import { Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QuotationLine } from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatWon(n: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);
}

export function QuotationView() {
  const [customerName, setCustomerName] = useState("데모 고객사");
  const [customerEmail, setCustomerEmail] = useState("client@example.com");
  const [lines, setLines] = useState<QuotationLine[]>([
    { id: "1", name: "기본 패키지", qty: 1, unitPrice: 1000000 },
    { id: "2", name: "추가 옵션", qty: 2, unitPrice: 150000 },
  ]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mailState, setMailState] = useState<"idle" | "sending" | "sent">("idle");

  const { subtotal, vat, total } = useMemo(() => {
    const sub = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
    const v = Math.round(sub * 0.1);
    return { subtotal: sub, vat: v, total: sub + v };
  }, [lines]);

  const updateLine = (id: string, patch: Partial<QuotationLine>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const sendMail = () => {
    setMailState("sending");
    setTimeout(() => setMailState("sent"), 1200);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="스마트 견적기"
        description="품목·수량·단가 입력 시 부가세 10%와 합계가 바로 반영됩니다. 인쇄 미리보기와 메일 발송은 데모 동작입니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>고객 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="c-name">고객명</Label>
            <Input id="c-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="c-mail">이메일</Label>
            <Input
              id="c-mail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>품목</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((line) => (
            <div
              key={line.id}
              className="grid gap-3 rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 sm:grid-cols-[2fr_1fr_1fr]"
            >
              <div className="space-y-1">
                <Label>품목명</Label>
                <Input
                  value={line.name}
                  onChange={(e) => updateLine(line.id, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>수량</Label>
                <Input
                  type="number"
                  min={0}
                  value={line.qty}
                  onChange={(e) =>
                    updateLine(line.id, { qty: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>단가</Label>
                <Input
                  type="number"
                  min={0}
                  value={line.unitPrice}
                  onChange={(e) =>
                    updateLine(line.id, {
                      unitPrice: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                { id: randomId(), name: "신규 품목", qty: 1, unitPrice: 0 },
              ])
            }
          >
            품목 추가
          </Button>
        </CardContent>
      </Card>

      <Card className="border-blue-200/50 bg-gradient-to-br from-slate-50 to-blue-50/30">
        <CardContent className="space-y-2 p-5 text-base">
          <div className="flex justify-between">
            <span className="text-slate-600">공급가액</span>
            <span className="font-medium">{formatWon(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">부가세 (10%)</span>
            <span className="font-medium">{formatWon(vat)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
            <span className="text-slate-800">합계</span>
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {formatWon(total)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
          <Printer className="mr-2 h-4 w-4" />
          PDF 생성(인쇄 미리보기)
        </Button>
        <Button type="button" onClick={sendMail} disabled={mailState === "sending"}>
          <Mail className="mr-2 h-4 w-4" />
          {mailState === "idle" && "메일 발송"}
          {mailState === "sending" && "발송 중…"}
          {mailState === "sent" && "발송 완료 ✓"}
        </Button>
      </div>

      {mailState === "sent" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-base text-emerald-900">
          <strong>{customerEmail}</strong> 로 견적서가 전송된 것처럼 표시됩니다. (데모)
        </p>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-5 py-4">
              <span className="font-semibold text-slate-900">인쇄용 미리보기</span>
              <Button type="button" variant="ghost" onClick={() => setPreviewOpen(false)}>
                닫기
              </Button>
            </div>
            <div className="p-4">
              <div id="quotation-print-root" className="rounded-lg border border-slate-200 bg-white p-8 text-slate-900">
                <h2 className="text-2xl font-bold">견 적 서</h2>
                <p className="mt-2 text-sm text-slate-600">
                  company_id: {DEMO_COMPANY_ID} · 발행일 {new Date().toLocaleDateString("ko-KR")}
                </p>
                <p className="mt-6 text-lg font-medium">수신: {customerName}</p>
                <table className="mt-6 w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2">품목</th>
                      <th className="py-2">수량</th>
                      <th className="py-2">단가</th>
                      <th className="py-2 text-right">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.id} className="border-b border-slate-100">
                        <td className="py-2">{l.name}</td>
                        <td className="py-2">{l.qty}</td>
                        <td className="py-2">{formatWon(l.unitPrice)}</td>
                        <td className="py-2 text-right">{formatWon(l.qty * l.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6 space-y-1 text-right text-sm">
                  <p>공급가액 {formatWon(subtotal)}</p>
                  <p>부가세 {formatWon(vat)}</p>
                  <p className="text-lg font-bold">합계 {formatWon(total)}</p>
                </div>
              </div>
              <Button
                type="button"
                className="mt-4 w-full"
                onClick={() => window.print()}
              >
                인쇄 / PDF 저장
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
