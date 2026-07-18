"use client";

import { SidebarContent } from "./sidebar-content";

export function AppSidebar() {
  return (
    <aside className="glass glass-distort relative hidden h-full w-64 shrink-0 flex-col border-r border-border/60 md:flex">
      <SidebarContent />
    </aside>
  );
}
