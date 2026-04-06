"use client";

import { useState, useEffect } from "react";
import { useAppState } from "@/context/app-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  FALLBACK_DEPARTMENT_COLOR,
  pickNewDepartmentColor,
} from "@/lib/department-color";
import { mainNavItems, settingsSubNavItems } from "@/components/layout/nav-config";

export function DepartmentsView() {
  const {
    useDatabase,
    isAdmin,
    departments,
    addDepartment,
    updateDepartment,
    removeDepartment,
  } = useAppState();

  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptColor, setNewDeptColor] = useState(() => pickNewDepartmentColor(0));

  if (!isAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="부서 관리" description="부서는 관리자(사장) 계정에서만 관리할 수 있습니다." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="부서 관리"
        description="조직의 부서를 추가, 수정, 삭제합니다."
      />

      <Card>
        <CardHeader>
          <CardTitle>부서 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!useDatabase ? (
            <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-950 ring-1 ring-amber-200/80">
              Supabase에 연동된 뒤에 부서를 추가·수정할 수 있습니다.
            </p>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                부서를 추가, 이름 및 색상을 수정할 수 있습니다. 삭제 시 해당 직원의 부서는 비워집니다.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">새 부서 이름</Label>
                  <Input
                    className="h-10 max-w-xs"
                    placeholder="예: 영업팀"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">표시 색</Label>
                  <div className="flex h-10 items-center gap-2">
                    <input
                      type="color"
                      value={newDeptColor}
                      onChange={(e) => setNewDeptColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 shadow-sm"
                      aria-label="새 부서 색"
                    />
                    <span className="font-mono text-xs text-slate-500">{newDeptColor}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10"
                  onClick={() => {
                    const idx = departments.length;
                    if (!newDeptName.trim()) return;
                    void addDepartment(newDeptName, newDeptColor).then((ok) => {
                      if (!ok) return;
                      setNewDeptName("");
                      setNewDeptColor(pickNewDepartmentColor(idx + 1));
                    });
                  }}
                >
                  부서 추가
                </Button>
              </div>
              <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full min-w-max text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-800">부서명</th>
                      <th className="px-4 py-3 font-semibold text-slate-800">색상</th>
                      {[...mainNavItems, ...settingsSubNavItems].map((item) => (
                        <th key={item.href} className="px-3 py-3 font-medium text-slate-700 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <item.icon className="h-4 w-4 text-slate-400" />
                            <span className="text-[11px] leading-tight">{item.label}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold text-slate-800 text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {departments.map((d) => (
                      <DepartmentMatrixRow
                        key={d.id}
                        id={d.id}
                        initialName={d.name}
                        initialColor={d.color}
                        initialPermissions={d.permissions}
                        onSave={updateDepartment}
                        onRemove={removeDepartment}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DepartmentMatrixRow({
  id,
  initialName,
  initialColor,
  initialPermissions,
  onSave,
  onRemove,
}: {
  id: string;
  initialName: string;
  initialColor: string | null;
  initialPermissions: string[];
  onSave: (id: string, fields: { name: string; color: string | null; permissions?: string[] }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(() => initialColor ?? FALLBACK_DEPARTMENT_COLOR);
  const [permissions, setPermissions] = useState<string[]>(initialPermissions);
  
  useEffect(() => {
    setName(initialName);
  }, [initialName]);
  useEffect(() => {
    setColor(initialColor ?? FALLBACK_DEPARTMENT_COLOR);
  }, [initialColor]);
  useEffect(() => {
    setPermissions(initialPermissions);
  }, [initialPermissions]);
  
  const allNavItems = [...mainNavItems, ...settingsSubNavItems];

  const handleTogglePermission = (href: string) => {
    setPermissions((prev) =>
      prev.includes(href) ? prev.filter((p) => p !== href) : [...prev, href]
    );
  };

  const isModified = 
    name !== initialName || 
    color !== (initialColor ?? FALLBACK_DEPARTMENT_COLOR) || 
    JSON.stringify(permissions.sort()) !== JSON.stringify(initialPermissions.sort());

  return (
    <tr className="hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3">
        <Input
          className="h-8 w-28 min-w-[100px] text-sm font-medium"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </td>
      <td className="px-4 py-3">
        <label className="flex h-8 w-14 items-center justify-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1 cursor-pointer hover:bg-slate-100 transition-colors">
          <span
            className="h-3 w-3 rounded-full ring-1 ring-slate-300"
            style={{ backgroundColor: color }}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="sr-only"
          />
        </label>
      </td>
      
      {allNavItems.map((item) => {
        const checked = permissions.includes(item.href);
        const locked = initialName === "관리부서";
        return (
          <td key={item.href} className="px-3 py-3 text-center align-middle">
            <div className={`inline-flex items-center justify-center rounded-md p-1 ${checked && !locked ? 'bg-blue-50 text-blue-600' : ''}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleTogglePermission(item.href)}
                disabled={locked}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title={locked ? "관리부서는 고정 권한입니다" : item.label}
              />
            </div>
          </td>
        );
      })}

      <td className="px-4 py-3 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <Button
            type="button"
            className={`h-8 px-3 text-xs ${isModified ? 'bg-blue-600 text-white hover:bg-blue-700 font-bold' : ''}`}
            variant={isModified ? 'primary' : 'secondary'}
            onClick={() => void onSave(id, { name, color, permissions })}
            disabled={!isModified && !!id}
          >
            저장
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => void onRemove(id)}
            disabled={initialName === "관리부서"}
            title={initialName === "관리부서" ? "삭제 불가" : "삭제"}
          >
            삭제
          </Button>
        </div>
      </td>
    </tr>
  );
}
