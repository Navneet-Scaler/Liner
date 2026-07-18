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

/**
 * A node's own startDate, falling back to its parent's startDate when it
 * doesn't have one set directly (e.g. a sub-topic scheduled only via its
 * deadline still inherits the chapter's start for this purpose).
 */
function getEffectiveStartDate(
  node: LearningNode,
  nodes: Record<string, LearningNode>,
): string | null {
  if (node.startDate) return node.startDate;
  const parent = node.parentId ? nodes[node.parentId] : null;
  return parent?.startDate ?? null;
}

export function getUpcomingDeadlines(
  tasks: FlatTask[],
  nodes: Record<string, LearningNode>,
  days = 7,
): FlatTask[] {
  const lookaheadEnd = addDays(new Date(), days);
  return tasks
    .filter(({ node }) => {
      if (node.status === "completed" || !node.deadline) return false;
      const deadline = parseLocalDate(node.deadline);
      if (isPast(deadline) || isToday(deadline)) return false;

      // Already inside the task's own start–deadline window (e.g. a
      // sub-topic scheduled over several weeks) counts as upcoming
      // regardless of how far off the deadline itself is.
      const startIso = getEffectiveStartDate(node, nodes);
      if (startIso) {
        const start = parseLocalDate(startIso);
        if (isToday(start) || isPast(start)) return true;
      }

      // Otherwise, fall back to a fixed lookahead window on the deadline.
      return isWithinInterval(deadline, { start: new Date(), end: lookaheadEnd });
    })
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
