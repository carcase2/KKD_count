import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Building2,
  ClipboardList,
  FileSignature,
  LayoutDashboard,
  Phone,
  Settings,
  FileSpreadsheet,
  Users,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly: boolean;
};

/** 설정 페이지 위의 일반 메뉴 */
export const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard, adminOnly: false },
  { href: "/tasks", label: "업무관리", icon: ClipboardList, adminOnly: false },
  { href: "/quotation", label: "견적서", icon: FileSpreadsheet, adminOnly: false },
  { href: "/approval", label: "전자결재", icon: FileSignature, adminOnly: false },
  { href: "/calls", label: "전화접수", icon: Phone, adminOnly: false },
  { href: "/training", label: "교육자료", icon: BookOpen, adminOnly: false },
];

/** 설정 하위 아이템 (일반 / 부서 / 직원) */
export const settingsSubNavItems: NavItem[] = [
  { href: "/settings/general", label: "일반 설정", icon: Settings, adminOnly: false },
  { href: "/settings/departments", label: "부서 관리", icon: Building2, adminOnly: true },
  { href: "/settings/staff", label: "직원 관리", icon: Users, adminOnly: true },
];

export const settingsRootItem: NavItem = {
  href: "/settings/general",
  label: "설정",
  icon: Settings,
  adminOnly: false,
};

export function navItemActive(pathname: string, hash: string, href: string): boolean {
  const [path, frag] = href.split("#");
  if (pathname !== path) return false;
  if (frag) return hash === `#${frag}`;
  return !hash || hash === "";
}
