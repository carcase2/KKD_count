"use client";

import { useState, useMemo } from "react";
import {
  Search, ChevronDown, UserCheck, UserX, UserMinus,
  Shield, Clock, X, Users,
} from "lucide-react";
import { useAppState } from "@/context/app-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StaffAdminTools } from "@/components/settings/staff-admin-tools";
import { formatKoreanMobileInput } from "@/lib/phone-format";
import { FALLBACK_DEPARTMENT_COLOR } from "@/lib/department-color";
import type { CompanyUser, EmploymentStatus } from "@/lib/types";

type FilterStatus = "all" | EmploymentStatus | "pending";

const STATUS_CFG: Record<EmploymentStatus, { label: string; pill: string; icon: typeof UserCheck }> = {
  active: { label: "재직", pill: "bg-emerald-100 text-emerald-700 ring-emerald-200", icon: UserCheck },
  leave: { label: "휴직", pill: "bg-amber-100 text-amber-700 ring-amber-200", icon: UserMinus },
  resigned: { label: "퇴직", pill: "bg-slate-100 text-slate-500 ring-slate-200", icon: UserX },
};

function Pill({ status }: { status: EmploymentStatus }) {
  const { label, pill, icon: Icon } = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${pill}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

// ─── 편집 패널 ────────────────────────────────────────────
const STATUS_THEME: Record<EmploymentStatus, { bg: string; border: string; label: string }> = {
  active: { bg: "bg-emerald-50", border: "border-emerald-200", label: "재직" },
  leave: { bg: "bg-amber-50", border: "border-amber-200", label: "휴직" },
  resigned: { bg: "bg-slate-100", border: "border-slate-300", label: "퇴직" },
};

function EditPanel({ user, onClose }: { user: CompanyUser; onClose: () => void }) {
  const { useDatabase, updateUser, departments, reloadCompanyData } = useAppState();
  const empStatus = user.employmentStatus ?? "active";
  const theme = STATUS_THEME[empStatus];

  return (
    <div className={`border-t ${theme.border} ${theme.bg} px-5 py-5 transition-colors`}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{user.name} 편집</p>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-white/60">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {/* 이름 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">이름</span>
          <Input className="h-8 bg-white text-sm" value={user.name} onChange={(e) => void updateUser(user.id, { name: e.target.value })} />
        </label>

        {/* 아이디 */}
        {!user.pendingLogin && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">아이디</span>
            <Input className="h-8 bg-white text-sm" value={user.email} onChange={(e) => void updateUser(user.id, { email: e.target.value })} />
          </label>
        )}

        {/* 전화번호 */}
        {useDatabase && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">전화번호</span>
            <Input className="h-8 bg-white text-sm" type="tel" inputMode="numeric" value={user.phone}
              onChange={(e) => void updateUser(user.id, { phone: formatKoreanMobileInput(e.target.value) })} placeholder="010-0000-0000" />
          </label>
        )}

        {/* 부서 */}
        {useDatabase && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">부서</span>
            <select value={user.departmentId ?? ""} onChange={(e) => void updateUser(user.id, { departmentId: e.target.value || null })}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-sm shadow-sm focus:outline-none focus:border-blue-500">
              <option value="">— 없음</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
        )}

        {/* 입사일 */}
        {useDatabase && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">입사일</span>
            <input type="date" value={user.joinedAt ?? ""} onChange={(e) => void updateUser(user.id, { joinedAt: e.target.value || null })}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-sm shadow-sm focus:outline-none focus:border-blue-500" />
          </label>
        )}

        {/* 퇴사일 */}
        {useDatabase && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">퇴사일</span>
            <input type="date" value={user.resignedAt ?? ""} onChange={(e) => void updateUser(user.id, { resignedAt: e.target.value || null })}
              className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-sm shadow-sm focus:outline-none focus:border-blue-500" />
          </label>
        )}
      </div>

      {/* 권한 + 재직 상태 버튼그룹 */}
      <div className="mt-4 flex flex-wrap gap-6">
        {/* 권한 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">권한</span>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            {(["user", "admin"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => void updateUser(user.id, { role: r })}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-all ${
                  user.role === r
                    ? r === "admin"
                      ? "bg-blue-600 text-white shadow-inner"
                      : "bg-slate-700 text-white shadow-inner"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {r === "admin" ? <Shield className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                {r === "admin" ? "관리자" : "일반직원"}
              </button>
            ))}
          </div>
        </div>

        {/* 재직 상태 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">재직 상태</span>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
            {([
              { val: "active" as EmploymentStatus, label: "재직", active: "bg-emerald-500 text-white", icon: UserCheck },
              { val: "leave" as EmploymentStatus, label: "휴직", active: "bg-amber-500 text-white", icon: UserMinus },
              { val: "resigned" as EmploymentStatus, label: "퇴직", active: "bg-slate-500 text-white", icon: UserX },
            ]).map(({ val, label, active, icon: Icon }) => (
              <button
                key={val}
                type="button"
                onClick={() => void updateUser(user.id, { employmentStatus: val })}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold transition-all ${
                  empStatus === val ? active + " shadow-inner" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 계정 관리 */}
      {useDatabase && (
        <div className="mt-4 border-t border-slate-200/60 pt-4">
          <StaffAdminTools user={user} onDone={() => { onClose(); void reloadCompanyData(); }} />
        </div>
      )}
    </div>
  );
}

const CARD_THEME: Record<EmploymentStatus, { border: string; bg: string; ring: string }> = {
  active: { border: "border-slate-200", bg: "bg-white", ring: "ring-emerald-100 border-emerald-300" },
  leave: { border: "border-amber-200", bg: "bg-amber-50/40", ring: "ring-amber-100 border-amber-300" },
  resigned: { border: "border-slate-200", bg: "bg-slate-50", ring: "ring-slate-200 border-slate-300" },
};

function StaffCard({ user, expanded, onToggle }: {
  user: CompanyUser;
  expanded: boolean;
  onToggle: () => void;
}) {
  const empStatus = user.employmentStatus ?? "active";
  const isResigned = empStatus === "resigned";
  const theme = CARD_THEME[empStatus];

  return (
    <div className={`rounded-xl border transition-all ${
      expanded
        ? `ring-1 ${theme.ring}`
        : `${theme.border} ${theme.bg} hover:border-slate-300 hover:shadow-sm`
    } ${isResigned ? "opacity-55" : ""}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {/* 아바타 */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: user.departmentColor ?? FALLBACK_DEPARTMENT_COLOR }}
        >
          {user.name.charAt(0)}
        </div>

        {/* 이름 + 아이디 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-slate-900 text-sm">{user.name}</span>
            {user.role === "admin" && (
              <Shield className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            )}
            {user.pendingLogin && (
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            )}
          </div>
          <p className="truncate text-[11px] text-slate-400">
            {user.pendingLogin ? "발급 대기" : user.email || "—"}
            {user.phone ? ` · ${user.phone}` : ""}
          </p>
        </div>

        {/* 상태 배지 */}
        <div className="shrink-0">
          <Pill status={empStatus} />
        </div>

        {/* 입사일 */}
        {user.joinedAt && (
          <div className="hidden shrink-0 text-[11px] text-slate-400 sm:block">
            {user.joinedAt}
          </div>
        )}

        {/* 펼침 화살표 */}
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-300 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {expanded && <EditPanel user={user} onClose={onToggle} />}
    </div>
  );
}

// ─── 부서 그룹 섹션 ────────────────────────────────────────
function DeptGroup({
  deptName,
  deptColor,
  users,
  expandedId,
  onToggle,
}: {
  deptName: string;
  deptColor: string | null;
  users: CompanyUser[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* 그룹 헤더 */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-3 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white shadow"
          style={{ backgroundColor: deptColor ?? FALLBACK_DEPARTMENT_COLOR }}
        />
        <span className="flex-1 font-semibold text-sm text-slate-800">{deptName}</span>
        <span className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
          <Users className="h-3 w-3" />
          {users.length}명
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${collapsed ? "-rotate-90" : ""}`} />
      </button>

      {/* 직원 목록 */}
      {!collapsed && (
        <div className="divide-y divide-slate-100 bg-white">
          {users.map((u) => (
            <StaffCard
              key={u.id}
              user={u}
              expanded={expandedId === u.id}
              onToggle={() => onToggle(u.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 메인 뷰 ───────────────────────────────────────────────
export function StaffView() {
  const { useDatabase, isAdmin, companyUsers, departments, reloadCompanyData } = useAppState();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="직원 관리" description="직원은 관리자(사장) 계정에서만 관리할 수 있습니다." />
      </div>
    );
  }

  const counts = useMemo(() => ({
    all: companyUsers.length,
    active: companyUsers.filter((u) => (u.employmentStatus ?? "active") === "active").length,
    leave: companyUsers.filter((u) => u.employmentStatus === "leave").length,
    resigned: companyUsers.filter((u) => u.employmentStatus === "resigned").length,
    pending: companyUsers.filter((u) => u.pendingLogin).length,
  }), [companyUsers]);

  const TAB_ITEMS: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "전체", count: counts.all },
    { key: "active", label: "재직", count: counts.active },
    { key: "leave", label: "휴직", count: counts.leave },
    { key: "resigned", label: "퇴직", count: counts.resigned },
    { key: "pending", label: "발급 대기", count: counts.pending },
  ];

  const filtered = useMemo(() => {
    let list = companyUsers;
    if (filterStatus === "pending") list = list.filter((u) => u.pendingLogin);
    else if (filterStatus !== "all")
      list = list.filter((u) => (u.employmentStatus ?? "active") === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.departmentName ?? "").toLowerCase().includes(q) ||
          u.phone.includes(q),
      );
    }
    return list;
  }, [companyUsers, filterStatus, search]);

  // 부서별 그룹핑
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null; users: CompanyUser[] }>();

    // 부서 순서대로 초기화
    for (const d of departments) {
      map.set(d.id, { name: d.name, color: d.color, users: [] });
    }
    // 부서 없는 그룹
    map.set("__none__", { name: "부서 미배정", color: null, users: [] });

    for (const u of filtered) {
      const key = u.departmentId ?? "__none__";
      if (!map.has(key)) map.set(key, { name: u.departmentName ?? "기타", color: u.departmentColor, users: [] });
      map.get(key)!.users.push(u);
    }

    return [...map.entries()]
      .filter(([, g]) => g.users.length > 0)
      .map(([key, g]) => ({ key, ...g }));
  }, [filtered, departments]);

  const handleToggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="직원 관리"
        description="부서별로 그룹화된 직원 목록입니다. 카드를 클릭하면 상세 편집이 열립니다."
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              직원 목록
              <span className="ml-2 text-sm font-normal text-slate-400">{filtered.length}명</span>
            </CardTitle>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 pl-9"
                placeholder="이름 / 아이디 / 부서 검색"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setExpandedId(null); }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {TAB_ITEMS.map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setFilterStatus(key); setExpandedId(null); }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterStatus === key ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
                <span className={`min-w-[18px] rounded-full text-center text-[10px] font-bold ${
                  filterStatus === key ? "bg-white/20 text-white" : "bg-white text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">
              {search ? "검색 결과가 없습니다." : "직원이 없습니다."}
            </p>
          ) : (
            groups.map(({ key, name, color, users }) => (
              <DeptGroup
                key={key}
                deptName={name}
                deptColor={color}
                users={users}
                expandedId={expandedId}
                onToggle={handleToggle}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
