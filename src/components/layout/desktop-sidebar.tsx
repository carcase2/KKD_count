"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAppState } from "@/context/app-state";
import { useAuth } from "@/context/auth-context";
import { useHash } from "@/hooks/use-hash";
import { mainNavItems, navItemActive } from "@/components/layout/nav-config";
import { SettingsNavGroup } from "@/components/layout/settings-nav-group";

export function DesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const hash = useHash();
  const { configured, session, signOut } = useAuth();
  const { isAdmin, useDatabase, companyProfile, departments, companyUsers } = useAppState();

  const myUser = companyUsers.find((u) => u.id === session?.id);
  const myDept = departments.find((d) => d.id === myUser?.departmentId);
  const userPermissions = isAdmin ? undefined : myDept?.permissions ?? [];

  const visibleMain = mainNavItems.filter((i) => {
    if (isAdmin) return true;
    if (userPermissions) return userPermissions.includes(i.href);
    return false;
  });

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[15.5rem] lg:flex-col lg:border-r lg:border-slate-200/90 lg:bg-sidebar lg:shadow-[4px_0_24px_-8px_rgba(15,23,42,0.08)]">
      <div className="flex h-[3.75rem] items-center gap-2 border-b border-slate-100 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-600/25">
          K
        </div>
        <div className="min-w-0">
          <span className="block truncate text-sm font-bold tracking-tight text-slate-900">
            {companyProfile?.name ? `${companyProfile.name} 인트라넷` : "KKD 인트라넷"}
          </span>
          <span className="text-xs font-medium text-slate-500">업무 허브</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {visibleMain.map(({ href, label, icon: Icon }) => {
          const active = navItemActive(pathname, hash, href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.9375rem] font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              <Icon
                className={[
                  "h-[1.125rem] w-[1.125rem] shrink-0 transition-transform duration-200",
                  active ? "text-white" : "text-slate-400 group-hover:text-slate-600",
                  !active && "group-hover:scale-105",
                ].join(" ")}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
        <SettingsNavGroup variant="desktop" pathname={pathname} hash={hash} isAdmin={isAdmin} userPermissions={userPermissions} />
      </nav>
      <div className="border-t border-slate-100 p-3">
        {configured && session ? (
          <button
            type="button"
            onClick={() => {
              void signOut();
              router.push("/login");
              router.refresh();
            }}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        ) : null}
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          {useDatabase ? "Supabase · " : "데모 · "}
          <span className="font-mono text-slate-600">company_id</span> 기준
        </p>
      </div>
    </aside>
  );
}
