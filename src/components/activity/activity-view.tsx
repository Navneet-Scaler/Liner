"use client";

import { useState } from "react";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import {
  Plus,
  X,
  Trash2,
  CalendarDays,
  CalendarPlus,
  ListChecks,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useLinerStore } from "@/store/liner-store";
import { getNodeProgress } from "@/lib/progress";
import { getLineColorClasses } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { LineHeader } from "@/components/canvas/line-header";
import { getLineStats } from "@/lib/progress";
import { parseLocalDate } from "@/lib/date";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { LearningNode } from "@/lib/types";

function dayLabel(iso: string | null) {
  if (!iso) return "No date";
  const date = parseLocalDate(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

function DayCard({
  node,
  color,
  selectMode,
  selected,
  onToggleSelect,
  draggedTask,
  onDayDragStart,
  onDayDragEnd,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskDrop,
}: {
  node: LearningNode;
  color: string;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  draggedTask: { nodeId: string; itemId: string } | null;
  onDayDragStart: (nodeId: string) => void;
  onDayDragEnd: () => void;
  onTaskDragStart: (nodeId: string, itemId: string) => void;
  onTaskDragEnd: () => void;
  onTaskDrop: (targetNodeId: string, targetIndex: number) => void;
}) {
  const nodes = useLinerStore((s) => s.nodes);
  const updateNode = useLinerStore((s) => s.updateNode);
  const deleteNode = useLinerStore((s) => s.deleteNode);
  const toggleChecklistItem = useLinerStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useLinerStore((s) => s.addChecklistItem);
  const removeChecklistItem = useLinerStore((s) => s.removeChecklistItem);
  const editChecklistItem = useLinerStore((s) => s.editChecklistItem);

  const [draft, setDraft] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [taskDropIndex, setTaskDropIndex] = useState<number | null>(null);
  const colors = getLineColorClasses(color);
  const progress = getNodeProgress(nodes, node.id);
  const today = isToday(
    node.deadline ? parseLocalDate(node.deadline) : new Date(),
  );
  const overdue =
    node.deadline &&
    isPast(parseLocalDate(node.deadline)) &&
    !isToday(parseLocalDate(node.deadline)) &&
    progress < 100;

  return (
    <>
      <div
        className={cn(
          "rounded-xl border bg-card p-4",
          selected
            ? "border-transparent ring-2 ring-brand"
            : today
              ? cn("border-transparent ring-2", colors.ring)
              : "border-border",
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="group/block flex min-w-0 flex-1 items-start gap-2">
            <span
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                onDayDragStart(node.id);
              }}
              onDragEnd={onDayDragEnd}
              className="mt-0.5 shrink-0 cursor-grab opacity-0 group-hover/block:opacity-100 active:cursor-grabbing"
            >
              <GripVertical className="size-4 text-muted-foreground/40" />
            </span>
            {selectMode && (
              <Checkbox
                checked={selected}
                onCheckedChange={onToggleSelect}
                aria-label="Select this block"
                className="mt-0.5 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    today
                      ? cn(colors.bgSoft, colors.text)
                      : overdue
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {dayLabel(node.deadline)}
                </span>
                {overdue && (
                  <span className="text-[10px] font-medium text-rose-500">
                    Missed
                  </span>
                )}
              </div>
              <input
                value={node.title}
                onChange={(e) => updateNode(node.id, { title: e.target.value })}
                placeholder="Add a note for this day..."
                className="w-full truncate bg-transparent text-sm font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="text-muted-foreground hover:text-rose-500"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <Progress value={progress} className="mb-3 h-1.5" />

        <div className="space-y-1.5">
          <div className="space-y-1.5">
            {node.checklist.map((item, index) => (
              <div key={item.id} className="space-y-1.5">
                <div
                  onDragOver={(e) => {
                    if (!draggedTask) return;
                    e.preventDefault();
                    setTaskDropIndex(index);
                  }}
                  onDragLeave={() => setTaskDropIndex((curr) => (curr === index ? null : curr))}
                  onDrop={(e) => {
                    if (!draggedTask) return;
                    e.preventDefault();
                    onTaskDrop(node.id, index);
                    setTaskDropIndex(null);
                  }}
                  className={cn(
                    "h-1.5 rounded transition-colors",
                    draggedTask && taskDropIndex === index
                      ? "bg-brand/40"
                      : "bg-transparent",
                  )}
                />
                <div className="group flex items-start gap-2">
                  <span
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.effectAllowed = "move";
                      onTaskDragStart(node.id, item.id);
                    }}
                    onDragEnd={() => {
                      onTaskDragEnd();
                      setTaskDropIndex(null);
                    }}
                    className="mt-0.5 shrink-0 cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing"
                  >
                    <GripVertical className="size-3.5 text-muted-foreground/40" />
                  </span>
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={() => toggleChecklistItem(node.id, item.id)}
                    className="mt-0.5"
                  />
                  <textarea
                    value={item.text}
                    onChange={(e) =>
                      editChecklistItem(node.id, item.id, e.target.value)
                    }
                    rows={1}
                    className={cn(
                      "field-sizing-content min-h-0 flex-1 resize-none bg-transparent text-sm leading-snug outline-none",
                      item.done && "text-muted-foreground line-through",
                    )}
                  />
                  <button
                    className="mt-0.5 opacity-0 group-hover:opacity-100"
                    onClick={() => removeChecklistItem(node.id, item.id)}
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
            <div
              onDragOver={(e) => {
                if (!draggedTask) return;
                e.preventDefault();
                setTaskDropIndex(node.checklist.length);
              }}
              onDragLeave={() =>
                setTaskDropIndex((curr) =>
                  curr === node.checklist.length ? null : curr,
                )
              }
              onDrop={(e) => {
                if (!draggedTask) return;
                e.preventDefault();
                onTaskDrop(node.id, node.checklist.length);
                setTaskDropIndex(null);
              }}
              className={cn(
                "h-1.5 rounded transition-colors",
                draggedTask && taskDropIndex === node.checklist.length
                  ? "bg-brand/40"
                  : "bg-transparent",
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <Plus className="size-3.5 text-muted-foreground" />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) {
                  addChecklistItem(node.id, draft);
                  setDraft("");
                }
              }}
              placeholder="Add task..."
              className="h-7 border-none px-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`Delete ${dayLabel(node.deadline)}?`}
        description="This can't be undone."
        onConfirm={() => deleteNode(node.id)}
      />
    </>
  );
}

export function ActivityView({ lineId }: { lineId: string }) {
  const line = useLinerStore((s) => s.lines[lineId]);
  const nodes = useLinerStore((s) => s.nodes);
  const createNode = useLinerStore((s) => s.createNode);
  const deleteNode = useLinerStore((s) => s.deleteNode);
  const reorderRootNodes = useLinerStore((s) => s.reorderRootNodes);
  const updateNode = useLinerStore((s) => s.updateNode);
  const moveChecklistItem = useLinerStore((s) => s.moveChecklistItem);
  const [customDate, setCustomDate] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [draggedDayId, setDraggedDayId] = useState<string | null>(null);
  const [dayDropTarget, setDayDropTarget] = useState<{
    groupKey: string;
    index: number;
  } | null>(null);
  const [draggedTask, setDraggedTask] = useState<{
    nodeId: string;
    itemId: string;
  } | null>(null);

  if (!line) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const deleteSelected = () => {
    selectedIds.forEach((id) => deleteNode(id));
    exitSelectMode();
  };

  const days = line.rootNodeIds
    .map((id) => nodes[id])
    .filter((n): n is NonNullable<typeof n> => Boolean(n))
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });

  // Cards sharing a date are grouped under one heading and stacked
  // vertically, instead of flowing side-by-side with other dates. `days` is
  // already date-sorted above, and Map preserves insertion order, so the
  // groups come out in the same order.
  const dayGroups: { key: string; label: string; items: LearningNode[] }[] = [];
  const groupIndex = new Map<string, number>();
  for (const day of days) {
    const key = day.deadline ?? "__no_date__";
    let idx = groupIndex.get(key);
    if (idx === undefined) {
      idx = dayGroups.length;
      groupIndex.set(key, idx);
      dayGroups.push({ key, label: dayLabel(day.deadline), items: [] });
    }
    dayGroups[idx].items.push(day);
  }

  const { progress, total, completed } = getLineStats(line, nodes);
  const todayIso = format(new Date(), "yyyy-MM-dd");

  const canMoveToDate = (day: LearningNode, targetDate: string, sameDate: boolean) => {
    if (sameDate) return true;
    if (!day.deadline) return false;
    if (getNodeProgress(nodes, day.id) >= 100) return false;
    if (day.deadline < todayIso) return false;
    if (targetDate < todayIso) return false;
    return targetDate > day.deadline;
  };

  const handleDayDrop = (targetGroupKey: string, targetIndex: number) => {
    if (!draggedDayId) return;

    const draggedDay = nodes[draggedDayId];
    const targetDate = targetGroupKey === "__no_date__" ? null : targetGroupKey;
    if (!draggedDay || !targetDate) {
      setDraggedDayId(null);
      setDayDropTarget(null);
      return;
    }

    const sameDate = draggedDay.deadline === targetDate;
    if (!canMoveToDate(draggedDay, targetDate, sameDate)) {
      setDraggedDayId(null);
      setDayDropTarget(null);
      return;
    }

    const group = dayGroups.find((item) => item.key === targetGroupKey);
    if (!group) {
      setDraggedDayId(null);
      setDayDropTarget(null);
      return;
    }

    const withoutDragged = group.items.map((item) => item.id).filter((id) => id !== draggedDayId);
    const safeIndex = Math.max(0, Math.min(targetIndex, withoutDragged.length));
    const reordered = [
      ...withoutDragged.slice(0, safeIndex),
      draggedDayId,
      ...withoutDragged.slice(safeIndex),
    ];

    if (!sameDate) updateNode(draggedDayId, { deadline: targetDate });
    reorderRootNodes(line.id, reordered);

    setDraggedDayId(null);
    setDayDropTarget(null);
  };

  const handleTaskDrop = (targetNodeId: string, targetIndex: number) => {
    if (!draggedTask) return;
    moveChecklistItem(draggedTask.nodeId, targetNodeId, draggedTask.itemId, targetIndex);
    setDraggedTask(null);
  };

  // Multiple blocks for the same date (even several "Today" cards) are
  // allowed on purpose — e.g. separate cards for a morning routine vs an
  // evening one. No de-duplication here.
  const addDayForDate = (iso: string) => {
    // Title is left blank on purpose — the date pill above already shows
    // "Today"/"Tomorrow"/the date, and a hardcoded title like "Today" would
    // go stale (it'd still say "Today" a week later). The title is only for
    // an optional custom label the user types in.
    createNode({
      lineId: line.id,
      parentId: null,
      title: "",
      initial: { deadline: iso },
    });
  };

  const addDay = (offsetDays: number) => {
    addDayForDate(format(addDays(new Date(), offsetDays), "yyyy-MM-dd"));
  };

  const addCustomDay = () => {
    if (!customDate) return;
    addDayForDate(customDate);
    setCustomDate("");
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <LineHeader line={line} progress={progress} total={total} completed={completed} />

      <div className="flex-1 overflow-y-auto p-3 sm:p-5">
        {days.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <CalendarDays className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No days tracked yet</p>
              <p className="text-sm text-muted-foreground">
                Add today&apos;s activity to start your streak.
              </p>
            </div>
            <Button size="sm" className="mt-1 gap-1.5" onClick={() => addDay(0)}>
              <Plus className="size-4" />
              Add today
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={() => addDay(0)}
              >
                <Plus className="size-3.5" />
                Today
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="gap-1.5"
                onClick={() => addDay(1)}
              >
                <Plus className="size-3.5" />
                Tomorrow
              </Button>
              <div className="flex items-center gap-1.5">
                <DatePickerField
                  value={customDate || null}
                  onChange={(value) => setCustomDate(value ?? "")}
                  placeholder="Pick a date"
                  className="w-40"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 shrink-0 gap-1.5"
                  disabled={!customDate}
                  onClick={addCustomDay}
                >
                  <CalendarPlus className="size-3.5" />
                  Add
                </Button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {selectMode && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {selectedIds.size} selected
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      disabled={selectedIds.size === 0}
                      onClick={() => setConfirmBulkDeleteOpen(true)}
                    >
                      <Trash2 className="size-3.5" />
                      Delete selected
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant={selectMode ? "secondary" : "outline"}
                  className="gap-1.5"
                  onClick={() =>
                    selectMode ? exitSelectMode() : setSelectMode(true)
                  }
                >
                  {selectMode ? (
                    <X className="size-3.5" />
                  ) : (
                    <ListChecks className="size-3.5" />
                  )}
                  {selectMode ? "Cancel" : "Select"}
                </Button>
              </div>
            </div>
            <div className="flex items-start gap-4 overflow-x-auto px-1 pb-2">
              {dayGroups.map((group) => (
                <div key={group.key} className="w-72 shrink-0 sm:w-80">
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    {group.label}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {group.items.map((day, index) => (
                      <div key={day.id} className="space-y-3">
                        <div
                          onDragOver={(e) => {
                            if (!draggedDayId) return;
                            const draggedDay = nodes[draggedDayId];
                            const targetDate =
                              group.key === "__no_date__" ? null : group.key;
                            if (!draggedDay || !targetDate) return;
                            const sameDate = draggedDay.deadline === targetDate;
                            if (!canMoveToDate(draggedDay, targetDate, sameDate)) return;
                            e.preventDefault();
                            setDayDropTarget({ groupKey: group.key, index });
                          }}
                          onDrop={(e) => {
                            if (!draggedDayId) return;
                            e.preventDefault();
                            handleDayDrop(group.key, index);
                          }}
                          onDragLeave={() =>
                            setDayDropTarget((curr) =>
                              curr?.groupKey === group.key && curr.index === index
                                ? null
                                : curr,
                            )
                          }
                          className={cn(
                            "h-2 rounded transition-colors",
                            dayDropTarget?.groupKey === group.key &&
                              dayDropTarget.index === index
                              ? "bg-brand/40"
                              : "bg-transparent",
                          )}
                        />
                        <DayCard
                          node={day}
                          color={line.color}
                          selectMode={selectMode}
                          selected={selectedIds.has(day.id)}
                          onToggleSelect={() => toggleSelect(day.id)}
                          draggedTask={draggedTask}
                          onDayDragStart={(nodeId) => setDraggedDayId(nodeId)}
                          onDayDragEnd={() => {
                            setDraggedDayId(null);
                            setDayDropTarget(null);
                          }}
                          onTaskDragStart={(nodeId, itemId) =>
                            setDraggedTask({ nodeId, itemId })
                          }
                          onTaskDragEnd={() => setDraggedTask(null)}
                          onTaskDrop={handleTaskDrop}
                        />
                      </div>
                    ))}
                    <div
                      onDragOver={(e) => {
                        if (!draggedDayId) return;
                        const draggedDay = nodes[draggedDayId];
                        const targetDate = group.key === "__no_date__" ? null : group.key;
                        if (!draggedDay || !targetDate) return;
                        const sameDate = draggedDay.deadline === targetDate;
                        if (!canMoveToDate(draggedDay, targetDate, sameDate)) return;
                        e.preventDefault();
                        setDayDropTarget({
                          groupKey: group.key,
                          index: group.items.length,
                        });
                      }}
                      onDrop={(e) => {
                        if (!draggedDayId) return;
                        e.preventDefault();
                        handleDayDrop(group.key, group.items.length);
                      }}
                      onDragLeave={() =>
                        setDayDropTarget((curr) =>
                          curr?.groupKey === group.key &&
                          curr.index === group.items.length
                            ? null
                            : curr,
                        )
                      }
                      className={cn(
                        "h-2 rounded transition-colors",
                        dayDropTarget?.groupKey === group.key &&
                          dayDropTarget.index === group.items.length
                          ? "bg-brand/40"
                          : "bg-transparent",
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        onOpenChange={setConfirmBulkDeleteOpen}
        title={`Delete ${selectedIds.size} selected block${selectedIds.size === 1 ? "" : "s"}?`}
        description="This can't be undone."
        onConfirm={deleteSelected}
      />
    </div>
  );
}
