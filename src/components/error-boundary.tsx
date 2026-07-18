"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLinerStore } from "@/store/liner-store";

function downloadEmergencyBackup() {
  try {
    const data = useLinerStore.getState().exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "learning-lines-emergency-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    alert("Couldn't export data — the store itself may be corrupted.");
  }
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Learning Lines crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10">
            <AlertTriangle className="size-6 text-rose-500" />
          </div>
          <div>
            <p className="text-lg font-medium">Something went wrong</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              The app hit an unexpected error. Your data is still saved in
              this browser — export a backup before reloading if you want to
              be safe.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="gap-1.5" onClick={downloadEmergencyBackup}>
              <Download className="size-4" />
              Export backup
            </Button>
            <Button className="gap-1.5" onClick={() => window.location.reload()}>
              <RotateCcw className="size-4" />
              Reload
            </Button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-muted p-3 text-left text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
