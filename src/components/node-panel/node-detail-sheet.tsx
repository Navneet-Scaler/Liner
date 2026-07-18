"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  X,
  Trash2,
  Pin,
  Link as LinkIcon,
  ExternalLink,
  CalendarRange,
} from "lucide-react";
import { useLinerStore } from "@/store/liner-store";
import { getNodeProgress } from "@/lib/progress";
import { STATUS_LABELS } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { IconTooltip } from "@/components/shared/icon-tooltip";
import type { Priority, Difficulty, NodeStatus, PlanBucket } from "@/lib/types";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function NodeDetailSheet() {
  const selectedNodeId = useLinerStore((s) => s.selectedNodeId);
  const node = useLinerStore((s) =>
    s.selectedNodeId ? s.nodes[s.selectedNodeId] : null,
  );
  const nodes = useLinerStore((s) => s.nodes);
  const updateNode = useLinerStore((s) => s.updateNode);
  const deleteNode = useLinerStore((s) => s.deleteNode);
  const setSelectedNode = useLinerStore((s) => s.setSelectedNode);
  const toggleChecklistItem = useLinerStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useLinerStore((s) => s.addChecklistItem);
  const removeChecklistItem = useLinerStore((s) => s.removeChecklistItem);
  const addResource = useLinerStore((s) => s.addResource);
  const removeResource = useLinerStore((s) => s.removeResource);
  const toggleNodePinned = useLinerStore((s) => s.toggleNodePinned);
  const spreadDeadlines = useLinerStore((s) => s.spreadDeadlines);

  const [checklistDraft, setChecklistDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [scheduleStart, setScheduleStart] = useState<string | null>(null);
  const [scheduleEnd, setScheduleEnd] = useState<string | null>(null);

  const open = Boolean(selectedNodeId && node);

  if (!node) return null;

  const progress = getNodeProgress(nodes, node.id);

  const breadcrumb: string[] = [];
  let cursor = node.parentId;
  while (cursor) {
    const parent = nodes[cursor];
    if (!parent) break;
    breadcrumb.unshift(parent.title);
    cursor = parent.parentId;
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setSelectedNode(null);
      }}
    >
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="space-y-2 pb-2">
          {breadcrumb.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              {breadcrumb.join(" / ")}
            </p>
          )}
          <SheetTitle className="sr-only">Edit node</SheetTitle>
          <Input
            value={node.title}
            onChange={(e) => updateNode(node.id, { title: e.target.value })}
            className="border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            placeholder="Untitled"
          />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {progress}% complete
            </Badge>
            <IconTooltip label={node.pinned ? "Unpin" : "Pin"}>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={node.pinned ? "Unpin" : "Pin"}
                onClick={() => toggleNodePinned(node.id)}
              >
                <Pin
                  className={cn(
                    "size-3.5",
                    node.pinned && "fill-current text-amber-500",
                  )}
                />
              </Button>
            </IconTooltip>
            <div className="flex-1" />
            <IconTooltip label="Delete">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-rose-500"
                aria-label="Delete"
                onClick={() => {
                  if (confirm(`Delete "${node.title}" and all its sub-topics?`)) {
                    deleteNode(node.id);
                  }
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </IconTooltip>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select
                value={node.status}
                onValueChange={(v) =>
                  updateNode(node.id, { status: v as NodeStatus })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Priority">
              <Select
                value={node.priority ?? "none"}
                onValueChange={(v) =>
                  updateNode(node.id, {
                    priority: v === "none" ? null : (v as Priority),
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Start date">
              <DatePickerField
                value={node.startDate}
                onChange={(value) => updateNode(node.id, { startDate: value })}
                placeholder="Set start"
              />
            </Field>

            <Field label="Deadline">
              <DatePickerField
                value={node.deadline}
                onChange={(value) => updateNode(node.id, { deadline: value })}
                placeholder="Set deadline"
              />
            </Field>

            <Field label="Est. hours">
              <Input
                type="number"
                min={0}
                className="h-8 text-xs"
                value={node.estimatedHours ?? ""}
                onChange={(e) =>
                  updateNode(node.id, {
                    estimatedHours: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
              />
            </Field>

            <Field label="Difficulty">
              <Select
                value={node.difficulty ?? "none"}
                onValueChange={(v) =>
                  updateNode(node.id, {
                    difficulty: v === "none" ? null : (v as Difficulty),
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Plan">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["today", "Today"],
                  ["tomorrow", "Tomorrow"],
                  ["this_week", "This week"],
                  ["later", "Later"],
                ] as [PlanBucket, string][]
              ).map(([value, label]) => (
                <button
                  key={label}
                  onClick={() =>
                    updateNode(node.id, {
                      planBucket: node.planBucket === value ? null : value,
                    })
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    node.planBucket === value
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {node.childIds.length > 0 && (
            <Field
              label={`Schedule ${node.childIds.length} sub-topic${node.childIds.length === 1 ? "" : "s"}`}
            >
              <div className="space-y-2 rounded-lg border border-border p-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <DatePickerField
                    value={scheduleStart}
                    onChange={setScheduleStart}
                    placeholder="Start"
                  />
                  <DatePickerField
                    value={scheduleEnd}
                    onChange={setScheduleEnd}
                    placeholder="End"
                  />
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full gap-1.5"
                  disabled={!scheduleStart || !scheduleEnd}
                  onClick={() => {
                    if (!scheduleStart || !scheduleEnd) return;
                    spreadDeadlines(node.id, scheduleStart, scheduleEnd);
                  }}
                >
                  <CalendarRange className="size-3.5" />
                  Spread deadlines evenly
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  Sets each sub-topic&apos;s deadline evenly between the two
                  dates, in order.
                </p>
              </div>
            </Field>
          )}

          <Field label="Description">
            <Textarea
              rows={2}
              placeholder="What is this about?"
              value={node.description}
              onChange={(e) =>
                updateNode(node.id, { description: e.target.value })
              }
            />
          </Field>

          <Field label="Notes">
            <Textarea
              rows={4}
              placeholder="Notes, markdown supported..."
              value={node.notes}
              onChange={(e) => updateNode(node.id, { notes: e.target.value })}
              className="font-mono text-xs"
            />
          </Field>

          <Field label="Tags">
            <div className="flex flex-wrap items-center gap-1.5">
              {node.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 font-normal">
                  {tag}
                  <button
                    onClick={() =>
                      updateNode(node.id, {
                        tags: node.tags.filter((t) => t !== tag),
                      })
                    }
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagDraft.trim()) {
                    e.preventDefault();
                    if (!node.tags.includes(tagDraft.trim())) {
                      updateNode(node.id, {
                        tags: [...node.tags, tagDraft.trim()],
                      });
                    }
                    setTagDraft("");
                  }
                }}
                placeholder="Add tag..."
                className="h-6 w-24 border-none px-1 text-xs shadow-none focus-visible:ring-0"
              />
            </div>
          </Field>

          <Separator />

          <Field label={`Checklist (${node.checklist.filter((c) => c.done).length}/${node.checklist.length})`}>
            <div className="space-y-1.5">
              {node.checklist.map((item) => (
                <div key={item.id} className="group flex items-center gap-2">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={() =>
                      toggleChecklistItem(node.id, item.id)
                    }
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      item.done && "text-muted-foreground line-through",
                    )}
                  >
                    {item.text}
                  </span>
                  <button
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => removeChecklistItem(node.id, item.id)}
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Plus className="size-3.5 text-muted-foreground" />
                <Input
                  value={checklistDraft}
                  onChange={(e) => setChecklistDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && checklistDraft.trim()) {
                      addChecklistItem(node.id, checklistDraft);
                      setChecklistDraft("");
                    }
                  }}
                  placeholder="Add checklist item..."
                  className="h-7 border-none px-0 text-sm shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          </Field>

          <Separator />

          <Field label="Resources">
            <div className="space-y-1.5">
              {node.resources.map((res) => (
                <div
                  key={res.id}
                  className="group flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm"
                >
                  <LinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate hover:underline"
                  >
                    {res.title || res.url}
                  </a>
                  <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                  <button
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => removeResource(node.id, res.id)}
                  >
                    <X className="size-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <Input
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Title"
                  className="h-7 text-xs"
                />
                <Input
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && resourceUrl.trim()) {
                      addResource(node.id, {
                        title: resourceTitle.trim() || resourceUrl.trim(),
                        url: resourceUrl.trim(),
                        kind: "link",
                      });
                      setResourceTitle("");
                      setResourceUrl("");
                    }
                  }}
                  placeholder="https://..."
                  className="h-7 text-xs"
                />
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 shrink-0"
                  disabled={!resourceUrl.trim()}
                  onClick={() => {
                    addResource(node.id, {
                      title: resourceTitle.trim() || resourceUrl.trim(),
                      url: resourceUrl.trim(),
                      kind: "link",
                    });
                    setResourceTitle("");
                    setResourceUrl("");
                  }}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
          </Field>
        </div>
      </SheetContent>
    </Sheet>
  );
}
