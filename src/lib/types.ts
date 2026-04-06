export const DEMO_COMPANY_ID = "demo-company-001";

export type UserRole = "admin" | "user";

export type TaskStatus = "todo" | "in_progress" | "pending" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type EmploymentStatus = "active" | "leave" | "resigned";

export interface Task {
  id: string;
  companyId: string;
  departmentId: string | null;
  createdBy: string | null;
  assigneeIds: string[];
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // UI 전용 필드 (Join 결과물)
  assigneeNames?: string[];
  departmentName?: string | null;
  commentCount?: number;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface QuotationLine {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface CallLog {
  id: string;
  company_id: string;
  customerName: string;
  phone: string;
  inquiryType: string;
  assignee: string;
  createdAt: string;
}

export type ApprovalStepRole = "draft" | "review" | "approve";

export interface ApprovalLineMember {
  role: ApprovalStepRole;
  name: string;
  status: "pending" | "approved" | "rejected";
}

export interface ApprovalDoc {
  id: string;
  company_id: string;
  title: string;
  body: string;
  line: ApprovalLineMember[];
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  sortOrder: number;
  /** 배지·표시용 (#RRGGBB). 없으면 UI 기본색 */
  color: string | null;
  /** 허용된 좌측 탭 href 배열 */
  permissions: string[];
}

export interface CompanyUser {
  id: string;
  company_id: string;
  name: string;
  /** 로그인 아이디 — 없으면 관리자 발급 대기 */
  email: string;
  phone: string;
  role: UserRole;
  departmentId: string | null;
  departmentName: string | null;
  /** 부서 색 (없으면 null, UI는 기본색) */
  departmentColor: string | null;
  /** 관리자가 로그인 허용 여부 (아이디·비밀번호 발급 후에도 끌 수 있음) */
  loginEnabled: boolean;
  mustChangePassword: boolean;
  /** 아이디 미발급 */
  pendingLogin: boolean;
  /** 재직 상태 */
  employmentStatus: EmploymentStatus;
  /** 입사일 (YYYY-MM-DD) */
  joinedAt: string | null;
  /** 퇴사일 (YYYY-MM-DD) */
  resignedAt: string | null;
}

export interface CompanyProfile {
  name: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}
