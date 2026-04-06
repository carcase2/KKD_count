"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { navItemActive, settingsRootItem, settingsSubNavItems } from "@/components/layout/nav-config";

type Variant = "mobile" | "desktop";

type Props = {
  variant: Variant;
  pathname: string;
  hash: string;
  isAdmin: boolean;
  userPermissions?: string[];
  onNavigate?: () => void;
};

export function SettingsNavGroup({ variant, pathname, hash, isAdmin, userPermissions, onNavigate }: Props) {
  const router = useRouter();

  // 모든 설정 경로 목록
  const allSettingsHrefs = [settingsRootItem.href, ...settingsSubNavItems.map((i) => i.href)];

  // 비관리자이고 권한 배열이 있을 때 → 설정 관련 경로가 하나도 없으면 전체 숨김
  if (!isAdmin && userPermissions !== undefined) {
    const hasAnySettingsPermission = allSettingsHrefs.some((href) =>
      userPermissions.includes(href),
    );
    if (!hasAnySettingsPermission) return null;
  }

  const subVisible = settingsSubNavItems.filter((i) => {
    if (isAdmin) return true;
    if (userPermissions) return userPermissions.includes(i.href);
    return false;
  });
  const rootActive = navItemActive(pathname, hash, settingsRootItem.href);
  const RootIcon = settingsRootItem.icon;

  const linkBase =
    variant === "mobile"
      ? "flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium transition-colors"
      : "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium transition-all duration-200";

  const rootClasses = [
    linkBase,
    rootActive
      ? variant === "mobile"
        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80"
        : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
      : variant === "mobile"
        ? "text-slate-700 hover:bg-slate-50"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

  const iconClassRoot = (active: boolean) =>
    [
      variant === "mobile" ? "h-5 w-5" : "h-[1.125rem] w-[1.125rem]",
      "shrink-0",
      variant === "mobile"
        ? active
          ? "text-blue-600"
          : "text-slate-400"
        : active
          ? "text-white"
          : "text-slate-400 group-hover:text-slate-600 group-hover:scale-105",
    ].join(" ");

  const subLinkBase =
    variant === "mobile"
      ? "flex items-center gap-3 rounded-lg py-2.5 pl-2 pr-3 text-[0.9375rem] font-medium transition-colors"
      : "group flex items-center gap-3 rounded-lg py-2 pl-2 pr-3 text-[0.8125rem] font-medium transition-all duration-200";

  return (
    <div
      className={
        variant === "mobile"
          ? "mt-2 border-t border-slate-100 pt-2"
          : "mt-1 border-t border-slate-100/80 pt-2"
      }
    >
      <Link
        href={settingsRootItem.href}
        onClick={onNavigate}
        className={rootClasses}
        aria-current={rootActive ? "page" : undefined}
      >
        <RootIcon className={iconClassRoot(rootActive)} aria-hidden />
        {settingsRootItem.label}
      </Link>
      {subVisible.length > 0 ? (
        <ul
          className={
            variant === "mobile"
              ? "ml-3 mt-1.5 flex flex-col gap-0.5 border-l-2 border-slate-200 pl-3"
              : "ml-3 mt-1.5 flex flex-col gap-0.5 border-l-2 border-slate-200/90 pl-3"
          }
          role="list"
          aria-label="설정 메뉴"
        >
        {subVisible.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          const subClasses = [
            subLinkBase,
            active
              ? variant === "mobile"
                ? "bg-blue-50/90 text-blue-700 ring-1 ring-blue-100"
                : "bg-slate-100 text-blue-700 ring-1 ring-slate-200/80"
              : variant === "mobile"
                ? "text-slate-600 hover:bg-slate-50"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
          ].join(" ");
          const iconSub = [
            variant === "mobile" ? "h-4 w-4" : "h-3.5 w-3.5",
            "shrink-0",
            active
              ? "text-blue-600"
              : variant === "mobile"
                ? "text-slate-400"
                : "text-slate-400 group-hover:text-slate-500",
          ].join(" ");
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={subClasses}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={iconSub} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        </ul>
      ) : null}
    </div>
  );
}
