"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import type { ChecklistItem, LearningNode } from "@/lib/types";

function dayLabel(iso: string | null) {
  if (!iso) return "No date";
  const date = parseLocalDate(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

type BlockDragData = { type: "block" };
type TaskDragData = { type: "task"; nodeId: string };
type GroupDropData = { type: "group"; groupKey: string };
type ChecklistEmptyDropData = { type: "checklist-empty"; nodeId: string };

// A stable reference is required: dnd-kit re-registers a draggable/droppable
// whenever its `data` object identity changes, and passing a fresh literal
// on every render triggers an internal measure -> setState -> render loop.
const BLOCK_DRAG_DATA: BlockDragData = { type: "block" };

// A slower, "ease-out expo"-style curve reads as smoother/more deliberate
// than dnd-kit's terser default for these card/task-sized reflows.
const SORTABLE_TRANSITION = {
  duration: 240,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};

const DROP_ANIMATION: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0" } },
  }),
};

type ActiveDrag =
  | { kind: "block"; node: LearningNode }
  | { kind: "task"; item: ChecklistItem; sourceNodeId: string }
  | null;

/* ---------- Task row (sortable) ---------- */

function TaskRow({
  item,
  nodeId,
  onToggle,
  onEdit,
  onRemove,
}: {
  item: ChecklistItem;
  nodeId: string;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onRemove: () => void;
}) {
  const dragData = useMemo<TaskDragData>(() => ({ type: "task", nodeId }), [nodeId]);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: dragData, transition: SORTABLE_TRANSITION });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group flex items-start gap-2", isDragging && "opacity-30")}
    >
      <span
        {...attributes}
        {...listeners}
        className="mt-0.5 shrink-0 cursor-grab touch-none opacity-0 outline-none group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="size-3.5 text-muted-foreground/40" />
      </span>
      <Checkbox
        checked={item.done}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <textarea
        value={item.text}
        onChange={(e) => onEdit(e.target.value)}
        rows={1}
        className={cn(
          "field-sizing-content min-h-0 flex-1 resize-none bg-transparent text-sm leading-snug outline-none",
          item.done && "text-muted-foreground line-through",
        )}
      />
      <button
        className="mt-0.5 opacity-0 group-hover:opacity-100"
        onClick={onRemove}
      >
        <X className="size-3 text-muted-foreground" />
      </button>
    </div>
  );
}

/* ---------- Day card (sortable block) ---------- */

function DayCard({
  node,
  color,
  selectMode,
  selected,
  onToggleSelect,
  checklistOrder,
}: {
  node: LearningNode;
  color: string;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  checklistOrder: ChecklistItem[];
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

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: node.id, data: BLOCK_DRAG_DATA, transition: SORTABLE_TRANSITION });

  const emptyChecklistDropId = `checklist-empty-${node.id}`;
  const emptyChecklistData = useMemo<ChecklistEmptyDropData>(
    () => ({ type: "checklist-empty", nodeId: node.id }),
    [node.id],
  );
  const { setNodeRef: setEmptyChecklistRef, isOver: isOverEmptyChecklist } =
    useDroppable({ id: emptyChecklistDropId, data: emptyChecklistData });

  return (
    <>
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        className={cn(
          "rounded-xl border bg-card p-4 shadow-sm transition-shadow",
          isDragging && "opacity-30",
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
              {...attributes}
              {...listeners}
              className="mt-0.5 shrink-0 cursor-grab touch-none opacity-0 outline-none group-hover/block:opacity-100 active:cursor-grabbing"
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
          <SortableContext
            items={checklistOrder.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1.5">
              {checklistOrder.map((item) => (
                <TaskRow
                  key={item.id}
                  item={item}
                  nodeId={node.id}
                  onToggle={() => toggleChecklistItem(node.id, item.id)}
                  onEdit={(text) => editChecklistItem(node.id, item.id, text)}
                  onRemove={() => removeChecklistItem(node.id, item.id)}
                />
              ))}
              {checklistOrder.length === 0 && (
                <div
                  ref={setEmptyChecklistRef}
                  className={cn(
                    "h-1.5 rounded transition-colors",
                    isOverEmptyChecklist ? "bg-brand/40" : "bg-transparent",
                  )}
                />
              )}
            </div>
          </SortableContext>
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

/* ---------- Drag overlays (floating preview) ---------- */

function BlockOverlay({ node, color }: { node: LearningNode; color: string }) {
  const colors = getLineColorClasses(color);
  return (
    <div className="w-72 scale-105 rotate-2 rounded-xl border border-border bg-card p-4 shadow-2xl ring-1 ring-black/10 sm:w-80">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-medium",
          colors.bgSoft,
          colors.text,
        )}
      >
        {dayLabel(node.deadline)}
      </span>
      <p className="mt-1.5 truncate text-sm font-medium">
        {node.title || "Untitled"}
      </p>
    </div>
  );
}

function TaskOverlay({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex w-64 scale-105 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-2xl ring-1 ring-black/10">
      <Checkbox checked={item.done} disabled />
      <span
        className={cn(
          "flex-1 truncate text-sm",
          item.done && "text-muted-foreground line-through",
        )}
      >
        {item.text || "Untitled task"}
      </span>
    </div>
  );
}

/* ---------- Date-group column (droppable fallback for "drop at end") ---------- */

function GroupColumn({
  groupKey,
  label,
  isToday,
  onTodayElement,
  children,
}: {
  groupKey: string;
  label: string;
  isToday: boolean;
  onTodayElement: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  const dropId = `group-${groupKey}`;
  const dropData = useMemo<GroupDropData>(() => ({ type: "group", groupKey }), [groupKey]);
  const { setNodeRef } = useDroppable({ id: dropId, data: dropData });

  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      setNodeRef(el);
      if (isToday) onTodayElement(el);
    },
    [setNodeRef, isToday, onTodayElement],
  );

  return (
    <div ref={combinedRef} className="w-72 shrink-0 sm:w-80">
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">{label}</h3>
      {children}
    </div>
  );
}

export function ActivityView({ lineId }: { lineId: string }) {
  const line = useLinerStore((s) => s.lines[lineId]);
  const nodes = useLinerStore((s) => s.nodes);
  const createNode = useLinerStore((s) => s.createNode);
  const deleteNode = useLinerStore((s) => s.deleteNode);
  const updateNode = useLinerStore((s) => s.updateNode);
  const reorderRootNodes = useLinerStore((s) => s.reorderRootNodes);
  const moveChecklistItem = useLinerStore((s) => s.moveChecklistItem);

  const [customDate, setCustomDate] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);

  // Live (in-progress) render order — synced from the store when idle, and
  // mutated directly during a drag so siblings shift/animate in real time
  // instead of just showing a static insertion marker.
  const [blocksByGroup, setBlocksByGroup] = useState<Record<string, string[]>>({});
  const [tasksByNode, setTasksByNode] = useState<Record<string, string[]>>({});
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const todayIso = format(new Date(), "yyyy-MM-dd");

  // Today's column stays in chronological position (past days sit to its
  // left, one slide away) but the view stays scrolled to it, so it's the
  // first thing visible — re-anchored whenever the set of date groups
  // changes (e.g. a past-dated block gets added after Today already exists).
  const todayGroupElRef = useRef<HTMLDivElement | null>(null);
  const handleTodayElement = useCallback((el: HTMLDivElement | null) => {
    todayGroupElRef.current = el;
  }, []);

  const days = useMemo(
    () =>
      (line?.rootNodeIds ?? [])
        .map((id) => nodes[id])
        .filter((n): n is NonNullable<typeof n> => Boolean(n))
        .sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.localeCompare(b.deadline);
        }),
    [line, nodes],
  );

  // Cards sharing a date are grouped under one heading and stacked
  // vertically. `days` is already date-sorted (past -> today -> future,
  // undated last), so groups come out in that same chronological order —
  // Today isn't pulled to the front here; instead the view auto-scrolls to
  // it (see the effect below), so past days stay one slide-left away.
  const dayGroups = useMemo(() => {
    const groups: { key: string; items: LearningNode[] }[] = [];
    const groupIndex = new Map<string, number>();
    for (const day of days) {
      const key = day.deadline ?? "__no_date__";
      let idx = groupIndex.get(key);
      if (idx === undefined) {
        idx = groups.length;
        groupIndex.set(key, idx);
        groups.push({ key, items: [] });
      }
      groups[idx].items.push(day);
    }
    return groups;
  }, [days]);

  const hasTodayGroup = dayGroups.some((g) => g.key === todayIso);
  // Re-anchor whenever which groups exist changes (a group added/removed
  // shifts Today's position, e.g. a past-dated block gets added after Today
  // already exists) — not just when Today itself first appears.
  const groupKeySignature = dayGroups.map((g) => g.key).join("|");

  useEffect(() => {
    if (hasTodayGroup) {
      todayGroupElRef.current?.scrollIntoView({ inline: "start", block: "nearest" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line?.id, groupKeySignature, hasTodayGroup]);

  const checklistItemsById = useMemo(() => {
    const map = new Map<string, ChecklistItem>();
    days.forEach((d) => d.checklist.forEach((item) => map.set(item.id, item)));
    return map;
  }, [days]);

  const isDragging = activeDrag !== null;

  // Re-sync the live order from the store whenever the underlying data
  // changes — but not mid-drag, or the list would jump under the cursor.
  // Done during render (React's "adjusting state" pattern) rather than in
  // an effect, so it applies before paint with no extra render/flicker.
  const syncSignature = useMemo(
    () =>
      JSON.stringify(dayGroups.map((g) => [g.key, g.items.map((d) => d.id)])) +
      "|" +
      JSON.stringify(days.map((d) => [d.id, d.checklist.map((c) => c.id)])),
    [dayGroups, days],
  );
  const [syncedSignature, setSyncedSignature] = useState("");
  if (!isDragging && syncSignature !== syncedSignature) {
    const nextBlocks: Record<string, string[]> = {};
    dayGroups.forEach((g) => {
      nextBlocks[g.key] = g.items.map((d) => d.id);
    });
    const nextTasks: Record<string, string[]> = {};
    days.forEach((d) => {
      nextTasks[d.id] = d.checklist.map((c) => c.id);
    });
    setBlocksByGroup(nextBlocks);
    setTasksByNode(nextTasks);
    setSyncedSignature(syncSignature);
  }

  // A block can be dragged forward — from the past or today onto today or
  // any later date — but never backward into the past, and not once it's
  // already done.
  const canMoveToDate = (
    day: LearningNode,
    targetDate: string,
    sameDate: boolean,
  ) => {
    if (sameDate) return true;
    if (!day.deadline) return false;
    if (getNodeProgress(nodes, day.id) >= 100) return false;
    if (targetDate < todayIso) return false;
    return targetDate > day.deadline;
  };

  const findBlockGroup = (id: string, map: Record<string, string[]>) => {
    for (const [key, ids] of Object.entries(map)) {
      if (ids.includes(id)) return key;
    }
    return null;
  };

  const findTaskNode = (id: string, map: Record<string, string[]>) => {
    for (const [nid, ids] of Object.entries(map)) {
      if (ids.includes(id)) return nid;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as BlockDragData | TaskDragData | undefined;
    if (!data) return;
    if (data.type === "block") {
      const node = nodes[event.active.id as string];
      if (node) setActiveDrag({ kind: "block", node });
    } else {
      const item = checklistItemsById.get(event.active.id as string);
      if (item) setActiveDrag({ kind: "task", item, sourceNodeId: data.nodeId });
    }
  };

  // Only handles moving an item into a DIFFERENT container. Reordering
  // within the same container is left entirely to SortableContext's own
  // live-reflow (transform-based, no state change) — manually arrayMove-ing
  // the same list here as well would fight that reflow and oscillate into
  // an infinite render loop. Same-container order is only finalized once,
  // in onDragEnd.
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeData = active.data.current as BlockDragData | TaskDragData | undefined;
    if (!activeData) return;

    if (activeData.type === "block") {
      const activeId = active.id as string;
      const overData = over.data.current as BlockDragData | GroupDropData | undefined;

      setBlocksByGroup((prev) => {
        const sourceKey = findBlockGroup(activeId, prev);
        if (!sourceKey) return prev;

        const targetKey =
          overData?.type === "block"
            ? findBlockGroup(over.id as string, prev)
            : overData?.type === "group"
              ? overData.groupKey
              : null;
        if (!targetKey || targetKey === sourceKey) return prev;

        const draggedNode = nodes[activeId];
        if (!draggedNode) return prev;
        const targetDate = targetKey === "__no_date__" ? null : targetKey;
        if (!targetDate) return prev;
        if (!canMoveToDate(draggedNode, targetDate, false)) return prev;

        const sourceIds = prev[sourceKey].filter((id) => id !== activeId);
        const overIndex =
          overData?.type === "block" ? prev[targetKey].indexOf(over.id as string) : -1;
        const insertIndex = overIndex === -1 ? prev[targetKey].length : overIndex;
        const targetIds = [...prev[targetKey]];
        targetIds.splice(insertIndex, 0, activeId);
        return { ...prev, [sourceKey]: sourceIds, [targetKey]: targetIds };
      });
    } else {
      const activeId = active.id as string;
      const overData = over.data.current as
        | TaskDragData
        | ChecklistEmptyDropData
        | undefined;

      setTasksByNode((prev) => {
        const sourceNodeId = findTaskNode(activeId, prev);
        if (!sourceNodeId) return prev;

        const targetNodeId =
          overData?.type === "task"
            ? findTaskNode(over.id as string, prev)
            : overData?.type === "checklist-empty"
              ? overData.nodeId
              : null;
        if (!targetNodeId || targetNodeId === sourceNodeId) return prev;

        const sourceIds = prev[sourceNodeId].filter((id) => id !== activeId);
        const overIndex =
          overData?.type === "task" ? (prev[targetNodeId] ?? []).indexOf(over.id as string) : -1;
        const insertIndex = overIndex === -1 ? (prev[targetNodeId]?.length ?? 0) : overIndex;
        const targetIds = [...(prev[targetNodeId] ?? [])];
        targetIds.splice(insertIndex, 0, activeId);
        return { ...prev, [sourceNodeId]: sourceIds, [targetNodeId]: targetIds };
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const data = active.data.current as BlockDragData | TaskDragData | undefined;
    setActiveDrag(null);
    if (!data || !line) return;

    if (data.type === "block") {
      const activeId = active.id as string;
      const finalKey = findBlockGroup(activeId, blocksByGroup);
      if (!finalKey) return;

      let finalIds = blocksByGroup[finalKey];
      const overData = over?.data.current as BlockDragData | GroupDropData | undefined;
      if (over && overData?.type === "block") {
        const oldIndex = finalIds.indexOf(activeId);
        const overIndex = finalIds.indexOf(over.id as string);
        if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
          finalIds = arrayMove(finalIds, oldIndex, overIndex);
          setBlocksByGroup((prev) => ({ ...prev, [finalKey]: finalIds }));
        }
      }

      const draggedNode = nodes[activeId];
      const newDeadline = finalKey === "__no_date__" ? null : finalKey;
      if (draggedNode && draggedNode.deadline !== newDeadline) {
        updateNode(activeId, { deadline: newDeadline });
      }
      reorderRootNodes(line.id, finalIds);
    } else {
      const activeId = active.id as string;
      const sourceNodeId = data.nodeId;
      const finalNodeId = findTaskNode(activeId, tasksByNode) ?? sourceNodeId;
      let finalIds = tasksByNode[finalNodeId] ?? [];

      const overData = over?.data.current as TaskDragData | ChecklistEmptyDropData | undefined;
      if (over && overData?.type === "task" && findTaskNode(over.id as string, tasksByNode) === finalNodeId) {
        const oldIndex = finalIds.indexOf(activeId);
        const overIndex = finalIds.indexOf(over.id as string);
        if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
          finalIds = arrayMove(finalIds, oldIndex, overIndex);
          setTasksByNode((prev) => ({ ...prev, [finalNodeId]: finalIds }));
        }
      }

      const finalIndex = finalIds.indexOf(activeId);
      moveChecklistItem(
        sourceNodeId,
        finalNodeId,
        activeId,
        finalIndex === -1 ? finalIds.length : finalIndex,
      );
    }
  };

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

  const { progress, total, completed } = getLineStats(line, nodes);

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveDrag(null)}
            >
              <div className="flex items-start gap-4 overflow-x-auto px-1 pb-2">
                {dayGroups.map((group) => {
                  const ids = blocksByGroup[group.key] ?? group.items.map((d) => d.id);
                  if (ids.length === 0) return null;
                  return (
                    <GroupColumn
                      key={group.key}
                      groupKey={group.key}
                      label={dayLabel(group.key === "__no_date__" ? null : group.key)}
                      isToday={group.key === todayIso}
                      onTodayElement={handleTodayElement}
                    >
                      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-col gap-3">
                          {ids.map((id) => {
                            const day = nodes[id];
                            if (!day) return null;
                            const checklistIds =
                              tasksByNode[id] ?? day.checklist.map((c) => c.id);
                            const checklistOrder = checklistIds
                              .map((cid) => checklistItemsById.get(cid))
                              .filter((c): c is ChecklistItem => Boolean(c));
                            return (
                              <DayCard
                                key={id}
                                node={day}
                                color={line.color}
                                selectMode={selectMode}
                                selected={selectedIds.has(id)}
                                onToggleSelect={() => toggleSelect(id)}
                                checklistOrder={checklistOrder}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </GroupColumn>
                  );
                })}
              </div>
              <DragOverlay dropAnimation={DROP_ANIMATION}>
                {activeDrag?.kind === "block" && (
                  <BlockOverlay node={activeDrag.node} color={line.color} />
                )}
                {activeDrag?.kind === "task" && <TaskOverlay item={activeDrag.item} />}
              </DragOverlay>
            </DndContext>
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
