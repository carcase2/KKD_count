"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useAppState } from "@/context/app-state";
import { useHash } from "@/hooks/use-hash";
import { mainNavItems, navItemActive } from "@/components/layout/nav-config";
import { SettingsNavGroup } from "@/components/layout/settings-nav-group";

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const hash = useHash();
  const { configured, session, signOut } = useAuth();
  const { isAdmin, departments, companyUsers } = useAppState();
  
  const myUser = companyUsers.find((u) => u.id === session?.id);
  const myDept = departments.find((d) => d.id === myUser?.departmentId);
  const userPermissions = isAdmin ? undefined : myDept?.permissions ?? [];

  const visibleMain = mainNavItems.filter((i) => {
    if (isAdmin) return true;
    if (userPermissions) return userPermissions.includes(i.href);
    return false;
  });

  const handleSignOut = () => {
    void signOut().then(() => {
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-[3.75rem] items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 shadow-sm shadow-slate-900/[0.04] backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-700 transition-colors hover:bg-slate-100 active:scale-[0.97]"
          aria-label="메뉴 열기"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
            K
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">인트라넷</span>
        </div>
        <div className="flex items-center gap-0.5">
          {configured && session ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 active:scale-[0.97]"
              aria-label="로그아웃"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : null}
          <Link
            href="/notifications"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 active:scale-[0.97]"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[min(100%,20rem)] flex-col bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-3">
              <span className="text-sm font-semibold text-slate-800">메뉴</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-slate-100"
                aria-label="닫기"
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {visibleMain.map(({ href, label, icon: Icon }) => {
                  const active = navItemActive(pathname, hash, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={[
                        "flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium transition-colors",
                        active
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80"
                          : "text-slate-700 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-5 w-5 shrink-0",
                          active ? "text-blue-600" : "text-slate-400",
                        ].join(" ")}
                      />
                      {label}
                    </Link>
                  );
                })}
                <SettingsNavGroup
                  variant="mobile"
                  pathname={pathname}
                  hash={hash}
                  isAdmin={isAdmin}
                  userPermissions={userPermissions}
                  onNavigate={() => setOpen(false)}
                />
              </nav>
              {configured && session ? (
                <div className="shrink-0 border-t border-slate-100 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
