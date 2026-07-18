"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { Download, Upload, DatabaseBackup } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLinerStore } from "@/store/liner-store";
import { IconTooltip } from "@/components/shared/icon-tooltip";

export function DataBackupMenu() {
  const exportData = useLinerStore((s) => s.exportData);
  const importData = useLinerStore((s) => s.importData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liner-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (
        !confirm(
          "This replaces everything currently in the app with the backup file. This can't be undone. Continue?",
        )
      ) {
        return;
      }
      const ok = importData(parsed);
      if (!ok) {
        alert("That file doesn't look like a valid Liner backup.");
      }
    } catch {
      alert("Couldn't read that file. Make sure it's a valid JSON backup.");
    }
  };

  return (
    <>
      <DropdownMenu>
        <IconTooltip label="Backup & restore">
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-foreground"
                aria-label="Backup & restore"
              >
                <DatabaseBackup className="size-4" />
              </Button>
            }
          />
        </IconTooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExport}>
            <Download className="size-3.5" />
            Export backup (JSON)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="size-3.5" />
            Import backup
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
