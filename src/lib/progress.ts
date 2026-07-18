import type { LearningLine, LearningNode } from "./types";

export function getDescendantIds(
  nodes: Record<string, LearningNode>,
  nodeId: string,
): string[] {
  const node = nodes[nodeId];
  if (!node) return [];
  const result: string[] = [];
  for (const childId of node.childIds) {
    result.push(childId, ...getDescendantIds(nodes, childId));
  }
  return result;
}

export function getNodeProgress(
  nodes: Record<string, LearningNode>,
  nodeId: string,
): number {
  const node = nodes[nodeId];
  if (!node) return 0;

  if (node.childIds.length > 0) {
    const childProgress = node.childIds
      .map((id) => getNodeProgress(nodes, id))
      .filter((p) => Number.isFinite(p));
    if (childProgress.length === 0) return 0;
    return Math.round(
      childProgress.reduce((a, b) => a + b, 0) / childProgress.length,
    );
  }

  if (node.status === "completed") return 100;

  if (node.checklist.length > 0) {
    const done = node.checklist.filter((c) => c.done).length;
    return Math.round((done / node.checklist.length) * 100);
  }

  if (node.status === "in_progress") return 50;
  return 0;
}

export function getLineProgress(
  nodes: Record<string, LearningNode>,
  rootNodeIds: string[],
): number {
  if (rootNodeIds.length === 0) return 0;
  const values = rootNodeIds.map((id) => getNodeProgress(nodes, id));
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * For Activity Tracker lines, a "day" with no tasks added yet isn't 0%
 * incomplete — it's just not started. It shouldn't drag down progress or
 * inflate the total count until it actually has a task on it. Roadmap
 * lines are unaffected since a topic node is itself the unit of work.
 */
export function getEffectiveRootIds(
  line: LearningLine,
  nodes: Record<string, LearningNode>,
): string[] {
  if (line.type !== "activity") return line.rootNodeIds;
  return line.rootNodeIds.filter((id) => {
    const node = nodes[id];
    return node && node.checklist.length > 0;
  });
}

export function countNodes(
  nodes: Record<string, LearningNode>,
  rootNodeIds: string[],
): { total: number; completed: number } {
  let total = 0;
  let completed = 0;
  const visit = (id: string) => {
    const node = nodes[id];
    if (!node) return;
    total += 1;
    if (node.status === "completed") completed += 1;
    node.childIds.forEach(visit);
  };
  rootNodeIds.forEach(visit);
  return { total, completed };
}

/**
 * Activity Tracker progress is a flat pool of tasks across every day, not
 * an average of each day's own percentage — averaging per day weighs a
 * 1-task day the same as a 10-task day, so checking 1 of 3 tasks total
 * (spread across two days) should read 33%, not the ~50% you'd get from
 * averaging that day's 100% against another day's 0%.
 */
export function getActivityTaskStats(
  nodes: Record<string, LearningNode>,
  dayNodeIds: string[],
): { total: number; completed: number } {
  let total = 0;
  let completed = 0;
  dayNodeIds.forEach((id) => {
    const node = nodes[id];
    if (!node) return;
    total += node.checklist.length;
    completed += node.checklist.filter((c) => c.done).length;
  });
  return { total, completed };
}

export interface LineStats {
  progress: number;
  total: number;
  completed: number;
}

/** Single entry point for a line's header stats — picks the right math per line type. */
export function getLineStats(
  line: LearningLine,
  nodes: Record<string, LearningNode>,
): LineStats {
  const effectiveIds = getEffectiveRootIds(line, nodes);

  if (line.type === "activity") {
    const { total, completed } = getActivityTaskStats(nodes, effectiveIds);
    return {
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      total,
      completed,
    };
  }

  return {
    progress: getLineProgress(nodes, effectiveIds),
    ...countNodes(nodes, effectiveIds),
  };
}
