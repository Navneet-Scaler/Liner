"use client";

import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { format, isPast, isToday } from "date-fns";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  CheckCircle2,
  Circle,
  CircleDot,
  CircleSlash,
  Pin,
  ListChecks,
  CornerUpLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLinerStore } from "@/store/liner-store";
import { getNodeProgress } from "@/lib/progress";
import { getLineColorClasses, PRIORITY_CLASSES } from "@/lib/colors";
import { parseLocalDate } from "@/lib/date";
import { QuickAddPopover } from "./quick-add-popover";

const STATUS_ICONS = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CheckCircle2,
  blocked: CircleSlash,
} as const;

export type RoadmapNodeData = {
  nodeId: string;
  lineColor: string;
};

function RoadmapNodeInner({ data, selected }: NodeProps) {
  const { nodeId, lineColor } = data as unknown as RoadmapNodeData;
  const node = useLinerStore((s) => s.nodes[nodeId]);
  const nodes = useLinerStore((s) => s.nodes);
  const updateNode = useLinerStore((s) => s.updateNode);
  const createNode = useLinerStore((s) => s.createNode);
  const createNodes = useLinerStore((s) => s.createNodes);
  const toggleCollapse = useLinerStore((s) => s.toggleCollapse);
  const setSelectedNode = useLinerStore((s) => s.setSelectedNode);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node?.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (!node) return null;

  const colors = getLineColorClasses(lineColor);
  const progress = getNodeProgress(nodes, nodeId);
  const StatusIcon = STATUS_ICONS[node.status];
  const hasChildren = node.childIds.length > 0;
  const parent = node.parentId ? nodes[node.parentId] : null;

  const overdue =
    node.deadline &&
    node.status !== "completed" &&
    isPast(parseLocalDate(node.deadline)) &&
    !isToday(parseLocalDate(node.deadline));
  const dueToday =
    node.deadline &&
    node.status !== "completed" &&
    isToday(parseLocalDate(node.deadline));

  const commitTitle = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== node.title) {
      updateNode(nodeId, { title: trimmed });
    } else {
      setDraft(node.title);
    }
  };

  const nextStatus = () => {
    const order = [
      "not_started",
      "in_progress",
      "completed",
      "blocked",
    ] as const;
    const idx = order.indexOf(node.status);
    updateNode(nodeId, { status: order[(idx + 1) % order.length] });
  };

  return (
    <div
      className={cn(
        "group/node relative w-64 rounded-xl border bg-card shadow-sm",
        selected
          ? cn("ring-2", colors.ring, "border-transparent shadow-md")
          : "border-border hover:shadow-md",
      )}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNode(nodeId);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={cn("!size-2 !border-2 !bg-background", colors.border)}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn("!size-2 !border-2 !bg-background", colors.border)}
      />

      <div className={cn("h-1 w-full rounded-t-xl", colors.bgSoft)}>
        <div
          className={cn("h-1 rounded-t-xl transition-all", colors.bg)}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-start gap-1.5 p-3">
        <button
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            nextStatus();
          }}
        >
          <StatusIcon
            className={cn(
              "size-4",
              node.status === "completed" && "text-emerald-500",
              node.status === "in_progress" && "text-blue-500",
              node.status === "blocked" && "text-rose-500",
            )}
          />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") {
                  setDraft(node.title);
                  setEditing(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded border border-border bg-transparent px-1 -mx-1 text-sm font-medium outline-none focus:border-brand"
            />
          ) : (
            <p className="truncate text-sm font-medium leading-tight">
              {node.emoji && <span className="mr-1">{node.emoji}</span>}
              {node.title}
            </p>
          )}

          {node.childIds.length > 0 && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {progress}% · {node.childIds.length} sub-topic
              {node.childIds.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {node.pinned && (
          <Pin className="size-3 shrink-0 fill-current text-amber-500" />
        )}
      </div>

      {(node.priority ||
        node.deadline ||
        node.checklist.length > 0 ||
        overdue ||
        dueToday ||
        parent?.deadline) && (
        <div className="flex flex-wrap items-center gap-1 px-3 pb-2.5">
          {parent?.deadline && (
            <span
              title={`${parent.title} deadline`}
              className="flex items-center gap-0.5 rounded border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              <CornerUpLeft className="size-2.5" />
              {format(parseLocalDate(parent.deadline), "MMM d")}
            </span>
          )}
          {node.priority && (
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize",
                PRIORITY_CLASSES[node.priority],
              )}
            >
              {node.priority}
            </span>
          )}
          {node.deadline && (
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium",
                overdue
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                  : dueToday
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                    : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {format(parseLocalDate(node.deadline), "MMM d")}
            </span>
          )}
          {node.checklist.length > 0 && (
            <span className="flex items-center gap-0.5 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <ListChecks className="size-2.5" />
              {node.checklist.filter((c) => c.done).length}/
              {node.checklist.length}
            </span>
          )}
        </div>
      )}

      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapse(nodeId);
          }}
          className="absolute -right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm"
        >
          {node.collapsed ? (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </button>
      )}

      <QuickAddPopover
        align="center"
        onAdd={(titles) => {
          if (titles.length === 1) {
            const id = createNode({
              lineId: node.lineId,
              parentId: nodeId,
              title: titles[0],
            });
            setSelectedNode(id);
          } else {
            createNodes({ lineId: node.lineId, parentId: nodeId, titles });
          }
        }}
        trigger={
          <button
            onClick={(e) => e.stopPropagation()}
            title="Add sub-topic"
            className="absolute -bottom-3 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-opacity hover:border-brand hover:text-brand group-hover/node:opacity-100 data-[popup-open]:opacity-100"
          >
            <Plus className="size-3.5" />
          </button>
        }
      />
    </div>
  );
}

export const RoadmapNode = memo(RoadmapNodeInner);
