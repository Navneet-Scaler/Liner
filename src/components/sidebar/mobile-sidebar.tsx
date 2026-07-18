"use client";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUiStore } from "@/store/ui-store";
import { SidebarContent } from "./sidebar-content";

export function MobileSidebar() {
  const open = useUiStore((s) => s.mobileSidebarOpen);
  const setOpen = useUiStore((s) => s.setMobileSidebarOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="glass w-72 p-0 md:hidden">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
