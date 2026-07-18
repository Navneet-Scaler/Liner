"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/store/ui-store";

/** Persistent mobile app bar: hamburger + brand. The active view (Dashboard,
 * roadmap, activity tracker) shows its own title/stats below this, so this
 * bar stays constant rather than duplicating that text. */
export function MobileTopBar() {
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <div className="glass glass-distort relative z-10 flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        aria-label="Open menu"
        onClick={() => setMobileSidebarOpen(true)}
      >
        <Menu className="size-4" />
      </Button>
      <div className="flex items-center gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element -- the favicon (src/app/icon.svg) served as-is, not an optimizable content image */}
        <img src="/icon.svg" alt="Liner" className="size-6" />
        <span className="text-sm font-semibold tracking-tight">Liner</span>
      </div>
    </div>
  );
}
