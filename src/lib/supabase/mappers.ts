import type {
  ApprovalDoc,
  ApprovalLineMember,
  CallLog,
  CompanyUser,
  Department,
  Task,
  TaskStatus,
} from "@/lib/types";

export type TaskRow = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  status: string;
  assignee: string | null;
  source: string | null;
  created_at: string;
};

export function rowToTask(r: TaskRow): Task {
  const status = r.status as TaskStatus;
  return {
    id: r.id,
    company_id: r.company_id,
    title: r.title,
    description: r.description ?? undefined,
    status: status === "received" || status === "progress" || status === "done" ? status : "received",
    assignee: r.assignee ?? undefined,
    source: r.source === "call" || r.source === "manual" ? r.source : undefined,
    createdAt: r.created_at,
  };
}

export type CallRow = {
  id: string;
  company_id: string;
  customer_name: string;
  phone: string;
  inquiry_type: string;
  assignee: string;
  created_at: string;
};

export function rowToCallLog(r: CallRow): CallLog {
  return {
    id: r.id,
    company_id: r.company_id,
    customerName: r.customer_name,
    phone: r.phone,
    inquiryType: r.inquiry_type,
    assignee: r.assignee,
    createdAt: r.created_at,
  };
}

export type ApprovalRow = {
  id: string;
  company_id: string;
  title: string;
  body: string | null;
  line: unknown;
  created_at: string;
};

export function rowToApprovalDoc(r: ApprovalRow): ApprovalDoc {
  const line = Array.isArray(r.line) ? (r.line as ApprovalLineMember[]) : [];
  return {
    id: r.id,
    company_id: r.company_id,
    title: r.title,
    body: r.body ?? "",
    line,
    createdAt: r.created_at,
  };
}

export type ProfileRow = {
  id: string;
  company_id: string;
  role: string;
  display_name: string | null;
  email: string | null;
};

export function rowToCompanyUser(r: ProfileRow): CompanyUser {
  return {
    id: r.id,
    company_id: r.company_id,
    name: r.display_name ?? r.email?.split("@")[0] ?? "이름 없음",
    email: r.email ?? "",
    phone: "",
    role: r.role === "admin" ? "admin" : "user",
    departmentId: null,
    departmentName: null,
    departmentColor: null,
    loginEnabled: true,
    mustChangePassword: false,
    pendingLogin: false,
    employmentStatus: "active",
    joinedAt: null,
    resignedAt: null,
  };
}

export type DepartmentRow = {
  id: string;
  company_id: string;
  name: string;
  sort_order: number;
  color?: string | null;
  permissions?: string[] | null;
};

export function rowToDepartment(r: DepartmentRow): Department {
  return {
    id: r.id,
    name: r.name,
    sortOrder: r.sort_order,
    color: r.color ?? null,
    permissions: r.permissions ?? [],
  };
}

export type IntranetAccountRow = {
  id: string;
  company_id: string;
  username: string | null;
  role: string;
  display_name: string | null;
  phone: string | null;
  login_enabled?: boolean;
  must_change_password?: boolean;
  department_id: string | null;
  employment_status?: string | null;
  joined_at?: string | null;
  resigned_at?: string | null;
  /** PostgREST embed: .select('..., department:departments(name,color)') — 배열로 올 수 있음 */
  department?: { name: string; color?: string | null } | { name: string; color?: string | null }[] | null;
};

function embedDepartment(
  dep: IntranetAccountRow["department"],
): { name: string | null; color: string | null } {
  if (dep == null) return { name: null, color: null };
  const row = Array.isArray(dep) ? dep[0] : dep;
  return {
    name: row?.name ?? null,
    color: row?.color ?? null,
  };
}

export function rowToCompanyUserFromAccount(r: IntranetAccountRow): CompanyUser {
  const uname = r.username?.trim() ?? "";
  const pending = uname.length === 0;
  const dep = embedDepartment(r.department);
  const empStatus = (r.employment_status === "leave" || r.employment_status === "resigned")
    ? r.employment_status
    : "active";
  return {
    id: r.id,
    company_id: r.company_id,
    name: r.display_name?.trim() || uname || "이름 없음",
    email: uname,
    phone: r.phone?.trim() ?? "",
    role: r.role === "admin" ? "admin" : "user",
    departmentId: r.department_id ?? null,
    departmentName: dep.name,
    departmentColor: dep.color,
    loginEnabled: r.login_enabled !== false,
    mustChangePassword: r.must_change_password === true,
    pendingLogin: pending,
    employmentStatus: empStatus,
    joinedAt: r.joined_at ?? null,
    resignedAt: r.resigned_at ?? null,
  };
}
