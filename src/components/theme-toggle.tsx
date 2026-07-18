"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/shared/icon-tooltip";

export function ThemeToggle() {
  const toggle = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const next = isDark ? "light" : "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
    try {
      localStorage.setItem("liner-theme", next);
    } catch {}
  };

  return (
    <IconTooltip label="Toggle theme">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="size-8 text-muted-foreground hover:text-foreground"
        aria-label="Toggle theme"
      >
        <Sun className="size-4 dark:hidden" />
        <Moon className="hidden size-4 dark:block" />
      </Button>
    </IconTooltip>
  );
}
