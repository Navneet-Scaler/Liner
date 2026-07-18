"use client";

import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { MobileTopBar } from "@/components/sidebar/mobile-topbar";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { LineCanvas } from "@/components/canvas/line-canvas";
import { ActivityView } from "@/components/activity/activity-view";
import { ErrorBoundary } from "@/components/error-boundary";
import { useLinerStore } from "@/store/liner-store";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
  const authStatus = useAuthStore((s) => s.status);
  const hydrated = useLinerStore((s) => s.hydrated);
  const activeLineId = useLinerStore((s) => s.activeLineId);
  const activeLine = useLinerStore((s) =>
    s.activeLineId ? s.lines[s.activeLineId] : null,
  );

  if (authStatus !== "authed" || !hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
        <AppSidebar />
        <MobileSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileTopBar />
          <main className="flex flex-1 flex-col overflow-hidden">
            {!activeLineId || !activeLine ? (
              <DashboardView />
            ) : activeLine.type === "roadmap" ? (
              <LineCanvas lineId={activeLine.id} />
            ) : (
              <ActivityView lineId={activeLine.id} />
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
