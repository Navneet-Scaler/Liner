import { isToday, isPast, isWithinInterval, addDays, format, subDays } from "date-fns";
import type { LearningLine, LearningNode } from "./types";
import { parseLocalDate } from "./date";

export interface FlatTask {
  node: LearningNode;
  line: LearningLine;
}

export function getAllLeafTasks(
  lines: Record<string, LearningLine>,
  nodes: Record<string, LearningNode>,
): FlatTask[] {
  const result: FlatTask[] = [];
  Object.values(lines).forEach((line) => {
    if (line.archived) return;
    Object.values(nodes).forEach((node) => {
      if (node.lineId === line.id) {
        result.push({ node, line });
      }
    });
  });
  return result;
}

export function getTodaysTasks(tasks: FlatTask[]): FlatTask[] {
  return tasks.filter(
    ({ node }) =>
      node.status !== "completed" &&
      (node.planBucket === "today" ||
        (node.deadline && isToday(parseLocalDate(node.deadline)))),
  );
}

export function getUpcomingDeadlines(tasks: FlatTask[], days = 7): FlatTask[] {
  const end = addDays(new Date(), days);
  return tasks
    .filter(
      ({ node }) =>
        node.status !== "completed" &&
        node.deadline &&
        !isPast(parseLocalDate(node.deadline)) &&
        !isToday(parseLocalDate(node.deadline)) &&
        isWithinInterval(parseLocalDate(node.deadline), {
          start: new Date(),
          end,
        }),
    )
    .sort((a, b) => (a.node.deadline ?? "").localeCompare(b.node.deadline ?? ""));
}

export function getOverdueTasks(tasks: FlatTask[]): FlatTask[] {
  return tasks
    .filter(
      ({ node }) =>
        node.status !== "completed" &&
        node.deadline &&
        isPast(parseLocalDate(node.deadline)) &&
        !isToday(parseLocalDate(node.deadline)),
    )
    .sort((a, b) => (a.node.deadline ?? "").localeCompare(b.node.deadline ?? ""));
}

export function getCompletedToday(tasks: FlatTask[]): FlatTask[] {
  return tasks.filter(
    ({ node }) => node.completedDate && isToday(new Date(node.completedDate)),
  );
}

export function getHeatmapData(tasks: FlatTask[], weeks = 14) {
  const days: { date: string; count: number }[] = [];
  const totalDays = weeks * 7;
  const counts = new Map<string, number>();

  tasks.forEach(({ node }) => {
    if (node.completedDate) {
      const key = format(new Date(node.completedDate), "yyyy-MM-dd");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  });

  for (let i = totalDays - 1; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const key = format(date, "yyyy-MM-dd");
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  return days;
}

export function getWeeklyActivity(tasks: FlatTask[]) {
  const result: { day: string; completed: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const key = format(date, "yyyy-MM-dd");
    const completed = tasks.filter(
      ({ node }) =>
        node.completedDate &&
        format(new Date(node.completedDate), "yyyy-MM-dd") === key,
    ).length;
    result.push({ day: format(date, "EEE"), completed });
  }
  return result;
}

export function getCurrentStreak(tasks: FlatTask[]): number {
  const completedDates = new Set(
    tasks
      .filter(({ node }) => node.completedDate)
      .map(({ node }) => format(new Date(node.completedDate as string), "yyyy-MM-dd")),
  );

  let streak = 0;
  let cursor = new Date();
  if (!completedDates.has(format(cursor, "yyyy-MM-dd"))) {
    cursor = subDays(cursor, 1);
  }
  while (completedDates.has(format(cursor, "yyyy-MM-dd"))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}
