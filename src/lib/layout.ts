import type { LearningNode } from "./types";

export const COL_WIDTH = 320;
export const ROW_HEIGHT = 150;

/**
 * Lays out the tree left-to-right by depth. Collapsed nodes are treated as
 * leaves so their (hidden) descendants don't reserve vertical space —
 * otherwise re-arranging after collapsing leaves large empty gaps.
 */
export function computeTreeLayout(
  nodes: Record<string, LearningNode>,
  rootNodeIds: string[],
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  let leafCounter = 0;

  const assign = (id: string, depth: number): number => {
    const node = nodes[id];
    if (!node) return leafCounter;

    if (node.childIds.length === 0 || node.collapsed) {
      const y = leafCounter * ROW_HEIGHT;
      leafCounter += 1;
      positions[id] = { x: depth * COL_WIDTH, y };
      return y;
    }

    const childYs = node.childIds.map((childId) => assign(childId, depth + 1));
    const y = childYs.reduce((a, b) => a + b, 0) / childYs.length;
    positions[id] = { x: depth * COL_WIDTH, y };
    return y;
  };

  rootNodeIds.forEach((id) => assign(id, 0));
  return positions;
}
