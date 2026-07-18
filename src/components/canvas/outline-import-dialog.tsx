"use client";

import { useMemo, useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { parseOutline, countOutlineNodes } from "@/lib/outline-parser";

const EXAMPLE = `Chapter 1: Basics
  Variables
  Data Types
  Control Flow
Chapter 2: Functions
  Arguments
  Closures
  Recursion`;

export function OutlineImportDialog({
  trigger,
  onImport,
}: {
  trigger: React.ReactElement;
  onImport: (outline: ReturnType<typeof parseOutline>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const outline = useMemo(() => parseOutline(text), [text]);
  const total = countOutlineNodes(outline);

  const submit = () => {
    if (outline.length === 0) return;
    onImport(outline);
    setText("");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setText("");
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import an outline</DialogTitle>
          <DialogDescription>
            Type or paste chapters and topics as an outline — indent with 2
            spaces (or a tab) per level, or use markdown headings (#, ##) and
            bullets (-). The whole tree is created at once.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          autoFocus
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          className="font-mono text-xs"
        />

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" />
          {total > 0
            ? `Will create ${total} node${total === 1 ? "" : "s"} (${outline.length} top-level)`
            : "Nothing to import yet"}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={outline.length === 0} className="gap-1.5">
            <FileText className="size-3.5" />
            Import {total > 0 ? total : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
