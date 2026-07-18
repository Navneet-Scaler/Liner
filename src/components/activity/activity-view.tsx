"use client";

import { useState } from "react";
import { format, isToday, isTomorrow, isPast, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Trash2, CalendarDays, CalendarPlus } from "lucide-react";
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
import type { LearningNode } from "@/lib/types";

function dayLabel(iso: string | null) {
  if (!iso) return "No date";
  const date = parseLocalDate(iso);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

function DayCard({ node, color }: { node: LearningNode; color: string }) {
  const nodes = useLinerStore((s) => s.nodes);
  const updateNode = useLinerStore((s) => s.updateNode);
  const deleteNode = useLinerStore((s) => s.deleteNode);
  const toggleChecklistItem = useLinerStore((s) => s.toggleChecklistItem);
  const addChecklistItem = useLinerStore((s) => s.addChecklistItem);
  const removeChecklistItem = useLinerStore((s) => s.removeChecklistItem);

  const [draft, setDraft] = useState("");
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
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "rounded-xl border bg-card p-4",
        today ? cn("border-transparent ring-2", colors.ring) : "border-border",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
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
        <button
          onClick={() => {
            if (confirm(`Delete ${dayLabel(node.deadline)}?`)) deleteNode(node.id);
          }}
          className="text-muted-foreground hover:text-rose-500"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      <Progress value={progress} className="mb-3 h-1.5" />

      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {node.checklist.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="group flex items-center gap-2"
            >
              <Checkbox
                checked={item.done}
                onCheckedChange={() => toggleChecklistItem(node.id, item.id)}
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
            </motion.div>
          ))}
        </AnimatePresence>
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
    </motion.div>
  );
}

export function ActivityView({ lineId }: { lineId: string }) {
  const line = useLinerStore((s) => s.lines[lineId]);
  const nodes = useLinerStore((s) => s.nodes);
  const createNode = useLinerStore((s) => s.createNode);
  const updateNode = useLinerStore((s) => s.updateNode);
  const [customDate, setCustomDate] = useState("");

  if (!line) return null;

  const days = line.rootNodeIds
    .map((id) => nodes[id])
    .filter((n): n is NonNullable<typeof n> => Boolean(n))
    .sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    });

  const { progress, total, completed } = getLineStats(line, nodes);

  // Multiple blocks for the same date (even several "Today" cards) are
  // allowed on purpose — e.g. separate cards for a morning routine vs an
  // evening one. No de-duplication here.
  const addDayForDate = (iso: string) => {
    // Title is left blank on purpose — the date pill above already shows
    // "Today"/"Tomorrow"/the date, and a hardcoded title like "Today" would
    // go stale (it'd still say "Today" a week later). The title is only for
    // an optional custom label the user types in.
    const id = createNode({
      lineId: line.id,
      parentId: null,
      title: "",
    });
    updateNode(id, { deadline: iso });
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
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence initial={false}>
                {days.map((day) => (
                  <DayCard key={day.id} node={day} color={line.color} />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
