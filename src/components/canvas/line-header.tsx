"use client";

import { useState } from "react";
import { CheckCircle2, ListTree } from "lucide-react";
import type { LearningLine } from "@/lib/types";
import { getLineColorClasses } from "@/lib/colors";
import { useLinerStore } from "@/store/liner-store";
import { Progress } from "@/components/ui/progress";
import { LineIcon } from "@/components/shared/line-icon";

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
          {line.description && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {line.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
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
