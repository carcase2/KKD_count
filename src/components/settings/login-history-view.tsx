"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Monitor, Smartphone, Globe, CheckCircle2, XCircle,
  RefreshCw, User, Users, TrendingUp, LogIn, AlertTriangle,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/auth-context";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type LoginHistoryRow = {
  id: string;
  account_id: string | null;
  username: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  created_at: string;
};

// ─── 유틸 ─────────────────────────────────────────────────
function deviceIcon(ua: string | null): React.ReactNode {
  if (!ua) return <Globe className="h-4 w-4 text-slate-400" />;
  const s = ua.toLowerCase();
  if (s.includes("mobile") || s.includes("android") || s.includes("iphone"))
    return <Smartphone className="h-4 w-4 text-slate-400" />;
  return <Monitor className="h-4 w-4 text-slate-400" />;
}

function browserName(ua: string | null): string {
  if (!ua) return "알 수 없음";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  return "기타";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function toYYYYMMDD(d: Date) {
  return d.toISOString().split("T")[0];
}

// ─── 통계 카드 ────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof LogIn;
  color: string;
}) {
  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-4 ${color}`}>
      <div className="rounded-xl bg-white/70 p-2.5 shadow-sm">
        <Icon className="h-5 w-5 text-current" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-2xl font-extrabold">{value}</p>
        {sub && <p className="text-[11px] opacity-60 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── 막대 차트 (SVG) ──────────────────────────────────────
type BarData = { label: string; success: number; fail: number };

function BarChart({ data, title }: { data: BarData[]; title: string }) {
  const maxVal = Math.max(...data.map((d) => d.success + d.fail), 1);
  const H = 120;
  const barW = Math.min(32, Math.floor(580 / Math.max(data.length, 1)) - 6);

  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(data.length * (barW + 6), 200)} ${H + 36}`}
          className="w-full"
          style={{ minWidth: data.length * (barW + 6) }}
        >
          {data.map((d, i) => {
            const total = d.success + d.fail;
            const totalH = Math.round((total / maxVal) * H);
            const successH = total > 0 ? Math.round((d.success / total) * totalH) : 0;
            const failH = totalH - successH;
            const x = i * (barW + 6);
            return (
              <g key={d.label}>
                {/* 실패 (상단) */}
                {failH > 0 && (
                  <rect
                    x={x} y={H - totalH} width={barW} height={failH}
                    rx={failH === totalH ? 5 : 0} ry={failH === totalH ? 5 : 0}
                    fill="#fca5a5"
                    className="transition-all"
                  />
                )}
                {/* 성공 (하단) */}
                {successH > 0 && (
                  <rect
                    x={x} y={H - successH} width={barW} height={successH}
                    rx={successH === totalH ? 5 : 0} ry={successH === totalH ? 5 : 0}
                    fill="#34d399"
                    className="transition-all"
                  />
                )}
                {/* 빈 바 */}
                {total === 0 && (
                  <rect x={x} y={H - 4} width={barW} height={4} rx={2} fill="#e2e8f0" />
                )}
                {/* 레이블 */}
                <text
                  x={x + barW / 2} y={H + 14}
                  textAnchor="middle" fontSize={10} fill="#94a3b8"
                >
                  {d.label}
                </text>
                {/* 값 */}
                {total > 0 && (
                  <text
                    x={x + barW / 2} y={H - totalH - 4}
                    textAnchor="middle" fontSize={10} fill="#64748b" fontWeight="600"
                  >
                    {total}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {/* 범례 */}
      <div className="mt-2 flex gap-3">
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 inline-block" />성공
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-500">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300 inline-block" />실패
        </span>
      </div>
    </div>
  );
}

// ─── 도넛 차트 (SVG) ──────────────────────────────────────
function DonutChart({ success, fail }: { success: number; fail: number }) {
  const total = success + fail;
  const r = 40;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  const successRatio = total > 0 ? success / total : 1;
  const successDash = circumference * successRatio;
  const failDash = circumference - successDash;

  return (
    <div className="flex items-center gap-6">
      <svg width={120} height={120} viewBox="0 0 120 120">
        {total === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={16} />
        ) : (
          <>
            <circle
              cx={cx} cy={cy} r={r}
              fill="none" stroke="#34d399" strokeWidth={16}
              strokeDasharray={`${successDash} ${failDash}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
            {fail > 0 && (
              <circle
                cx={cx} cy={cy} r={r}
                fill="none" stroke="#fca5a5" strokeWidth={16}
                strokeDasharray={`${failDash} ${successDash}`}
                strokeDashoffset={-successDash}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )}
          </>
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={18} fontWeight="800" fill="#1e293b">
          {total > 0 ? `${Math.round(successRatio * 100)}%` : "—"}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#94a3b8">
          성공률
        </text>
      </svg>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
          <span className="text-sm text-slate-600">성공 <strong>{success}</strong>건</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-300 inline-block" />
          <span className="text-sm text-slate-600">실패 <strong>{fail}</strong>건</span>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────
export function LoginHistoryView() {
  const { session } = useAuth();
  const { isAdmin, companyUsers } = useAppState();
  const supabase = createBrowserSupabaseClient();

  const [rows, setRows] = useState<LoginHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine">(isAdmin ? "all" : "mine");

  const load = useCallback(async () => {
    if (!supabase || !session?.company_id) return;
    setLoading(true);
    let query = supabase
      .from("login_history")
      .select("*")
      .eq("company_id", session.company_id)
      .order("created_at", { ascending: false })
      .limit(500);
    if (filter === "mine") query = query.eq("account_id", session.id);
    const { data } = await query;
    setRows((data as LoginHistoryRow[]) ?? []);
    setLoading(false);
  }, [supabase, session, filter]);

  useEffect(() => { void load(); }, [load]);

  // ── 통계 계산 ───────────────────────────────────────────
  const stats = useMemo(() => {
    const today = toYYYYMMDD(new Date());
    const todayRows = rows.filter((r) => r.created_at.startsWith(today));
    const uniqueTodayUsers = new Set(todayRows.filter((r) => r.success).map((r) => r.account_id)).size;

    // 최근 14일 막대 차트 데이터
    const last14: BarData[] = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      const key = toYYYYMMDD(d);
      const dayRows = rows.filter((r) => r.created_at.startsWith(key));
      return {
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        success: dayRows.filter((r) => r.success).length,
        fail: dayRows.filter((r) => !r.success).length,
      };
    });

    // 시간대별 (0~23h)
    const byHour: BarData[] = Array.from({ length: 24 }, (_, h) => {
      const dayRows = rows.filter((r) => new Date(r.created_at).getHours() === h);
      return {
        label: `${h}시`,
        success: dayRows.filter((r) => r.success).length,
        fail: dayRows.filter((r) => !r.success).length,
      };
    });

    return {
      total: rows.length,
      success: rows.filter((r) => r.success).length,
      fail: rows.filter((r) => !r.success).length,
      todayTotal: todayRows.length,
      todaySuccess: todayRows.filter((r) => r.success).length,
      uniqueTodayUsers,
      last14,
      byHour,
    };
  }, [rows]);

  const getUserName = (row: LoginHistoryRow) => {
    const u = companyUsers.find((u) => u.id === row.account_id);
    return u?.name ? `${u.name}` : row.username;
  };

  if (!supabase) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-slate-400">
          Supabase 연동 후 이용 가능합니다.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 컨트롤 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {isAdmin && (
          <div className="flex gap-1.5">
            {(["all", "mine"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === k ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {k === "all" ? "전체 직원" : "내 기록"}
              </button>
            ))}
          </div>
        )}
        <Button
          variant="secondary"
          className="h-8 gap-1.5 text-xs ml-auto"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="금일 로그인"
          value={stats.todaySuccess}
          sub={`총 ${stats.todayTotal}건 (실패 ${stats.todayTotal - stats.todaySuccess}건)`}
          icon={LogIn}
          color="border-blue-200 bg-blue-50 text-blue-900"
        />
        {isAdmin && filter === "all" && (
          <StatCard
            label="금일 접속자"
            value={stats.uniqueTodayUsers}
            sub="중복 제외 인원"
            icon={Users}
            color="border-emerald-200 bg-emerald-50 text-emerald-900"
          />
        )}
        <StatCard
          label="전체 성공"
          value={stats.success}
          sub={`총 ${stats.total}건`}
          icon={TrendingUp}
          color="border-violet-200 bg-violet-50 text-violet-900"
        />
        <StatCard
          label="전체 실패"
          value={stats.fail}
          sub={stats.total > 0 ? `실패율 ${Math.round((stats.fail / stats.total) * 100)}%` : "—"}
          icon={AlertTriangle}
          color={stats.fail > 0 ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-slate-50 text-slate-700"}
        />
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 도넛 - 성공률 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">전체 성공률</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart success={stats.success} fail={stats.fail} />
          </CardContent>
        </Card>

        {/* 최근 14일 막대 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">최근 14일 로그인 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={stats.last14} title="" />
          </CardContent>
        </Card>
      </div>

      {/* 시간대별 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">시간대별 로그인 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={stats.byHour} title="" />
        </CardContent>
      </Card>

      {/* 기록 테이블 */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            상세 기록
            <span className="ml-2 text-sm font-normal text-slate-400">{rows.length}건 (최근 500)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="py-2.5 pl-4 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">결과</th>
                  {isAdmin && filter === "all" && (
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">직원</th>
                  )}
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">일시</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">기기</th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-slate-400">
                      {loading ? "불러오는 중..." : "로그인 기록이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-slate-50/60 ${!row.success ? "bg-red-50/30" : ""}`}
                    >
                      <td className="py-3 pl-4 pr-3">
                        {row.success ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> 성공
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                            <XCircle className="h-3 w-3" /> 실패
                          </span>
                        )}
                      </td>
                      {isAdmin && filter === "all" && (
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700">{getUserName(row)}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-3 py-3 text-sm text-slate-600">{formatDate(row.created_at)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          {deviceIcon(row.user_agent)}
                          <span>{browserName(row.user_agent)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-400">{row.ip_address ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
