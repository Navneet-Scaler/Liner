"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { MobileTopBar } from "@/components/sidebar/mobile-topbar";
import { ErrorBoundary } from "@/components/error-boundary";
import { useLinerStore } from "@/store/liner-store";
import { useAuthStore } from "@/store/auth-store";

function ViewLoader() {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// Each view is its own chunk, loaded only when actually shown — React Flow
// (canvas) and Recharts (dashboard) are the two heaviest dependencies in
// the app, and most sessions only ever touch one of these three views.
const DashboardView = dynamic(
  () => import("@/components/dashboard/dashboard-view").then((m) => m.DashboardView),
  { loading: ViewLoader, ssr: false },
);
const LineCanvas = dynamic(
  () => import("@/components/canvas/line-canvas").then((m) => m.LineCanvas),
  { loading: ViewLoader, ssr: false },
);
const ActivityView = dynamic(
  () => import("@/components/activity/activity-view").then((m) => m.ActivityView),
  { loading: ViewLoader, ssr: false },
);

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
