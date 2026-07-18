"use client";

import { useState } from "react";
import { CheckCircle2, ListTree, NotebookPen } from "lucide-react";
import type { LearningLine } from "@/lib/types";
import { getLineColorClasses } from "@/lib/colors";
import { useLinerStore } from "@/store/liner-store";
import { Progress } from "@/components/ui/progress";
import { LineIcon } from "@/components/shared/line-icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { IconTooltip } from "@/components/shared/icon-tooltip";
import { MarqueeText } from "@/components/shared/marquee-text";

export function LineHeader({
  line,
  progress,
  total,
  completed,
}: {
  line: LearningLine;
  progress: number;
  total: number;
  completed: number;
}) {
  const updateLine = useLinerStore((s) => s.updateLine);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(line.title);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descDraft, setDescDraft] = useState(line.description);
  const [notesDraft, setNotesDraft] = useState(line.notes);
  const [notesOpen, setNotesOpen] = useState(false);

  const colors = getLineColorClasses(line.color);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== line.title) {
      updateLine(line.id, { title: trimmed });
    } else {
      setDraft(line.title);
    }
  };

  const commitDescriptionEdit = () => {
    setEditingDescription(false);
    const trimmed = descDraft.trim();
    if (trimmed !== line.description) {
      updateLine(line.id, { description: trimmed });
    }
  };

  const commitNotes = () => {
    if (notesDraft !== line.notes) {
      updateLine(line.id, { notes: notesDraft });
    }
  };

  return (
    <div className="glass glass-distort relative z-10 flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-3">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-9 ${colors.bgSoft} ${colors.text}`}>
          <LineIcon value={line.emoji} className="size-4" />
        </div>
        <div className="min-w-0">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setDraft(line.title);
                  setEditing(false);
                }
              }}
              className="rounded border border-border bg-transparent px-1 -mx-1 text-base font-semibold outline-none focus:border-brand sm:text-lg"
            />
          ) : (
            <h1
              className="cursor-text truncate text-base font-semibold leading-tight sm:text-lg"
              onClick={() => setEditing(true)}
              onDoubleClick={() => setEditing(true)}
            >
              {line.title}
            </h1>
          )}
          {editingDescription ? (
            <input
              autoFocus
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={commitDescriptionEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDescriptionEdit();
                if (e.key === "Escape") {
                  setDescDraft(line.description);
                  setEditingDescription(false);
                }
              }}
              placeholder="Add a short description..."
              className="hidden w-full truncate rounded border border-border bg-transparent px-1 -mx-1 text-xs text-muted-foreground outline-none focus:border-brand sm:block"
            />
          ) : (
            <div
              className="hidden cursor-text sm:block"
              onClick={() => {
                setDescDraft(line.description);
                setEditingDescription(true);
              }}
            >
              {line.description ? (
                <MarqueeText
                  text={line.description}
                  className="text-xs text-muted-foreground"
                />
              ) : (
                <p className="text-xs text-muted-foreground/50">
                  Add a short description...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <Popover
          open={notesOpen}
          onOpenChange={(next) => {
            setNotesOpen(next);
            if (next) setNotesDraft(line.notes);
            else commitNotes();
          }}
        >
          <IconTooltip label="Notes">
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Notes"
                  className={`size-8 ${line.notes ? colors.text : "text-muted-foreground"}`}
                >
                  <NotebookPen className="size-4" />
                </Button>
              }
            />
          </IconTooltip>
          <PopoverContent align="center" className="w-96 gap-1.5 p-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              Notes
            </span>
            <Textarea
              value={notesDraft ?? ""}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={commitNotes}
              placeholder="Jot down notes for this line..."
              className="field-sizing-fixed h-48 resize-none overflow-y-auto text-sm"
            />
          </PopoverContent>
        </Popover>
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
          <ListTree className="size-3.5" />
          {total} {line.type === "activity" ? "task" : "node"}
          {total === 1 ? "" : "s"}
        </div>
        <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <CheckCircle2 className="size-3.5" />
          {completed}/{total} done
        </div>
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-1.5 w-14 sm:w-24" />
          <span className={`w-8 text-right text-xs font-medium sm:w-9 ${colors.text}`}>
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
