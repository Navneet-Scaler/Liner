"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  Map,
  Repeat,
  MoreHorizontal,
  Pin,
  Archive,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLinerStore } from "@/store/liner-store";
import { getLineColorClasses } from "@/lib/colors";
import { getLineStats } from "@/lib/progress";
import { NewLineDialog } from "./new-line-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { DataBackupMenu } from "./data-backup-menu";
import { LineIcon } from "@/components/shared/line-icon";

export function AppSidebar() {
  const lines = useLinerStore((s) => s.lines);
  const lineOrder = useLinerStore((s) => s.lineOrder);
  const nodes = useLinerStore((s) => s.nodes);
  const activeLineId = useLinerStore((s) => s.activeLineId);
  const setActiveLine = useLinerStore((s) => s.setActiveLine);
  const togglePinLine = useLinerStore((s) => s.togglePinLine);
  const toggleArchiveLine = useLinerStore((s) => s.toggleArchiveLine);
  const deleteLine = useLinerStore((s) => s.deleteLine);

  const visibleLines = lineOrder
    .map((id) => lines[id])
    .filter((l): l is NonNullable<typeof l> => Boolean(l) && !l.archived);

  const pinned = visibleLines.filter((l) => l.pinned);
  const rest = visibleLines.filter((l) => !l.pinned);

  const renderLine = (line: (typeof visibleLines)[number]) => {
    const colors = getLineColorClasses(line.color);
    const { progress } = getLineStats(line, nodes);
    const isActive = activeLineId === line.id;

    return (
      <div
        key={line.id}
        role="button"
        onClick={() => setActiveLine(line.id)}
        className={cn(
          "group relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm cursor-pointer transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        <LineIcon value={line.emoji} className="size-4" />
        <span className="flex-1 truncate font-medium">{line.title}</span>
        {line.type === "activity" ? (
          <Repeat className="size-3 shrink-0 opacity-50" />
        ) : (
          <Map className="size-3 shrink-0 opacity-50" />
        )}

        <div className="relative size-4 shrink-0">
          <svg viewBox="0 0 16 16" className="size-4 -rotate-90">
            <circle
              cx="8"
              cy="8"
              r="6.5"
              fill="none"
              strokeWidth="2.5"
              className="stroke-border"
            />
            <circle
              cx="8"
              cy="8"
              r="6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 6.5}
              strokeDashoffset={
                2 * Math.PI * 6.5 * (1 - progress / 100)
              }
              className={colors.text}
            />
          </svg>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => e.stopPropagation()}
                className="size-6 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            }
          />
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => togglePinLine(line.id)}>
              <Pin className="size-3.5" />
              {line.pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleArchiveLine(line.id)}>
              <Archive className="size-3.5" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (confirm(`Delete "${line.title}"? This can't be undone.`)) {
                  deleteLine(line.id);
                }
              }}
            >
              <Trash2 className="size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <aside className="glass glass-distort relative flex h-full w-64 shrink-0 flex-col border-r border-border/60 text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-brand text-brand-foreground">
          <Sparkles className="size-4" />
        </div>
        <span className="font-semibold tracking-tight">Learning Lines</span>
      </div>

      <div className="px-2">
        <button
          onClick={() => setActiveLine(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
            activeLineId === null
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
          )}
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </button>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        {visibleLines.length === 0 ? (
          <div className="px-2.5 py-6 text-center">
            <p className="text-xs text-muted-foreground">
              No learning lines yet.
              <br />
              Create your first one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pinned.length > 0 && (
              <div className="space-y-0.5">
                <div className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  Pinned
                </div>
                <AnimatePresence initial={false}>
                  {pinned.map((line) => (
                    <motion.div
                      key={line.id}
                      layout
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {renderLine(line)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center justify-between px-2.5 pb-1">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  Learning Lines
                </span>
              </div>
              <AnimatePresence initial={false}>
                {rest.map((line) => (
                  <motion.div
                    key={line.id}
                    layout
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {renderLine(line)}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="space-y-2 border-t border-border p-3">
        <NewLineDialog>
          <Button className="w-full justify-start gap-2" size="sm">
            <Plus className="size-4" />
            New Learning Line
          </Button>
        </NewLineDialog>
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {visibleLines.length} line{visibleLines.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-0.5">
            <DataBackupMenu />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}
