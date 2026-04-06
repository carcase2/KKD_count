"use client";

import type { ReactNode } from "react";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileHeader } from "./mobile-header";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-canvas">
      <DesktopSidebar />
      <MobileHeader />
      <div className="lg:pl-[15.5rem]">
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-1 lg:px-8 lg:pb-12 lg:pt-10">
          {/* 모바일: 캔버스만 · 데스크톱: 유리 느낌 패널 */}
          <div className="min-h-[50vh] py-3 lg:rounded-3xl lg:border lg:border-slate-200/80 lg:bg-white/75 lg:p-8 lg:shadow-xl lg:shadow-slate-900/[0.06] lg:backdrop-blur-md">
            {children}
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
