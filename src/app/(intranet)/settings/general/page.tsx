"use client";

import { useState } from "react";
import { GeneralView } from "@/components/settings/general-view";
import { LoginHistoryView } from "@/components/settings/login-history-view";

const TABS = [
  { key: "general", label: "일반 설정" },
  { key: "login-history", label: "로그인 기록" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function SettingsGeneralPage() {
  const [tab, setTab] = useState<Tab>("general");

  return (
    <div className="space-y-0">
      {/* 상단 탭 */}
      <div className="mb-6 flex gap-0.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 w-fit shadow-sm">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
              tab === key
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralView />}
      {tab === "login-history" && <LoginHistoryView />}
    </div>
  );
}
