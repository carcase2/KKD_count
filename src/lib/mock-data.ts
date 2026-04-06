import type {
  ApprovalDoc,
  CallLog,
  CompanyUser,
  Task,
} from "./types";
import { DEMO_COMPANY_ID } from "./types";

export const initialTasks: Task[] = [
  {
    id: "t1",
    company_id: DEMO_COMPANY_ID,
    title: "A사 납품 일정 조율",
    description: "물류팀과 일정 확정",
    status: "received",
    assignee: "김직원",
    source: "manual",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "t2",
    company_id: DEMO_COMPANY_ID,
    title: "견적서 수정 요청 대응",
    status: "progress",
    assignee: "이대리",
    source: "call",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "t3",
    company_id: DEMO_COMPANY_ID,
    title: "월간 보고서 작성",
    status: "done",
    assignee: "박사원",
    source: "manual",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export const quotationLast7Days = [
  { date: "3/28", amount: 1200000 },
  { date: "3/29", amount: 890000 },
  { date: "3/30", amount: 2100000 },
  { date: "3/31", amount: 450000 },
  { date: "4/1", amount: 1780000 },
  { date: "4/2", amount: 920000 },
  { date: "4/3", amount: 1340000 },
];

export function taskStatusCounts(tasks: Task[]) {
  const received = tasks.filter((t) => t.status === "received").length;
  const progress = tasks.filter((t) => t.status === "progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  return [
    { name: "접수", value: received },
    { name: "진행", value: progress },
    { name: "완료", value: done },
  ];
}

export const initialApprovals: ApprovalDoc[] = [
  {
    id: "a1",
    company_id: DEMO_COMPANY_ID,
    title: "신규 장비 구매 품의",
    body: "생산라인 증설을 위한 장비 2대 구매를 요청드립니다.",
    line: [
      { role: "draft", name: "김직원", status: "approved" },
      { role: "review", name: "이대리", status: "approved" },
      { role: "approve", name: "사장", status: "pending" },
    ],
    createdAt: new Date().toISOString(),
  },
];

export const initialCallLogs: CallLog[] = [];

export const initialCompanyUsers: CompanyUser[] = [
  {
    id: "u1",
    company_id: DEMO_COMPANY_ID,
    name: "사장",
    email: "ceo@demo.kr",
    phone: "010-0000-0001",
    role: "admin",
    departmentId: null,
    departmentName: null,
    departmentColor: null,
    loginEnabled: true,
    mustChangePassword: false,
    pendingLogin: false,
    employmentStatus: "active",
    joinedAt: null,
    resignedAt: null,
  },
  {
    id: "u2",
    company_id: DEMO_COMPANY_ID,
    name: "김직원",
    email: "kim@demo.kr",
    phone: "010-0000-0002",
    role: "user",
    departmentId: null,
    departmentName: null,
    departmentColor: null,
    loginEnabled: true,
    mustChangePassword: false,
    pendingLogin: false,
    employmentStatus: "active",
    joinedAt: null,
    resignedAt: null,
  },
  {
    id: "u3",
    company_id: DEMO_COMPANY_ID,
    name: "이대리",
    email: "lee@demo.kr",
    phone: "010-0000-0003",
    role: "user",
    departmentId: null,
    departmentName: null,
    departmentColor: null,
    loginEnabled: true,
    mustChangePassword: false,
    pendingLogin: false,
    employmentStatus: "active",
    joinedAt: null,
    resignedAt: null,
  },
];
