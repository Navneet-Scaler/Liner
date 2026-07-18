"use client";

import { format } from "date-fns";
import {
  Flame,
  ListChecks,
  Layers,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Plus,
} from "lucide-react";
import { useLinerStore } from "@/store/liner-store";
import { useAuthStore, getDisplayName } from "@/store/auth-store";
import { getLineColorClasses } from "@/lib/colors";
import { getLineStats } from "@/lib/progress";
import {
  getAllLeafTasks,
  getTodaysTasks,
  getUpcomingDeadlines,
  getOverdueTasks,
  getWeeklyActivity,
  getHeatmapData,
  getCurrentStreak,
} from "@/lib/dashboard-data";
import { NewLineDialog } from "@/components/sidebar/new-line-dialog";
import { parseLocalDate } from "@/lib/date";
import { LineIcon } from "@/components/shared/line-icon";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { cn } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="metal rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={cn("size-4", accent)} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function DashboardView() {
  const displayName = useAuthStore((s) => getDisplayName(s.user));
  const lines = useLinerStore((s) => s.lines);
  const lineOrder = useLinerStore((s) => s.lineOrder);
  const nodes = useLinerStore((s) => s.nodes);
  const setActiveLine = useLinerStore((s) => s.setActiveLine);
  const setSelectedNode = useLinerStore((s) => s.setSelectedNode);

  const activeLines = lineOrder
    .map((id) => lines[id])
    .filter((l): l is NonNullable<typeof l> => Boolean(l) && !l.archived);

  const tasks = getAllLeafTasks(lines, nodes);
  const today = getTodaysTasks(tasks);
  const upcoming = getUpcomingDeadlines(tasks, nodes);
  const overdue = getOverdueTasks(tasks);
  const weekly = getWeeklyActivity(tasks);
  const heatmap = getHeatmapData(tasks);
  const streak = getCurrentStreak(tasks);

  const overallProgress =
    activeLines.length === 0
      ? 0
      : Math.round(
          activeLines.reduce((sum, l) => sum + getLineStats(l, nodes).progress, 0) /
            activeLines.length,
        );

  if (activeLines.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand/10">
          <Layers className="size-7 text-brand" />
        </div>
        <div>
          <p className="text-lg font-medium">Hi {displayName}, welcome to Liner</p>
          <p className="text-sm text-muted-foreground">
            Create your first Learning Line to start building your roadmap.
          </p>
        </div>
        <NewLineDialog>
          <Button className="mt-1 gap-1.5">
            <Plus className="size-4" />
            New Learning Line
          </Button>
        </NewLineDialog>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 p-4 sm:space-y-6 sm:p-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Hi, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Layers} label="Learning Lines" value={activeLines.length} accent="text-brand" />
          <StatCard icon={CheckCircle2} label="Overall Progress" value={`${overallProgress}%`} accent="text-emerald-500" />
          <StatCard icon={ListChecks} label="Today's Tasks" value={today.length} accent="text-blue-500" />
          <StatCard icon={Flame} label="Current Streak" value={`${streak}d`} accent="text-amber-500" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="metal rounded-xl p-4">
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                <ListChecks className="size-4 text-blue-500" />
                Today&apos;s Plan
              </h2>
              {today.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nothing planned for today.
                </p>
              ) : (
                <div className="space-y-1">
                  {today.map(({ node, line }) => (
                    <button
                      key={node.id}
                      onClick={() => {
                        setActiveLine(line.id);
                        setSelectedNode(node.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          getLineColorClasses(line.color).bg,
                        )}
                      />
                      <span className="truncate flex-1">{node.title}</span>
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <LineIcon value={line.emoji} className="size-3" />
                        {line.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="metal rounded-xl p-4">
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                  <CalendarClock className="size-4 text-violet-500" />
                  Upcoming Deadlines
                </h2>
                {upcoming.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nothing due in the next 7 days.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {upcoming.slice(0, 6).map(({ node, line }) => (
                      <button
                        key={node.id}
                        onClick={() => {
                          setActiveLine(line.id);
                          setSelectedNode(node.id);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <span className="truncate">{node.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {format(parseLocalDate(node.deadline as string), "MMM d")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="metal rounded-xl p-4">
                <h2 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
                  <AlertTriangle className="size-4 text-rose-500" />
                  Overdue
                </h2>
                {overdue.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nothing overdue. Nice work.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {overdue.slice(0, 6).map(({ node, line }) => (
                      <button
                        key={node.id}
                        onClick={() => {
                          setActiveLine(line.id);
                          setSelectedNode(node.id);
                        }}
                        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                      >
                        <span className="truncate">{node.title}</span>
                        <span className="shrink-0 text-xs font-medium text-rose-500">
                          {format(parseLocalDate(node.deadline as string), "MMM d")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="metal rounded-xl p-4">
              <h2 className="mb-3 text-sm font-medium">Weekly Activity</h2>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weekly}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--accent)" }}
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="completed" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div className="metal rounded-xl p-4">
              <h2 className="mb-3 text-sm font-medium">Learning Lines</h2>
              <div className="space-y-3">
                {activeLines.map((line) => {
                  const { progress, total, completed } = getLineStats(line, nodes);
                  const colors = getLineColorClasses(line.color);
                  return (
                    <button
                      key={line.id}
                      onClick={() => setActiveLine(line.id)}
                      className="block w-full rounded-lg p-2 text-left hover:bg-accent"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                          <LineIcon value={line.emoji} className="size-3.5" />
                          {line.title}
                        </span>
                        <span className={cn("text-xs font-medium", colors.text)}>
                          {progress}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {completed}/{total} complete
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="metal rounded-xl p-4">
              <h2 className="mb-3 text-sm font-medium">Learning Heatmap</h2>
              <div className="grid grid-flow-col grid-rows-7 gap-1">
                {heatmap.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} completed`}
                    className={cn(
                      "size-2.5 rounded-sm",
                      day.count === 0
                        ? "bg-muted"
                        : day.count === 1
                          ? "bg-emerald-200 dark:bg-emerald-900"
                          : day.count === 2
                            ? "bg-emerald-300 dark:bg-emerald-700"
                            : day.count === 3
                              ? "bg-emerald-400 dark:bg-emerald-600"
                              : "bg-emerald-500 dark:bg-emerald-400",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
