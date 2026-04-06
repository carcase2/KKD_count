"use client";

import { BarChart, Card as TremorCard, DonutChart, Title } from "@tremor/react";
import { ClipboardList, FileSignature, Phone, Sparkles, TrendingUp } from "lucide-react";
import { useAppState } from "@/context/app-state";
import { quotationLast7Days, taskStatusCounts } from "@/lib/mock-data";
import { CardContent, CardHeader, CardTitle, Card as UiCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

function formatWon(n: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);
}

const statStyles = [
  {
    iconWrap: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30",
    accent: "from-blue-500/0 via-blue-500/0 to-blue-500/[0.07]",
  },
  {
    iconWrap: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25",
    accent: "from-amber-500/0 to-amber-500/[0.08]",
  },
  {
    iconWrap: "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25",
    accent: "from-violet-500/0 to-violet-500/[0.07]",
  },
  {
    iconWrap: "bg-gradient-to-br from-sky-400 to-cyan-600 text-white shadow-lg shadow-sky-500/25",
    accent: "from-sky-500/0 to-sky-500/[0.07]",
  },
] as const;

export function DashboardView() {
  const {
    todaySales,
    tasks,
    pendingApprovalCount,
    newCallsTodayCount,
    isAdmin,
  } = useAppState();

  const unhandledTasks = tasks.filter((t) => t.status !== "done").length;
  const donutData = taskStatusCounts(tasks);

  const barData = quotationLast7Days.map((d) => ({
    날짜: d.date,
    견적금액: d.amount,
  }));

  const stats = [
    {
      label: "금일 매출(견적 합계)",
      value: formatWon(todaySales),
      icon: TrendingUp,
    },
    { label: "미처리 업무", value: `${unhandledTasks}건`, icon: ClipboardList },
    { label: "결재 대기", value: `${pendingApprovalCount}건`, icon: FileSignature },
    { label: "신규 전화 접수(오늘)", value: `${newCallsTodayCount}건`, icon: Phone },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="대시보드"
        description={
          <>
            오늘의 매출·업무·결재·접수를 한눈에 확인하세요.
            {isAdmin ? " 관리자 전용 안내가 하단에 표시됩니다." : ""}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const st = statStyles[i % statStyles.length];
          return (
            <UiCard
              key={s.label}
              className="group relative overflow-hidden border-slate-200/80 hover:border-slate-300/90"
            >
              <div
                className={[
                  "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 transition-opacity duration-300 group-hover:opacity-100",
                  st.accent,
                ].join(" ")}
              />
              <CardContent className="relative flex items-start gap-4 pt-5">
                <div
                  className={[
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                    st.iconWrap,
                  ].join(" ")}
                >
                  <Icon className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500">{s.label}</p>
                  <p className="mt-1 truncate text-xl font-bold tabular-nums tracking-tight text-slate-900">
                    {s.value}
                  </p>
                </div>
              </CardContent>
            </UiCard>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TremorCard className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.05] ring-0">
          <Title className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 text-base font-semibold text-slate-800">
            최근 7일 견적 발행 금액
          </Title>
          <div className="px-2 pb-5 pt-2">
            <BarChart
              className="mt-1 h-72"
              data={barData}
              index="날짜"
              categories={["견적금액"]}
              colors={["blue"]}
              valueFormatter={formatWon}
              yAxisWidth={56}
            />
          </div>
        </TremorCard>

        <TremorCard className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.05] ring-0">
          <Title className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 text-base font-semibold text-slate-800">
            업무 처리 상태 비율
          </Title>
          <div className="flex justify-center px-2 pb-8 pt-4">
            <DonutChart
              className="h-52 w-full"
              data={donutData}
              category="value"
              index="name"
              colors={["amber", "blue", "emerald"]}
              valueFormatter={(v) => `${v}건`}
            />
          </div>
        </TremorCard>
      </div>

      {isAdmin ? (
        <UiCard className="border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-indigo-50/40">
          <CardHeader className="border-blue-100/80">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-slate-900">관리자 안내</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-base leading-relaxed text-slate-600">
            직원 관리·텔레그램 설정은 사이드바의 「직원 관리」「설정」에서 열 수 있습니다. 모든 데이터는{" "}
            <code className="rounded-lg bg-white/80 px-2 py-0.5 font-mono text-sm text-blue-800 ring-1 ring-blue-200/60">
              company_id
            </code>{" "}
            기준 멀티테넌시 데모입니다.
          </CardContent>
        </UiCard>
      ) : null}
    </div>
  );
}
