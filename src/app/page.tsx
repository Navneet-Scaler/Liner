"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { LineCanvas } from "@/components/canvas/line-canvas";
import { ActivityView } from "@/components/activity/activity-view";
import { ErrorBoundary } from "@/components/error-boundary";
import { useLinerStore } from "@/store/liner-store";

export default function Home() {
  const activeLineId = useLinerStore((s) => s.activeLineId);
  const activeLine = useLinerStore((s) =>
    s.activeLineId ? s.lines[s.activeLineId] : null,
  );

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
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
    </ErrorBoundary>
  );
}
