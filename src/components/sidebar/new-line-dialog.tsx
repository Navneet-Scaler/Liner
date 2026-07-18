"use client";

import { useState } from "react";
import { Map, Repeat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useLinerStore } from "@/store/liner-store";
import { LINE_ICONS, iconValue } from "@/lib/line-icons";
import { IconTooltip } from "@/components/shared/icon-tooltip";
import type { LineType } from "@/lib/types";

const ICON_PRESETS = [
  { key: "map", label: "Roadmap" },
  { key: "brain", label: "Knowledge" },
  { key: "code", label: "Programming" },
  { key: "book", label: "Reading" },
  { key: "target", label: "Goals" },
  { key: "rocket", label: "Growth" },
  { key: "graduation", label: "Academics" },
  { key: "chart", label: "Progress" },
  { key: "flask", label: "Science" },
  { key: "languages", label: "Language" },
  { key: "dumbbell", label: "Workout" },
  { key: "repeat", label: "Habit" },
].map(({ key, label }) => ({ value: iconValue(key), label }));

export function NewLineDialog({
  children,
}: {
  children: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LineType>("roadmap");
  const [emoji, setEmoji] = useState(ICON_PRESETS[0].value);
  const [description, setDescription] = useState("");
  const createLine = useLinerStore((s) => s.createLine);

  const reset = () => {
    setTitle("");
    setType("roadmap");
    setEmoji(ICON_PRESETS[0].value);
    setDescription("");
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    createLine({ title, type, emoji, description });
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger render={children} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Learning Line</DialogTitle>
          <DialogDescription>
            Give it a name and decide whether it&apos;s a structured roadmap
            or a recurring activity tracker.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="line-title">Name</Label>
            <Input
              id="line-title"
              autoFocus
              placeholder="e.g. AI Engineering, DSA, Fitness"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_PRESETS.map(({ value, label }) => {
                const key = value.slice("icon:".length);
                const Icon = LINE_ICONS[key];
                return (
                  <IconTooltip key={value} label={label}>
                    <button
                      type="button"
                      onClick={() => setEmoji(value)}
                      aria-label={label}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md border transition-colors",
                        emoji === value
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  </IconTooltip>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("roadmap")}
                className={cn(
                  "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors",
                  type === "roadmap"
                    ? "border-brand bg-brand/5"
                    : "border-border hover:bg-accent",
                )}
              >
                <Map className="size-4" />
                <span className="text-sm font-medium">Roadmap</span>
                <span className="text-xs text-muted-foreground">
                  Structured, nested concepts and milestones
                </span>
              </button>
              <button
                type="button"
                onClick={() => setType("activity")}
                className={cn(
                  "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors",
                  type === "activity"
                    ? "border-brand bg-brand/5"
                    : "border-border hover:bg-accent",
                )}
              >
                <Repeat className="size-4" />
                <span className="text-sm font-medium">Activity Tracker</span>
                <span className="text-xs text-muted-foreground">
                  Recurring daily/weekly practice
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line-desc">Description (optional)</Label>
            <Textarea
              id="line-desc"
              placeholder="What is this line about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="field-sizing-fixed h-20 resize-none overflow-y-auto"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>
            Create Line
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
