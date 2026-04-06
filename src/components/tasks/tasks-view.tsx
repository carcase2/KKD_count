"use client";

import { useMemo, useState } from "react";
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
import { useAppState } from "@/context/app-state";
import type { Task, TaskStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";

const COLS: { id: string; status: TaskStatus; title: string }[] = [
  { id: "col-received", status: "received", title: "접수" },
  { id: "col-progress", status: "progress", title: "진행" },
  { id: "col-done", status: "done", title: "완료" },
];

function statusFromColId(colId: string): TaskStatus | null {
  const c = COLS.find((x) => x.id === colId);
  return c?.status ?? null;
}

function DraggableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-60" : ""}>
      <Card className="cursor-grab touch-none border-slate-200/80 active:cursor-grabbing">
        <CardContent className="p-4" {...listeners} {...attributes}>
          <p className="font-semibold leading-snug text-slate-900">{task.title}</p>
          {task.assignee ? (
            <p className="mt-1.5 text-sm text-slate-500">담당: {task.assignee}</p>
          ) : null}
          {task.source === "call" ? (
            <span className="mt-2 inline-block rounded-lg bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200/60">
              전화접수
            </span>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({
  colId,
  title,
  tasks,
}: {
  colId: string;
  title: string;
  tasks: Task[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: colId });
  return (
    <div
      ref={setNodeRef}
      className={[
        "flex min-h-[300px] flex-1 flex-col gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/90 p-3 shadow-inner shadow-slate-900/[0.03]",
        isOver
          ? "border-blue-400 bg-blue-50/60 ring-2 ring-blue-300/40"
          : "",
      ].join(" ")}
    >
      <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h2>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <DraggableTaskCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

function MobileTaskList() {
  const { tasks, moveTask } = useAppState();

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = { received: [], progress: [], done: [] };
    tasks.forEach((t) => g[t.status].push(t));
    return g;
  }, [tasks]);

  const nextStatus = (s: TaskStatus): TaskStatus | null => {
    if (s === "received") return "progress";
    if (s === "progress") return "done";
    return null;
  };

  const label: Record<TaskStatus, string> = {
    received: "접수",
    progress: "진행",
    done: "완료",
  };

  return (
    <div className="space-y-6 md:hidden">
      {(["received", "progress", "done"] as TaskStatus[]).map((status) => (
        <section key={status}>
          <h2 className="mb-3 text-base font-bold text-slate-800">{label[status]}</h2>
          <div className="space-y-3">
            {grouped[status].map((task) => (
              <Card key={task.id}>
                <CardContent className="space-y-3 p-4">
                  <p className="text-base font-medium">{task.title}</p>
                  {task.description ? (
                    <p className="text-sm text-slate-500">{task.description}</p>
                  ) : null}
                  {task.assignee ? (
                    <p className="text-sm text-slate-500">담당: {task.assignee}</p>
                  ) : null}
                  {nextStatus(task.status) ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      onClick={() => void moveTask(task.id, nextStatus(task.status)!)}
                    >
                      {nextStatus(task.status) === "progress"
                        ? "진행으로 이동"
                        : "완료로 이동"}
                    </Button>
                  ) : (
                    <p className="text-sm text-slate-400">완료된 업무입니다.</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {grouped[status].length === 0 ? (
              <p className="text-sm text-slate-400">카드가 없습니다.</p>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TasksView() {
  const { tasks, moveTask, addTask } = useAppState();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const next = statusFromColId(String(over.id));
    if (!next) return;
    void moveTask(String(active.id), next);
  };

  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s);

  return (
    <div className="space-y-8">
      <PageHeader
        title="업무 관리"
        description="PC에서는 칸반 보드로 드래그해 단계를 옮기고, 모바일에서는 세로 리스트로 빠르게 처리할 수 있습니다."
      />

      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-sm font-semibold text-slate-800">업무 등록</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="task-title">제목</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="업무 제목"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="task-assignee">담당자</Label>
              <Input
                id="task-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="이름"
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => {
              if (!title.trim()) return;
              void addTask({
                title: title.trim(),
                status: "received",
                assignee: assignee.trim() || undefined,
                source: "manual",
              });
              setTitle("");
              setAssignee("");
            }}
          >
            등록하기
          </Button>
        </CardContent>
      </Card>

      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragEnd={onDragEnd}
        >
          <div className="flex flex-col gap-4 lg:flex-row">
            {COLS.map((col) => (
              <KanbanColumn
                key={col.id}
                colId={col.id}
                title={col.title}
                tasks={byStatus(col.status)}
              />
            ))}
          </div>
        </DndContext>
      </div>

      <MobileTaskList />
    </div>
  );
}
