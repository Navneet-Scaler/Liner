"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/shared/icon-tooltip";

export function QuickAddPopover({
  trigger,
  onAdd,
  placeholder = "Topic 1\nTopic 2\nTopic 3",
  align = "start",
  tooltipLabel,
}: {
  trigger: React.ReactElement;
  onAdd: (titles: string[]) => void;
  placeholder?: string;
  align?: "start" | "center" | "end";
  tooltipLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const titles = text
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const submit = () => {
    if (titles.length === 0) return;
    onAdd(titles);
    setText("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setText("");
      }}
    >
      {tooltipLabel && !open ? (
        <IconTooltip label={tooltipLabel}>
          <PopoverTrigger render={trigger} />
        </IconTooltip>
      ) : (
        <PopoverTrigger render={trigger} />
      )}
      <PopoverContent align={align} className="w-72 p-3">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Add topics
        </p>
        <Textarea
          autoFocus
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="field-sizing-fixed h-24 resize-none overflow-y-auto text-sm"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            One per line · Shift+Enter for a new line
          </p>
          <Button size="sm" className="h-7 gap-1" disabled={titles.length === 0} onClick={submit}>
            <Plus className="size-3.5" />
            Add {titles.length > 0 ? titles.length : ""}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
