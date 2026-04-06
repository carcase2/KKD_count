"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/context/app-state";
import type { ApprovalLineMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";

export function ApprovalView() {
  const { approvals, addApproval, approveDoc, rejectDoc, isAdmin } = useAppState();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [d1, setD1] = useState("김직원");
  const [d2, setD2] = useState("이대리");
  const [d3, setD3] = useState("사장");

  const firstPendingForBoss = useMemo(
    () =>
      approvals.find((d) =>
        d.line.some((m) => m.role === "approve" && m.status === "pending"),
      ),
    [approvals],
  );

  return (
    <div className="space-y-8 pb-28 lg:pb-6">
      <PageHeader
        title="전자결재"
        description="기안 → 검토 → 승인 순서의 결재선 데모입니다. 사장(Admin) 계정으로 모바일에서 하단 승인·반려 버튼을 사용할 수 있습니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>기안 작성</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="ap-title">제목</Label>
            <Input
              id="ap-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="결재 제목"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ap-body">내용</Label>
            <Textarea
              id="ap-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="상세 내용"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>기안</Label>
              <Input value={d1} onChange={(e) => setD1(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>검토</Label>
              <Input value={d2} onChange={(e) => setD2(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>승인</Label>
              <Input value={d3} onChange={(e) => setD3(e.target.value)} />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              if (!title.trim()) return;
              const line: ApprovalLineMember[] = [
                { role: "draft", name: d1, status: "approved" },
                { role: "review", name: d2, status: "approved" },
                { role: "approve", name: d3, status: "pending" },
              ];
              void addApproval({ title: title.trim(), body: body.trim(), line });
              setTitle("");
              setBody("");
            }}
          >
            상신
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">결재함</h2>
        {approvals.map((doc) => (
          <Card key={doc.id}>
            <CardHeader>
              <CardTitle className="text-base">{doc.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-base">
              <p className="whitespace-pre-wrap leading-relaxed text-slate-600">{doc.body}</p>
              <div className="flex flex-wrap gap-2">
                {doc.line.map((m, i) => (
                  <span
                    key={i}
                    className={[
                      "rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1",
                      m.status === "approved"
                        ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80"
                        : m.status === "rejected"
                          ? "bg-red-50 text-red-800 ring-red-200/80"
                          : "bg-slate-100 text-slate-600 ring-slate-200/80",
                    ].join(" ")}
                  >
                    {m.role === "draft" ? "기안" : m.role === "review" ? "검토" : "승인"} ·{" "}
                    {m.name} · {m.status}
                  </span>
                ))}
              </div>
              {isAdmin &&
              doc.line.some((m) => m.role === "approve" && m.status === "pending") ? (
                <div className="hidden gap-2 lg:flex">
                  <Button type="button" onClick={() => void approveDoc(doc.id)}>
                    승인
                  </Button>
                  <Button type="button" variant="danger" onClick={() => void rejectDoc(doc.id)}>
                    반려
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdmin && firstPendingForBoss ? (
        <div className="fixed bottom-24 left-0 right-0 z-40 flex gap-3 border-t border-slate-200/90 bg-white/95 px-4 py-4 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.15)] backdrop-blur-md lg:hidden">
          <Button
            type="button"
            className="min-h-12 flex-1 text-base"
            onClick={() => void approveDoc(firstPendingForBoss.id)}
          >
            승인
          </Button>
          <Button
            type="button"
            variant="danger"
            className="min-h-12 flex-1 text-base"
            onClick={() => void rejectDoc(firstPendingForBoss.id)}
          >
            반려
          </Button>
        </div>
      ) : null}
    </div>
  );
}
