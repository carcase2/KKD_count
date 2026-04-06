"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { 
  Search, 
  Filter, 
  Calendar, 
  Layout, 
  MessageSquare, 
  Clock, 
  User, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useAppState } from "@/context/app-state";
import type { Task, TaskStatus, TaskPriority, TaskComment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ─── Constants ──────────────────────────────────────────────────────────────

const COLS: { status: TaskStatus; title: string; theme: { border: string; bg: string; dot: string; text: string; accent: string; light: string } }[] = [
  { status: "todo", title: "접수", theme: { border: "border-slate-200", bg: "bg-slate-50", dot: "bg-slate-400", text: "text-slate-600", accent: "border-l-slate-400", light: "bg-white" } },
  { status: "in_progress", title: "진행", theme: { border: "border-blue-200", bg: "bg-blue-50", dot: "bg-blue-500", text: "text-blue-600", accent: "border-l-blue-500", light: "bg-blue-50/30" } },
  { status: "pending", title: "보류", theme: { border: "border-amber-200", bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-600", accent: "border-l-amber-500", light: "bg-amber-50/30" } },
  { status: "done", title: "완료", theme: { border: "border-emerald-200", bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-600", accent: "border-l-emerald-500", light: "bg-emerald-50/30" } },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "urgent", label: "긴급", color: "bg-red-500 text-white" },
  { value: "high", label: "높음", color: "bg-orange-500 text-white" },
  { value: "medium", label: "보통", color: "bg-blue-500 text-white" },
  { value: "low", label: "낮음", color: "bg-slate-400 text-white" },
];

// ─── Components ─────────────────────────────────────────────────────────────

/**
 * 우선순위 배지
 */
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const p = PRIORITIES.find((x) => x.value === priority) || PRIORITIES[2];
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${p.color}`}>
      {p.label}
    </span>
  );
}

/**
 * 칸반 개별 카드
 */
function DraggableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)`, zIndex: 50 }
    : undefined;

  const theme = COLS.find((c) => c.status === task.status)?.theme || COLS[0].theme;
  
  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? "opacity-50" : ""} group`}>
      <Card 
        className={`cursor-pointer border-slate-200/80 shadow-sm transition-all hover:border-blue-300 hover:shadow-md border-l-4 ${theme.accent} ${theme.light}`}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <PriorityBadge priority={task.priority} />
              {task.departmentName && (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200">
                  {task.departmentName}
                </span>
              )}
            </div>
            <button className="text-slate-400 hover:text-slate-600 md:opacity-0 group-hover:opacity-100" {...listeners} {...attributes}>
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <p className="text-sm font-bold leading-tight text-slate-900 line-clamp-2">
            {task.title}
          </p>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1.5 overflow-hidden">
                {(task.assigneeNames || []).slice(0, 3).map((name, i) => (
                  <div 
                    key={i} 
                    className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-white bg-slate-100 text-[8px] font-bold text-slate-500" 
                    title={name}
                  >
                    {name[0]}
                  </div>
                ))}
                {task.assigneeNames && task.assigneeNames.length > 3 && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-white bg-slate-50 text-[8px] font-medium text-slate-400">
                    +{task.assigneeNames.length - 3}
                  </div>
                )}
                {(!task.assigneeNames || task.assigneeNames.length === 0) && (
                  <span className="text-[10px] text-slate-400 italic">미정</span>
                )}
              </div>
              {task.commentCount ? (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <MessageSquare className="h-3 w-3" />
                  <span>{task.commentCount}</span>
                </div>
              ) : null}
            </div>
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-[11px] ${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                <Clock className="h-3 w-3" />
                <span>{task.dueDate.slice(5)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 칸반 컬럼
 */
function KanbanColumn({ status, title, tasks, onCardClick }: { status: TaskStatus; title: string; tasks: Task[]; onCardClick: (t: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const theme = COLS.find((c) => c.status === status)?.theme || COLS[0].theme;
  
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-[280px] rounded-2xl bg-slate-100/50 p-3 ring-1 ring-slate-200/60 transition-colors ${isOver ? "bg-blue-50 ring-blue-200" : ""}`}
    >
      <div className={`mb-3 flex items-center justify-between px-3 py-2 rounded-xl ${theme.bg} border ${theme.border}`}>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${theme.dot}`} />
          <h2 className={`text-xs font-bold ${theme.text} uppercase tracking-wider`}>{title}</h2>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${theme.text} bg-white/50 border ${theme.border}`}>
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {tasks.map((t) => (
          <DraggableTaskCard key={t.id} task={t} onClick={() => onCardClick(t)} />
        ))}
      </div>
    </div>
  );
}

const KR_HOLIDAYS = [
  "01-01", // 신정
  "03-01", // 삼일절
  "05-05", // 어린이날
  "06-06", // 현충일
  "08-15", // 광복절
  "10-03", // 개천절
  "10-09", // 한글날
  "12-25", // 성탄절
];

/**
 * 달력 뷰 (단순 구현)
 */
function TaskCalendar({ tasks, onCardClick }: { tasks: Task[]; onCardClick: (t: Task) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const today = () => setCurrentDate(new Date());

  const days = useMemo(() => {
    const d: { 
      date: number; 
      fullDate: string; 
      isCurrentMonth: boolean; 
      tasks: Task[];
      dayOfWeek: number;
      isHoliday: boolean;
    }[] = [];
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    
    // Previous month padding
    const prevMonthTotalDays = daysInMonth(year, month - 1);
    for (let i = startOffset - 1; i >= 0; i--) {
      const dDate = new Date(year, month - 1, prevMonthTotalDays - i);
      d.push({ 
        date: prevMonthTotalDays - i, 
        fullDate: "", 
        isCurrentMonth: false, 
        tasks: [],
        dayOfWeek: dDate.getDay(),
        isHoliday: false
      });
    }
    
    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const md = `${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dDate = new Date(year, month, i);
      d.push({
        date: i,
        fullDate,
        isCurrentMonth: true,
        tasks: tasks.filter(t => t.dueDate === fullDate),
        dayOfWeek: dDate.getDay(),
        isHoliday: KR_HOLIDAYS.includes(md)
      });
    }
    
    return d;
  }, [year, month, tasks]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
        <h2 className="text-lg font-bold text-slate-900">{year}년 {month + 1}월</h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={today}>오늘</Button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white">
            <Button variant="ghost" className="h-8 w-8 px-0" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" className="h-8 w-8 px-0" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/30">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, idx) => (
          <div key={d} className={`py-2 text-center text-xs font-bold ${
            idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : "text-slate-500"
          }`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-l border-t border-transparent">
        {days.map((day, i) => (
          <div key={i} className={`min-h-[120px] p-2 transition-colors ${!day.isCurrentMonth ? "bg-slate-50/50 text-slate-300" : "bg-white"}`}>
            <p className={`text-xs font-bold transition-colors ${
              day.fullDate === new Date().toISOString().split('T')[0] 
                ? 'mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md' 
                : (day.dayOfWeek === 0 || day.isHoliday) ? 'text-red-500' 
                : day.dayOfWeek === 6 ? 'text-blue-500' 
                : day.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
            }`}>
              {day.date}
            </p>
            <div className="mt-2 space-y-1">
              {day.tasks.map(t => (
                <button
                  key={t.id}
                  onClick={() => onCardClick(t)}
                  className="w-full text-left rounded bg-blue-50 px-1.5 py-1 text-[10px] font-medium text-blue-700 hover:bg-blue-100 line-clamp-1 border-l-2 border-blue-400"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 업무 상세 모달 & 댓글
 */
function TaskDetailModal({ task, open, onOpenChange }: { 
  task: Task; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { 
    updateTask, 
    deleteTask, 
    getTaskComments, 
    addTaskComment, 
    isAdmin, 
    departments, 
    companyUsers,
    session
  } = useAppState();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editing, setEditing] = useState(false);
  
  // Local edit states
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.description || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assigneeIds || []);
  const [deptId, setDeptId] = useState<string>(task.departmentId || "none");
  const [dueDate, setDueDate] = useState(task.dueDate || "");

  useEffect(() => {
    if (open) {
      void getTaskComments(task.id).then(setComments);
      // Reset local states to task actual values
      setTitle(task.title);
      setDesc(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeIds(task.assigneeIds || []);
      setDeptId(task.departmentId || "none");
      setDueDate(task.dueDate || "");
      setEditing(false);
    }
  }, [open, task, getTaskComments]);

  const handleSave = async () => {
    await updateTask(task.id, {
      title,
      description: desc,
      status,
      priority,
      assigneeIds,
      departmentId: deptId === "none" ? null : deptId,
      dueDate: dueDate || null
    });
    setEditing(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const content = newComment.trim();
    setNewComment(""); // Clear input immediately for better UX
    await addTaskComment(task.id, content);
    // Fetch latest comments after adding
    const latestComments = await getTaskComments(task.id);
    setComments(latestComments);
  };

  const handleStart = async () => {
    const today = new Date().toISOString().split('T')[0];
    await updateTask(task.id, { status: "in_progress", startedAt: today });
  };

  const handlePend = async () => {
    await updateTask(task.id, { status: "pending" });
  };

  const handleComplete = async () => {
    const today = new Date().toISOString().split('T')[0];
    await updateTask(task.id, { status: "done", finishedAt: today });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90dvh] p-0 flex flex-col overflow-hidden bg-white shadow-2xl rounded-2xl">
        {/* Sticky Header */}
        <div className="flex-none bg-white border-b border-slate-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
               <AlertCircle className="h-5 w-5" />
             </div>
             <div>
               <DialogTitle className="text-xl font-bold">{editing ? "업무 편집" : "업무 상세"}</DialogTitle>
               <p className="text-xs text-slate-400 mt-0.5">#{task.id.slice(0, 8)}</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <Button variant="secondary" onClick={() => setEditing(true)}>편집</Button>
            )}
            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={async () => {
              if (confirm("정말로 삭제하시겠습니까?")) {
                await deleteTask(task.id);
                onOpenChange(false);
              }
            }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        {!editing && (
          <div className="flex-none px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter mr-2">Quick Actions</span>
            {task.status === "todo" && (
              <Button onClick={handleStart} className="min-h-9 h-9 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm">
                <Clock className="h-3.5 w-3.5" />
                업무 시작
              </Button>
            )}
            {task.status !== "done" && task.status !== "pending" && (
              <Button variant="secondary" onClick={handlePend} className="min-h-9 h-9 px-3 text-xs border-orange-200 text-orange-600 hover:bg-orange-50 gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                보류 처리
              </Button>
            )}
            {task.status !== "done" && (
              <Button onClick={handleComplete} className="min-h-9 h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                업무 완료
              </Button>
            )}
            {task.status === "done" && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-bold">처리 완료된 업무입니다</span>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Content (Main Info + Comment List) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div className="col-span-2 space-y-2">
              <Label className="text-slate-500">제목</Label>
              {editing ? (
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              ) : (
                <p className="font-bold text-lg text-slate-900">{task.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500">상태</Label>
              {editing ? (
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLS.map(c => <SelectItem key={c.status} value={c.status}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${COLS.find(c => c.status === task.status)?.theme.dot}`} />
                  <span className="font-medium text-slate-700">{COLS.find(c => c.status === task.status)?.title}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500">중요도</Label>
              {editing ? (
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex">
                  <PriorityBadge priority={task.priority} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500">담당자</Label>
              {editing ? (
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-[120px] overflow-y-auto">
                   {companyUsers
                     .filter(u => isAdmin || u.departmentId === session?.department_id)
                     .map(u => (
                     <label key={u.id} className="flex items-center gap-2 cursor-pointer py-1">
                        <input 
                           type="checkbox"
                           className="h-4 w-4 rounded border-slate-300 text-blue-600"
                           checked={assigneeIds.includes(u.id)}
                           onChange={(e) => {
                              if (e.target.checked) setAssigneeIds(prev => [...prev, u.id]);
                              else setAssigneeIds(prev => prev.filter(id => id !== u.id));
                           }}
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {u.name} {u.id === session?.id && "(나)"}
                        </span>
                     </label>
                   ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                   {(task.assigneeNames || []).map((name, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg">
                         <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">
                            {name[0]}
                         </div>
                         <span className="text-[11px] font-medium text-slate-700">{name}</span>
                      </div>
                   ))}
                   {(!task.assigneeNames || task.assigneeNames.length === 0) && (
                      <span className="text-sm text-slate-400">지정 안 함</span>
                   )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500">부서</Label>
              {editing && isAdmin ? (
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">지정 안 함</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full bg-slate-300`} />
                  <span className="text-sm font-medium text-slate-700">{task.departmentName || "미지정"}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-500">마감 기한</Label>
              {editing ? (
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{task.dueDate || "기한 없음"}</span>
                </div>
              )}
            </div>

            {!editing && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-500">실제 시작일</Label>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span>{task.startedAt || "-"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-500">실제 완료일</Label>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>{task.finishedAt || "-"}</span>
                  </div>
                </div>
              </>
            )}

            <div className="col-span-2 space-y-2">
              <Label className="text-slate-500">상세 설명</Label>
              {editing ? (
                <Textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} placeholder="업무에 대한 상세 설명을 입력하세요..." />
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                  {task.description || "등록된 설명이 없습니다."}
                </p>
              )}
            </div>
            
            {editing && (
              <div className="col-span-2 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setEditing(false)}>취소</Button>
                <Button onClick={handleSave}>저장하기</Button>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Comment List Area */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              댓글 {comments.length}
            </h3>
            
            <div className="space-y-5">
              {comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                    {c.authorName[0]}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{c.authorName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="rounded-2xl rounded-tl-none bg-slate-100 px-4 py-2.5 text-sm text-slate-700">
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400 italic">아직 댓글이 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer (Comment Input) */}
        <div className="flex-none p-6 border-t bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
             <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">새 댓글 작성</Label>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-500">
              나
            </div>
            <div className="flex-1 space-y-3">
              <Textarea 
                placeholder="의견을 남겨주세요..." 
                className="min-h-[100px] bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none shadow-sm text-sm"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                 <Button 
                   variant="secondary"
                   disabled={!newComment.trim()} 
                   onClick={() => setNewComment("")}
                   className="h-9 px-4 text-xs font-medium"
                 >
                    취소
                 </Button>
                 <Button 
                   disabled={!newComment.trim()} 
                   onClick={handleAddComment}
                   className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
                 >
                    <MessageSquare className="h-3.5 w-3.5" />
                    댓글 저장
                 </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 메인 뷰
 */
export function TasksView() {
  const { tasks, moveTask, addTask, companyUsers, departments, isAdmin, session } = useAppState();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban");
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  
  // Create Task State
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState("");

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isCreating && session?.id) {
       setNewAssigneeIds([session.id]);
    }
  }, [isCreating, session?.id]);
  
  // Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const myDept = useMemo(() => {
    return departments.find(d => d.id === session?.department_id);
  }, [departments, session?.department_id]);

  // Sync selectedTask with latest data from global tasks array
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTask)) {
        setSelectedTask(updated);
      }
    }
  }, [tasks, selectedTask]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          (t.assigneeNames || []).some(name => name.toLowerCase().includes(search.toLowerCase()));
      
      // 권한 제어: 관리자가 아니면 본인 부서 업무만 확인 가능
      const userDept = session?.department_id;
      const matchDept = isAdmin 
        ? (filterDept === "all" || t.departmentId === filterDept)
        : (t.departmentId === userDept);
      
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      return matchSearch && matchDept && matchPriority;
    });
  }, [tasks, search, filterDept, filterPriority, isAdmin, session]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const next = over.id as TaskStatus;
    if (["todo", "in_progress", "done"].includes(next)) {
      void moveTask(String(active.id), next);
    }
  };

  const byStatus = (s: TaskStatus) => filteredTasks.filter((t) => t.status === s);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          title={`업무 관리 (${myDept?.name || "미지정"})`}
          description={`${myDept?.name || "우리 부서"}의 칸반 보드와 달력을 통해 업무 흐름을 관리하세요.`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200">
            <Button 
              variant={viewMode === "kanban" ? "secondary" : "ghost"} 
              className={`gap-2 h-8 px-3 text-xs ${viewMode === "kanban" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setViewMode("kanban")}
            >
              <Layout className="h-4 w-4" />
              칸반 보드
            </Button>
            <Button 
              variant={viewMode === "calendar" ? "secondary" : "ghost"} 
              className={`gap-2 h-8 px-3 text-xs ${viewMode === "calendar" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setViewMode("calendar")}
            >
              <Calendar className="h-4 w-4" />
              달력 보기
            </Button>
          </div>
          <Button className="gap-2" onClick={() => setIsCreating(true)}>
             <Plus className="h-4 w-4" />
             업무 추가
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="업무 제목 또는 담당자 검색..." 
            className="pl-9 bg-slate-50/50 border-none ring-1 ring-slate-200 focus-visible:ring-blue-500"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[140px] h-9 bg-slate-50/50 border-none ring-1 ring-slate-200">
                <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="부서 전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">부서 전체</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[120px] h-9 bg-slate-50/50 border-none ring-1 ring-slate-200">
              <AlertCircle className="mr-2 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="중요도 전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">중요도 전체</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          
          {/* Filters Bar 리셋 버튼 수정 */}
          {(search || filterDept !== "all" || filterPriority !== "all") && (
            <Button variant="ghost" className="text-slate-400 text-xs px-2 h-8" onClick={() => {
              setSearch("");
              setFilterDept("all");
              setFilterPriority("all");
            }}>
              초기화
            </Button>
          )}
        </div>
      </div>

      {viewMode === "kanban" ? (
        <div className="hidden md:block">
          <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
            <div className="flex gap-4 min-h-[calc(100dvh-400px)] overflow-x-auto pb-6 custom-scrollbar">
              {COLS.map((col) => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  title={col.title}
                  tasks={byStatus(col.status)}
                  onCardClick={(t) => setSelectedTask(t)}
                />
              ))}
            </div>
          </DndContext>
        </div>
      ) : (
        <TaskCalendar tasks={filteredTasks} onCardClick={(t) => setSelectedTask(t)} />
      )}

      {/* Mobile Kanban (Stacked) */}
      <div className="md:hidden space-y-6">
        {COLS.map((col) => (
          <div key={col.status} className="space-y-3">
             <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${col.theme.dot}`} />
                <h3 className={`font-bold text-slate-800`}>{col.title} ({byStatus(col.status).length})</h3>
             </div>
             <div className="grid gap-3">
               {byStatus(col.status).map(t => {
                  const theme = COLS.find(c => c.status === t.status)?.theme || COLS[0].theme;
                  return (
                    <Card key={t.id} className={`active:scale-[0.98] transition-transform border-l-4 ${theme.accent} ${theme.light}`} onClick={() => setSelectedTask(t)}>
                       <CardContent className="p-4 space-y-3">
                       <div className="flex items-center justify-between">
                         <div className="flex gap-1.5">
                            <PriorityBadge priority={t.priority} />
                            {t.departmentName && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">{t.departmentName}</span>}
                         </div>
                         {t.dueDate && <span className="text-[10px] text-slate-400">{t.dueDate}</span>}
                       </div>
                       <p className="text-sm font-bold">{t.title}</p>
                       <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex -space-x-1.5 overflow-hidden">
                             {(t.assigneeNames || []).slice(0, 3).map((name, i) => (
                                <div key={i} className="inline-block h-5 w-5 rounded-full bg-slate-100 border-[1.5px] border-white text-[8px] flex items-center justify-center font-bold text-slate-500" title={name}>
                                   {name[0]}
                                </div>
                             ))}
                             {t.assigneeNames && t.assigneeNames.length > 3 && (
                                <div className="inline-block h-5 w-5 rounded-full bg-slate-50 border-[1.5px] border-white text-[8px] flex items-center justify-center font-medium text-slate-400">
                                   +{t.assigneeNames.length - 3}
                                </div>
                             )}
                             {(!t.assigneeNames || t.assigneeNames.length === 0) && (
                                <span className="text-[10px] text-slate-400">담당자 없음</span>
                             )}
                          </div>
                          <div className="flex items-center gap-1">
                             <MessageSquare className="h-3 w-3" />
                             <span>{t.commentCount || 0}</span>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
               )})}
               {byStatus(col.status).length === 0 && <p className="text-center py-6 text-sm text-slate-300 italic border-2 border-dashed border-slate-100 rounded-2xl">업무가 없습니다.</p>}
             </div>
          </div>
        ))}
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className={`max-w-md transition-colors duration-500 overflow-hidden shadow-2xl ${
           newPriority === "urgent" ? "bg-red-50 ring-1 ring-red-200" :
           newPriority === "high" ? "bg-orange-50 ring-1 ring-orange-200" :
           newPriority === "medium" ? "bg-blue-50 ring-1 ring-blue-200" :
           "bg-slate-50 ring-1 ring-slate-200"
         }`}>
           <DialogHeader className={`pb-2 transition-colors duration-500 border-b border-white/20 ${
              newPriority === "urgent" ? "bg-red-100" :
              newPriority === "high" ? "bg-orange-100" :
              newPriority === "medium" ? "bg-blue-100" :
              "bg-slate-100"
            }`}>
               <div className="flex items-center gap-2">
                  <DialogTitle>새 업무 등록</DialogTitle>
                  <PriorityBadge priority={newPriority} />
               </div>
           </DialogHeader>
           <div className="px-6 py-4 space-y-4 text-sm">
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 font-medium select-none">
                 <Clock className="h-4 w-4" />
                 <span>작성 일시: {new Date().toLocaleString('ko-KR', { 
                   year: 'numeric', 
                   month: 'long', 
                   day: 'numeric', 
                   hour: '2-digit', 
                   minute: '2-digit' 
                 })}</span>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label>업무 제목</Label>
                    <Input 
                      placeholder="무엇을 해야 하나요?" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                      autoFocus
                    />
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <Label>마감 기한</Label>
                       <div className="flex gap-1">
                          {[
                             { label: "오늘", getValue: () => new Date().toISOString().split('T')[0] },
                             { label: "내일", getValue: () => new Date(Date.now() + 86400000).toISOString().split('T')[0] },
                             { label: "일주일", getValue: () => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0] },
                             { label: "미정", getValue: () => "" },
                          ].map(btn => (
                             <button
                                key={btn.label}
                                type="button"
                                onClick={() => setNewDueDate(btn.getValue())}
                                className="px-2 py-1 text-[10px] font-bold rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                             >
                                {btn.label}
                             </button>
                          ))}
                       </div>
                    </div>
                    <Input 
                      type="date"
                      value={newDueDate} 
                      onChange={e => setNewDueDate(e.target.value)}
                      className="bg-white/50 border-slate-200 focus:bg-white"
                    />
                 </div>
                 <div className="space-y-3">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">중요도 선택</Label>
                    <div className="grid grid-cols-4 gap-2">
                       {PRIORITIES.map(p => {
                          const isActive = newPriority === p.value;
                          
                          // 테일윈드 JIT 컴파일러를 위해 하드코딩된 클래스 맵 사용
                          const themeStyles = {
                             urgent: { border: "border-red-500", shadow: "shadow-red-500/20", ring: "ring-red-500/30", text: "text-red-600", dot: "bg-red-500" },
                             high: { border: "border-orange-500", shadow: "shadow-orange-500/20", ring: "ring-orange-500/30", text: "text-orange-600", dot: "bg-orange-500" },
                             medium: { border: "border-blue-500", shadow: "shadow-blue-500/20", ring: "ring-blue-500/30", text: "text-blue-600", dot: "bg-blue-500" },
                             low: { border: "border-slate-500", shadow: "shadow-slate-500/20", ring: "ring-slate-500/30", text: "text-slate-600", dot: "bg-slate-500" },
                          };
                          
                          const style = themeStyles[p.value];

                          return (
                             <button
                                key={p.value}
                                type="button"
                                onClick={() => setNewPriority(p.value)}
                                className={`flex flex-col items-center justify-center gap-2 rounded-2xl py-3 border-2 transition-all duration-300 ${
                                   isActive 
                                      ? `bg-white ${style.border} shadow-xl ${style.shadow} scale-105 active:scale-95` 
                                      : `bg-white/40 border-transparent hover:bg-white/60 hover:border-slate-200 text-slate-400`
                                }`}
                             >
                                <div className={`h-3 w-3 rounded-full ${style.dot} ${isActive ? `ring-4 ${style.ring} animate-pulse` : ""}`} />
                                <span className={`text-[11px] font-bold tracking-tight ${isActive ? style.text : "text-slate-400"}`}>
                                   {p.label}
                                </span>
                             </button>
                          );
                       })}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">담당자 지정 (다중 선택 가능)</Label>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto p-3 bg-white/40 rounded-2xl border border-slate-200/50">
                       {companyUsers
                         .filter(u => isAdmin || u.departmentId === session?.department_id)
                         .map(u => {
                           const isSelected = newAssigneeIds.includes(u.id);
                           const isMe = u.id === session?.id;
                           return (
                             <label 
                                key={u.id} 
                                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                                  isSelected ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-white/40"
                                }`}
                             >
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {u.name[0]}
                                  </div>
                                  <span className="text-xs font-medium text-slate-700">
                                    {u.name} {isMe && <span className="text-[10px] text-slate-400">(나)</span>}
                                  </span>
                                </div>
                                <input 
                                   type="checkbox" 
                                   className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                   checked={isSelected}
                                   onChange={(e) => {
                                      if (e.target.checked) {
                                         setNewAssigneeIds(prev => [...prev, u.id]);
                                      } else {
                                         setNewAssigneeIds(prev => prev.filter(id => id !== u.id));
                                      }
                                   }}
                                />
                             </label>
                           );
                         })}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>상세 설명</Label>
                    <Textarea 
                       placeholder="상세 내용을 입력하세요 (선택 사항)" 
                       value={newDescription}
                       onChange={e => setNewDescription(e.target.value)}
                       className="min-h-[80px] bg-white/50 border-slate-200 focus:bg-white resize-none"
                    />
                 </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                * 상세 정보(댓글 등)는 업무 생성 후 카드에서 상세 보기를 눌러 등록할 수 있습니다.
              </p>
           </div>
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreating(false)}>취소</Button>
              <Button disabled={!newTitle.trim()} onClick={() => {
                 void addTask({
                   title: newTitle.trim(),
                   status: "todo",
                   priority: newPriority,
                   assigneeIds: newAssigneeIds,
                   departmentId: isAdmin ? null : (session?.department_id || null),
                   dueDate: newDueDate || null,
                   description: newDescription.trim() || null,
                   createdBy: session?.id || "user" 
                 });
                 setNewTitle("");
                 setNewDueDate("");
                 setNewPriority("medium");
                 setNewAssigneeIds([]);
                 setNewDescription("");
                 setIsCreating(false);
              }}>등록하기</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask} 
          open={!!selectedTask} 
          onOpenChange={(open) => !open && setSelectedTask(null)} 
        />
      )}
    </div>
  );
}
