"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  initialApprovals,
  initialCallLogs,
  initialCompanyUsers,
  initialTasks,
  quotationLast7Days,
} from "@/lib/mock-data";
import {
  rowToApprovalDoc,
  rowToCallLog,
  rowToCompanyUserFromAccount,
  rowToDepartment,
  rowToTask,
  rowToTaskComment,
} from "@/lib/supabase/mappers";
import type {
  ApprovalRow,
  CallRow,
  DepartmentRow,
  IntranetAccountRow,
  TaskRow,
  TaskCommentRow,
} from "@/lib/supabase/mappers";
import type {
  ApprovalDoc,
  AppNotification,
  CallLog,
  CompanyProfile,
  CompanyUser,
  Department,
  Task,
  TaskStatus,
  TaskPriority,
  TaskComment,
  UserRole,
} from "@/lib/types";
import { DEMO_COMPANY_ID } from "@/lib/types";
import {
  normalizeDepartmentColor,
  pickNewDepartmentColor,
} from "@/lib/department-color";

type TelegramSettings = { botToken: string; channelId: string };

type AppStateValue = {
  useDatabase: boolean;
  role: UserRole;
  setRole: (r: UserRole) => void;
  isAdmin: boolean;
  session: any | null;
  tasks: Task[];
  addTask: (
    t: Omit<Task, "id" | "companyId" | "createdAt" | "updatedAt">,
  ) => Promise<boolean>;
  updateTask: (taskId: string, patch: Partial<Task>) => Promise<void>;
  moveTask: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getTaskComments: (taskId: string) => Promise<TaskComment[]>;
  addTaskComment: (taskId: string, content: string) => Promise<void>;
  deleteTaskComment: (commentId: string) => Promise<void>;
  callLogs: CallLog[];
  addCallLog: (c: Omit<CallLog, "id" | "company_id" | "createdAt">) => void;
  approvals: ApprovalDoc[];
  addApproval: (a: Omit<ApprovalDoc, "id" | "company_id" | "createdAt">) => void;
  approveDoc: (id: string) => void;
  rejectDoc: (id: string) => void;
  companyUsers: CompanyUser[];
  updateUser: (
    id: string,
    patch: Partial<Pick<CompanyUser, "name" | "email" | "phone" | "role" | "departmentId" | "employmentStatus" | "joinedAt" | "resignedAt">>,
  ) => void;
  removeUser: (id: string) => Promise<void>;
  companyProfile: CompanyProfile | null;
  updateCompanyProfile: (name: string) => Promise<void>;
  departments: Department[];
  addDepartment: (name: string, color?: string | null) => Promise<boolean>;
  updateDepartment: (id: string, fields: { name: string; color: string | null; permissions?: string[] }) => Promise<void>;
  removeDepartment: (id: string) => Promise<void>;
  /** 직원·부서 등 Supabase 직원 목록 다시 로드 */
  reloadCompanyData: () => Promise<void>;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
  markAllNotificationsRead: () => void;
  telegram: TelegramSettings;
  setTelegram: (t: TelegramSettings) => void;
  persistTelegram: () => Promise<void>;
  todaySales: number;
  pendingApprovalCount: number;
  newCallsTodayCount: number;
};

const AppStateContext = createContext<AppStateValue | null>(null);

const ROLE_KEY = "intranet-demo-role";
const TG_KEY = "intranet-demo-telegram";

function randomId() {
  return Math.random().toString(36).slice(2, 11);
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { configured, supabase, session, refreshSession } = useAuth();
  const useDatabase = Boolean(configured && supabase && session?.company_id);
  const companyId = session?.company_id ?? DEMO_COMPANY_ID;

  const [demoRole, setDemoRole] = useState<UserRole>("admin");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [callLogs, setCallLogs] = useState<CallLog[]>(initialCallLogs);
  const [approvals, setApprovals] = useState<ApprovalDoc[]>(initialApprovals);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>(initialCompanyUsers);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [telegram, setTelegramState] = useState<TelegramSettings>({
    botToken: "",
    channelId: "",
  });

  const role: UserRole = useDatabase ? (session?.role === "admin" ? "admin" : "user") : demoRole;
  const isAdmin = role === "admin";

  useEffect(() => {
    if (useDatabase) return;
    queueMicrotask(() => {
      try {
        const r = localStorage.getItem(ROLE_KEY) as UserRole | null;
        if (r === "admin" || r === "user") setDemoRole(r);
        const tg = localStorage.getItem(TG_KEY);
        if (tg) setTelegramState(JSON.parse(tg) as TelegramSettings);
      } catch {
        /* ignore */
      }
    });
  }, [useDatabase]);

  const reloadFromSupabase = useCallback(async () => {
    if (!supabase || !session?.company_id) return;
    const cid = session.company_id;

    const [tRes, cRes, aRes, pRes, sRes, dRes, coRes] = await Promise.all([
      supabase
        .from("tasks")
        .select(`
          *,
          task_assignments(
            account_id,
            intranet_accounts(display_name)
          ),
          department:departments(name),
          comment_count:task_comments(count)
        `)
        .eq("company_id", cid)
        .order("created_at", { ascending: false }),
      supabase.from("call_logs").select("*").eq("company_id", cid).order("created_at", { ascending: false }),
      supabase.from("approval_documents").select("*").eq("company_id", cid).order("created_at", { ascending: false }),
      supabase
        .from("intranet_accounts")
        .select(
          "id, company_id, username, role, display_name, phone, login_enabled, must_change_password, department_id, employment_status, joined_at, resigned_at, department:departments(name,color)",
        )
        .eq("company_id", cid),
      supabase.from("company_settings").select("*").eq("company_id", cid).maybeSingle(),
      supabase.from("departments").select("*").eq("company_id", cid).order("sort_order", { ascending: true }),
      supabase.from("companies").select("name").eq("id", cid).maybeSingle(),
    ]);

    if (tRes.data) setTasks(tRes.data.map((r) => rowToTask(r as TaskRow)));
    if (cRes.data) setCallLogs(cRes.data.map((r) => rowToCallLog(r as CallRow)));
    if (aRes.data) setApprovals(aRes.data.map((r) => rowToApprovalDoc(r as ApprovalRow)));
    if (pRes.data) {
      setCompanyUsers(pRes.data.map((r) => rowToCompanyUserFromAccount(r as IntranetAccountRow)));
    }
    if (dRes.data) {
      setDepartments(dRes.data.map((r) => rowToDepartment(r as DepartmentRow)));
    } else if (dRes.error) {
      setDepartments([]);
    }
    if (coRes.data) {
      setCompanyProfile({ name: coRes.data.name ?? "" });
    } else {
      setCompanyProfile(null);
    }

    if (sRes.data) {
      setTelegramState({
        botToken: sRes.data.telegram_bot_token ?? "",
        channelId: sRes.data.telegram_channel_id ?? "",
      });
    }
  }, [supabase, session]);

  const reloadCompanyData = useCallback(async () => {
    await reloadFromSupabase();
  }, [reloadFromSupabase]);

  useEffect(() => {
    queueMicrotask(() => {
      if (!useDatabase) {
        setTasks(initialTasks);
        setCallLogs(initialCallLogs);
        setApprovals(initialApprovals);
        setCompanyUsers(initialCompanyUsers);
        setDepartments([]);
        setCompanyProfile(null);
        return;
      }
      setTasks([]);
      setCallLogs([]);
      setApprovals([]);
      setCompanyUsers([]);
      setDepartments([]);
      setCompanyProfile(null);
      void reloadFromSupabase();
    });
  }, [useDatabase, reloadFromSupabase]);

  const setRole = useCallback(
    (r: UserRole) => {
      if (useDatabase) {
        toast.message("DB 연동 중에는 역할이 intranet_accounts.role 에서 결정됩니다.");
        return;
      }
      setDemoRole(r);
      try {
        localStorage.setItem(ROLE_KEY, r);
      } catch {
        /* ignore */
      }
    },
    [useDatabase],
  );

  const setTelegram = useCallback((t: TelegramSettings) => {
    setTelegramState(t);
    if (useDatabase) return;
    try {
      localStorage.setItem(TG_KEY, JSON.stringify(t));
    } catch {
      /* ignore */
    }
  }, [useDatabase]);

  const persistTelegram = useCallback(async () => {
    if (!useDatabase) {
      toast.message("데모 모드: 브라우저 저장만 사용됩니다.");
      return;
    }
    if (!supabase || !session?.company_id) return;
    const { error } = await supabase.from("company_settings").upsert({
      company_id: session.company_id,
      telegram_bot_token: telegram.botToken,
      telegram_channel_id: telegram.channelId,
      updated_at: new Date().toISOString(),
    });
    if (error) toast.error(error.message);
    else toast.success("텔레그램 설정을 저장했습니다.");
  }, [useDatabase, supabase, session, telegram]);

  const addTask = useCallback(
    async (
      t: Omit<Task, "id" | "companyId" | "createdAt" | "updatedAt">,
    ) => {
      if (!useDatabase || !supabase || !session?.id) {
        const task: Task = {
          ...t,
          id: randomId(),
          companyId: companyId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "demo-user",
        };
        setTasks((prev) => [task, ...prev]);
        return true;
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          company_id: companyId,
          department_id: t.departmentId,
          created_by: session.id,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          due_date: t.dueDate,
        })
        .select(`
          *,
          department:departments(name),
          comment_count:task_comments(count)
        `)
        .single();

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (t.assigneeIds && t.assigneeIds.length > 0) {
        await supabase.from("task_assignments").insert(
          t.assigneeIds.map((uid) => ({
            task_id: data.id,
            account_id: uid,
          })),
        );
      }

      await reloadFromSupabase();
      toast.success("업무가 등록되었습니다.");
      return true;
    },
    [useDatabase, supabase, session, companyId, reloadFromSupabase],
  );

  const updateTask = useCallback(
    async (taskId: string, patch: Partial<Task>) => {
      if (!useDatabase || !supabase) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
        );
        return;
      }

      const { assigneeIds, ...rest } = patch;
      const dbPatch: any = {};
      if (rest.title !== undefined) dbPatch.title = rest.title;
      if (rest.description !== undefined) dbPatch.description = rest.description;
      if (rest.status !== undefined) dbPatch.status = rest.status;
      if (rest.priority !== undefined) dbPatch.priority = rest.priority;
      if (rest.dueDate !== undefined) dbPatch.due_date = rest.dueDate;
      if (rest.departmentId !== undefined) dbPatch.department_id = rest.departmentId;

      if (Object.keys(dbPatch).length > 0) {
        const { error } = await supabase
          .from("tasks")
          .update(dbPatch)
          .eq("id", taskId);
        if (error) {
          toast.error("업무 정보를 수정하지 못했습니다: " + error.message);
          return;
        }
      }

      if (assigneeIds !== undefined) {
        // 기존 담당자 삭제 후 다시 삽입
        await supabase.from("task_assignments").delete().eq("task_id", taskId);
        if (assigneeIds.length > 0) {
          const { error: assignError } = await supabase
            .from("task_assignments")
            .insert(assigneeIds.map(uid => ({ task_id: taskId, account_id: uid })));
          if (assignError) {
            toast.error("담당자 정보를 수정하지 못했습니다: " + assignError.message);
            return;
          }
        }
      }

      await reloadFromSupabase();
      toast.success("업무가 수정되었습니다.");
    },
    [useDatabase, supabase, reloadFromSupabase],
  );

  const moveTask = useCallback(
    async (taskId: string, status: TaskStatus) => {
      if (!useDatabase || !supabase) {
        setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, status } : x)));
        return;
      }
      const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
      if (error) {
        toast.error(error.message);
        return;
      }
      setTasks((prev) => prev.map((x) => (x.id === taskId ? { ...x, status } : x)));
    },
    [useDatabase, supabase],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!useDatabase || !supabase) {
        setTasks((prev) => prev.filter((x) => x.id !== taskId));
        return;
      }
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) {
        toast.error(error.message);
        return;
      }
      setTasks((prev) => prev.filter((x) => x.id !== taskId));
      toast.success("업무가 삭제되었습니다.");
    },
    [useDatabase, supabase],
  );

  const getTaskComments = useCallback(
    async (taskId: string): Promise<TaskComment[]> => {
      if (!useDatabase || !supabase) return [];
      const { data, error } = await supabase
        .from("task_comments")
        .select("*, author:intranet_accounts(display_name)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
        return [];
      }
      return (data || []).map((r) => rowToTaskComment(r as TaskCommentRow));
    },
    [useDatabase, supabase],
  );

  const addTaskComment = useCallback(
    async (taskId: string, content: string) => {
      if (!useDatabase || !supabase || !session?.id) return;
      const { error } = await supabase.from("task_comments").insert({
        task_id: taskId,
        author_id: session.id,
        content: content.trim(),
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      // 댓글 수 업데이트를 위해 태스크 목록 다시 로드
      await reloadFromSupabase();
    },
    [useDatabase, supabase, session?.id, reloadFromSupabase],
  );

  const deleteTaskComment = useCallback(
    async (commentId: string) => {
      if (!useDatabase || !supabase) return;
      const { error } = await supabase.from("task_comments").delete().eq("id", commentId);
      if (error) {
        toast.error(error.message);
        return;
      }
      await reloadFromSupabase();
    },
    [useDatabase, supabase, reloadFromSupabase],
  );

  const addCallLog = useCallback(
    async (c: Omit<CallLog, "id" | "company_id" | "createdAt">) => {
      if (!useDatabase || !supabase) {
        const log: CallLog = {
          ...c,
          id: randomId(),
          company_id: DEMO_COMPANY_ID,
          createdAt: new Date().toISOString(),
        };
        setCallLogs((prev) => [log, ...prev]);
      await addTask({
        title: `[전화] ${c.customerName} — ${c.inquiryType}`,
        description: `연락처: ${c.phone} / 담당: ${c.assignee}`,
        status: "todo",
        priority: "medium",
        assigneeIds: [],
        departmentId: null,
        dueDate: null,
        createdBy: session?.id || "demo-user",
      });
      toast.message("업무 관리 접수 탭에 카드가 생성되었습니다.");
      return;
    }

    const { error: e1 } = await supabase.from("call_logs").insert({
      company_id: companyId,
      customer_name: c.customerName,
      phone: c.phone,
      inquiry_type: c.inquiryType,
      assignee: c.assignee,
    });
    if (e1) {
      toast.error(e1.message);
      return;
    }

    const { error: e2 } = await supabase.from("tasks").insert({
      company_id: companyId,
      title: `[전화] ${c.customerName} — ${c.inquiryType}`,
      description: `연락처: ${c.phone} / 담당: ${c.assignee}`,
      status: "todo",
      priority: "medium",
      created_by: session?.id,
    });
    if (e2) {
      toast.error(e2.message);
      return;
    }

    await reloadFromSupabase();
    toast.message("업무 관리 접수 탭에 카드가 생성되었습니다.");
    },
    [useDatabase, supabase, companyId, reloadFromSupabase, addTask],
  );

  const addApproval = useCallback(
    async (a: Omit<ApprovalDoc, "id" | "company_id" | "createdAt">) => {
      if (!useDatabase || !supabase) {
        const doc: ApprovalDoc = {
          ...a,
          id: randomId(),
          company_id: DEMO_COMPANY_ID,
          createdAt: new Date().toISOString(),
        };
        setApprovals((prev) => [doc, ...prev]);
        return;
      }

      const { data, error } = await supabase
        .from("approval_documents")
        .insert({
          company_id: companyId,
          title: a.title,
          body: a.body,
          line: JSON.parse(JSON.stringify(a.line)),
        })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
        return;
      }
      if (data) setApprovals((prev) => [rowToApprovalDoc(data as ApprovalRow), ...prev]);
    },
    [useDatabase, supabase, companyId],
  );

  const patchApprovalLine = useCallback(
    async (id: string, mapLine: (line: ApprovalDoc["line"]) => ApprovalDoc["line"]) => {
      if (!useDatabase || !supabase) {
        setApprovals((prev) =>
          prev.map((doc) => {
            if (doc.id !== id) return doc;
            return { ...doc, line: mapLine(doc.line) };
          }),
        );
        return;
      }

      const { data, error } = await supabase
        .from("approval_documents")
        .select("line")
        .eq("id", id)
        .single();

      if (error || !data) {
        if (error) toast.error(error.message);
        return;
      }

      const raw = data.line;
      const currentLine = Array.isArray(raw)
        ? (raw as ApprovalDoc["line"])
        : [];
      const newLine = mapLine(currentLine);

      const { error: upErr } = await supabase
        .from("approval_documents")
        .update({ line: JSON.parse(JSON.stringify(newLine)) })
        .eq("id", id);

      if (upErr) {
        toast.error(upErr.message);
        return;
      }
      setApprovals((prev) => prev.map((d) => (d.id === id ? { ...d, line: newLine } : d)));
    },
    [useDatabase, supabase],
  );

  const approveDoc = useCallback(
    async (id: string) => {
      await patchApprovalLine(id, (line) =>
        line.map((m) =>
          m.role === "approve" && m.status === "pending" ? { ...m, status: "approved" as const } : m,
        ),
      );
      toast.success("결재 승인되었습니다.");
    },
    [patchApprovalLine],
  );

  const rejectDoc = useCallback(
    async (id: string) => {
      await patchApprovalLine(id, (line) =>
        line.map((m) =>
          m.role === "approve" && m.status === "pending" ? { ...m, status: "rejected" as const } : m,
        ),
      );
      toast.message("결재 반려 처리되었습니다.");
    },
    [patchApprovalLine],
  );

  const updateCompanyProfile = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        toast.error("회사 이름을 입력하세요.");
        return;
      }
      if (!useDatabase || !supabase || !session?.company_id) {
        setCompanyProfile({ name: trimmed });
        toast.success("회사 이름 변경 (로컬 데모)");
        return;
      }
      const { error } = await supabase
        .from("companies")
        .update({ name: trimmed })
        .eq("id", session.company_id);

      if (error) {
        toast.error(`회사 이름 변경 실패: ${error.message}`);
        return;
      }
      setCompanyProfile({ name: trimmed });
      toast.success("회사 이름을 변경했습니다.");
    },
    [useDatabase, supabase, session],
  );

  const addDepartment = useCallback(
    async (name: string, color?: string | null) => {
      const n = name.trim();
      if (!n) {
        toast.error("부서 이름을 입력하세요.");
        return false;
      }
      if (!useDatabase || !supabase || !session?.company_id) return false;
      const maxSort = departments.reduce((m, d) => Math.max(m, d.sortOrder), -1);
      const nextColor =
        color !== undefined && color !== null && String(color).trim() !== ""
          ? normalizeDepartmentColor(color)
          : pickNewDepartmentColor(departments.length);
      const { data, error } = await supabase
        .from("departments")
        .insert({
          company_id: session.company_id,
          name: n,
          sort_order: maxSort + 1,
          color: nextColor,
          permissions: ["/dashboard", "/settings/general"],
        })
        .select("id, company_id, name, sort_order, color, permissions")
        .single();
      if (error) {
        toast.error(error.message);
        return false;
      }
      if (data) {
        setDepartments((p) =>
          [...p, rowToDepartment(data as DepartmentRow)].sort((a, b) => a.sortOrder - b.sortOrder),
        );
        toast.success("부서를 추가했습니다.");
        return true;
      }
      return false;
    },
    [useDatabase, supabase, session, departments],
  );

  const updateDepartment = useCallback(
    async (id: string, fields: { name: string; color: string | null; permissions?: string[] }) => {
      const n = fields.name.trim();
      if (!n) {
        toast.error("부서 이름을 입력하세요.");
        return;
      }
      if (!useDatabase || !supabase || !session?.company_id) return;
      const c =
        fields.color === null || fields.color === ""
          ? null
          : normalizeDepartmentColor(fields.color);
          
      const updateData: Record<string, unknown> = { name: n, color: c };
      if (fields.permissions) {
        updateData.permissions = fields.permissions;
      }
      
      const { error } = await supabase
        .from("departments")
        .update(updateData)
        .eq("id", id)
        .eq("company_id", session.company_id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, name: n, color: c, permissions: fields.permissions ?? d.permissions } : d)));
      setCompanyUsers((prev) =>
        prev.map((u) =>
          u.departmentId === id ? { ...u, departmentName: n, departmentColor: c } : u,
        ),
      );
      toast.success("부서 정보를 저장했습니다.");
    },
    [useDatabase, supabase, session],
  );

  const removeDepartment = useCallback(
    async (id: string) => {
      if (!useDatabase || !supabase || !session?.company_id) return;
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", id)
        .eq("company_id", session.company_id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      setCompanyUsers((prev) =>
        prev.map((u) =>
          u.departmentId === id
            ? { ...u, departmentId: null, departmentName: null, departmentColor: null }
            : u,
        ),
      );
      toast.message("부서를 삭제했습니다. 해당 직원의 부서는 비워집니다.");
    },
    [useDatabase, supabase, session],
  );

  const updateUser = useCallback(
    async (
      id: string,
      patch: Partial<Pick<CompanyUser, "name" | "email" | "phone" | "role" | "departmentId" | "employmentStatus" | "joinedAt" | "resignedAt">>,
    ) => {
      const target = companyUsers.find((x) => x.id === id);
      if (target?.pendingLogin && patch.email !== undefined) {
        toast.error('발급 대기 계정은 아래 "로그인 계정 발급"으로 아이디를 지정하세요.');
        return;
      }

      if (!useDatabase || !supabase) {
        setCompanyUsers((prev) =>
          prev.map((u) => {
            if (u.id !== id) return u;
            const next = { ...u, ...patch };
            if (patch.departmentId !== undefined) {
              const dept =
                patch.departmentId === null
                  ? null
                  : departments.find((d) => d.id === patch.departmentId);
              next.departmentName = dept?.name ?? null;
              next.departmentColor = dept?.color ?? null;
            }
            return next;
          }),
        );
        return;
      }

      const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (patch.name !== undefined) row.display_name = patch.name;
      if (patch.email !== undefined) row.username = patch.email;
      if (patch.phone !== undefined) row.phone = patch.phone.trim() || null;
      if (patch.role !== undefined) row.role = patch.role;
      if (patch.departmentId !== undefined) row.department_id = patch.departmentId;
      if (patch.employmentStatus !== undefined) row.employment_status = patch.employmentStatus;
      if (patch.joinedAt !== undefined) row.joined_at = patch.joinedAt;
      if (patch.resignedAt !== undefined) row.resigned_at = patch.resignedAt;

      const { error } = await supabase
        .from("intranet_accounts")
        .update(row)
        .eq("id", id)
        .eq("company_id", companyId);

      if (error) {
        toast.error(error.message);
        return;
      }

      setCompanyUsers((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          const next: CompanyUser = { ...u, ...patch };
          if (patch.departmentId !== undefined) {
            const dept =
              patch.departmentId === null
                ? null
                : departments.find((d) => d.id === patch.departmentId);
            next.departmentName = dept?.name ?? null;
            next.departmentColor = dept?.color ?? null;
          }
          return next;
        }),
      );
      if (id === session?.id) await refreshSession();
    },
    [useDatabase, supabase, companyId, refreshSession, session?.id, departments, companyUsers],
  );

  const removeUser = useCallback(
    async (id: string) => {
      if (!useDatabase || !supabase || !session?.company_id) {
        setCompanyUsers((prev) => prev.filter((u) => u.id !== id));
        toast.success("로컬 데모: 직원이 삭제되었습니다.");
        return;
      }

      const { error } = await supabase
        .from("intranet_accounts")
        .delete()
        .eq("id", id)
        .eq("company_id", session.company_id);

      if (error) {
        toast.error(`삭제 실패: ${error.message}`);
        return;
      }
      setCompanyUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("직원이 삭제되었습니다.");
    },
    [useDatabase, supabase, session],
  );

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read">) => {
      setNotifications((prev) => [
        {
          ...n,
          id: randomId(),
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev,
      ]);
    },
    [],
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const todaySales = quotationLast7Days[quotationLast7Days.length - 1]?.amount ?? 0;

  const pendingApprovalCount = useMemo(
    () =>
      approvals.filter((d) =>
        d.line.some((m) => m.role === "approve" && m.status === "pending"),
      ).length,
    [approvals],
  );

  const startOfDay = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const newCallsTodayCount = useMemo(
    () => callLogs.filter((c) => new Date(c.createdAt).getTime() >= startOfDay).length,
    [callLogs, startOfDay],
  );

  const value = useMemo<AppStateValue>(
    () => ({
      useDatabase,
      role,
      setRole,
      isAdmin,
      session,
      tasks,
      addTask,
      updateTask,
      moveTask,
      deleteTask,
      getTaskComments,
      addTaskComment,
      deleteTaskComment,
      callLogs,
      addCallLog,
      approvals,
      addApproval,
      approveDoc,
      rejectDoc,
      companyUsers,
      updateUser,
      removeUser,
      companyProfile,
      updateCompanyProfile,
      departments,
      addDepartment,
      updateDepartment,
      removeDepartment,
      reloadCompanyData,
      notifications,
      addNotification,
      markAllNotificationsRead,
      telegram,
      setTelegram,
      persistTelegram,
      todaySales,
      pendingApprovalCount,
      newCallsTodayCount,
    }),
    [
      useDatabase,
      role,
      setRole,
      isAdmin,
      tasks,
      addTask,
      updateTask,
      moveTask,
      deleteTask,
      getTaskComments,
      addTaskComment,
      deleteTaskComment,
      callLogs,
      addCallLog,
      approvals,
      addApproval,
      approveDoc,
      rejectDoc,
      companyUsers,
      updateUser,
      removeUser,
      companyProfile,
      departments,
      addDepartment,
      updateDepartment,
      removeDepartment,
      reloadCompanyData,
      notifications,
      addNotification,
      markAllNotificationsRead,
      telegram,
      setTelegram,
      persistTelegram,
      todaySales,
      pendingApprovalCount,
      newCallsTodayCount,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
