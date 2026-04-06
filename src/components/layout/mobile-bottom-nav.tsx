"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ClipboardList, FileSignature, Home } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "홈", icon: Home },
  { href: "/tasks", label: "업무", icon: ClipboardList },
  { href: "/approval", label: "결재", icon: FileSignature },
  { href: "/notifications", label: "알림", icon: Bell },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 gap-1 rounded-2xl border border-slate-200/90 bg-white/90 p-1.5 shadow-lg shadow-slate-900/12 ring-1 ring-white/80 backdrop-blur-md lg:hidden"
      aria-label="하단 탭"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href === "/dashboard" && pathname === "/");
        return (
          <Link
            key={href}
            href={href}
            className={[
              "flex min-h-12 min-w-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-[11px] font-semibold tracking-wide transition-all duration-200 active:scale-95",
              active
                ? "bg-gradient-to-b from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
            ].join(" ")}
          >
            <Icon className="h-[1.35rem] w-[1.35rem]" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
