import { create } from "zustand";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { createId } from "@/lib/id";
import { computeTreeLayout } from "@/lib/layout";
import { getDescendantIds } from "@/lib/progress";
import { iconValue } from "@/lib/line-icons";
import { parseLocalDate } from "@/lib/date";
import { useAuthStore } from "@/store/auth-store";
import {
  fetchAllForUser,
  upsertLine,
  upsertNodes,
  deleteLinesRemote,
  deleteNodesRemote,
} from "@/lib/supabase/sync";
import type { OutlineNode } from "@/lib/outline-parser";
import type {
  ChecklistItem,
  LearningLine,
  LearningNode,
  LineType,
  NodeStatus,
  PlanBucket,
  ResourceLink,
} from "@/lib/types";

const STORE_VERSION = 1;

interface BackupShape {
  lines: Record<string, LearningLine>;
  nodes: Record<string, LearningNode>;
  lineOrder: string[];
}

function validateImportedData(data: unknown): BackupShape | null {
  if (!data || typeof data !== "object") return null;
  const candidate = data as Record<string, unknown>;
  const { lines, nodes, lineOrder } = candidate;

  if (
    !lines ||
    typeof lines !== "object" ||
    Array.isArray(lines) ||
    !nodes ||
    typeof nodes !== "object" ||
    Array.isArray(nodes) ||
    !Array.isArray(lineOrder)
  ) {
    return null;
  }

  const lineEntries = Object.entries(lines as Record<string, unknown>);
  const nodeEntries = Object.entries(nodes as Record<string, unknown>);

  const isValidLine = (l: unknown): l is LearningLine =>
    Boolean(
      l &&
        typeof l === "object" &&
        typeof (l as LearningLine).id === "string" &&
        typeof (l as LearningLine).title === "string" &&
        Array.isArray((l as LearningLine).rootNodeIds),
    );

  const isValidNode = (n: unknown): n is LearningNode =>
    Boolean(
      n &&
        typeof n === "object" &&
        typeof (n as LearningNode).id === "string" &&
        typeof (n as LearningNode).lineId === "string" &&
        Array.isArray((n as LearningNode).childIds),
    );

  if (
    !lineEntries.every(([, l]) => isValidLine(l)) ||
    !nodeEntries.every(([, n]) => isValidNode(n)) ||
    !lineOrder.every((id) => typeof id === "string")
  ) {
    return null;
  }

  return {
    lines: lines as Record<string, LearningLine>,
    nodes: nodes as Record<string, LearningNode>,
    lineOrder: lineOrder as string[],
  };
}

function deriveStatusFromChecklist(
  checklist: ChecklistItem[],
  previousStatus: NodeStatus,
): NodeStatus {
  if (checklist.length === 0) return previousStatus;
  const doneCount = checklist.filter((c) => c.done).length;
  if (doneCount === checklist.length) return "completed";
  if (doneCount > 0) return "in_progress";
  return previousStatus === "blocked" ? "blocked" : "not_started";
}

const LINE_COLORS = [
  "violet",
  "blue",
  "emerald",
  "amber",
  "rose",
  "cyan",
  "fuchsia",
  "orange",
] as const;

function nowIso() {
  return new Date().toISOString();
}

/** The signed-in user's id, or null if somehow called before auth resolves. */
function currentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

function emptyNode(input: {
  id: string;
  lineId: string;
  parentId: string | null;
  title: string;
  inherit?: {
    tags: string[];
    priority: LearningNode["priority"];
    difficulty: LearningNode["difficulty"];
  };
}): LearningNode {
  const ts = nowIso();
  return {
    id: input.id,
    lineId: input.lineId,
    parentId: input.parentId,
    childIds: [],
    title: input.title,
    description: "",
    notes: "",
    status: "not_started",
    priority: input.inherit?.priority ?? null,
    difficulty: input.inherit?.difficulty ?? null,
    emoji: null,
    color: null,
    startDate: null,
    deadline: null,
    completedDate: null,
    estimatedHours: null,
    actualHours: null,
    tags: input.inherit?.tags ?? [],
    checklist: [],
    resources: [],
    dependsOn: [],
    planBucket: null,
    collapsed: false,
    pinned: false,
    archived: false,
    position: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

interface LinerState {
  lines: Record<string, LearningLine>;
  nodes: Record<string, LearningNode>;
  lineOrder: string[];
  activeLineId: string | null;
  selectedNodeId: string | null;
  hydrated: boolean;

  loadFromSupabase: (userId: string) => Promise<void>;
  resetLocal: () => void;

  createLine: (input: {
    title: string;
    type: LineType;
    emoji?: string;
    description?: string;
  }) => string;
  updateLine: (id: string, patch: Partial<LearningLine>) => void;
  deleteLine: (id: string) => void;
  togglePinLine: (id: string) => void;
  toggleArchiveLine: (id: string) => void;
  setActiveLine: (id: string | null) => void;

  createNode: (input: {
    lineId: string;
    parentId: string | null;
    title: string;
    initial?: Partial<LearningNode>;
  }) => string;
  createNodes: (input: {
    lineId: string;
    parentId: string | null;
    titles: string[];
  }) => string[];
  importOutline: (input: {
    lineId: string;
    parentId: string | null;
    outline: OutlineNode[];
  }) => string[];
  updateNode: (id: string, patch: Partial<LearningNode>) => void;
  deleteNode: (id: string) => void;
  toggleCollapse: (id: string) => void;
  setNodePosition: (id: string, position: { x: number; y: number }) => void;
  autoArrange: (lineId: string) => void;
  spreadDeadlines: (
    parentId: string,
    startIso: string,
    endIso: string,
  ) => void;

  toggleChecklistItem: (nodeId: string, itemId: string) => void;
  addChecklistItem: (nodeId: string, text: string) => void;
  removeChecklistItem: (nodeId: string, itemId: string) => void;

  addResource: (nodeId: string, resource: Omit<ResourceLink, "id">) => void;
  removeResource: (nodeId: string, resourceId: string) => void;

  setSelectedNode: (id: string | null) => void;
  setPlanBucket: (nodeId: string, bucket: PlanBucket) => void;
  toggleNodePinned: (id: string) => void;

  exportData: () => {
    format: "liner-backup";
    version: number;
    exportedAt: string;
    lines: Record<string, LearningLine>;
    nodes: Record<string, LearningNode>;
    lineOrder: string[];
  };
  importData: (data: unknown) => boolean;
}

export const useLinerStore = create<LinerState>()((set, get) => ({
  lines: {},
  nodes: {},
  lineOrder: [],
  activeLineId: null,
  selectedNodeId: null,
  hydrated: false,

  loadFromSupabase: async (userId) => {
    try {
      const { lines, nodes, lineOrder } = await fetchAllForUser(userId);
      set({
        lines: Object.fromEntries(lines.map((l) => [l.id, l])),
        nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
        lineOrder,
        hydrated: true,
      });
    } catch (error) {
      console.error("loadFromSupabase failed", error);
      set({ hydrated: true });
    }
  },

  resetLocal: () => {
    set({
      lines: {},
      nodes: {},
      lineOrder: [],
      activeLineId: null,
      selectedNodeId: null,
      hydrated: false,
    });
  },

  createLine: ({ title, type, emoji, description }) => {
    const id = createId("line");
    const ts = nowIso();
    const usedColors = Object.values(get().lines).map((l) => l.color);
    const color =
      LINE_COLORS.find((c) => !usedColors.includes(c)) ??
      LINE_COLORS[Object.keys(get().lines).length % LINE_COLORS.length];

    const line: LearningLine = {
      id,
      title: title.trim() || "Untitled Line",
      type,
      emoji:
        emoji ?? (type === "activity" ? iconValue("repeat") : iconValue("map")),
      color,
      description: description ?? "",
      rootNodeIds: [],
      pinned: false,
      archived: false,
      createdAt: ts,
      updatedAt: ts,
    };

    set((state) => ({
      lines: { ...state.lines, [id]: line },
      lineOrder: [...state.lineOrder, id],
      activeLineId: id,
    }));

    const userId = currentUserId();
    if (userId) void upsertLine(line, userId, get().lineOrder.indexOf(id));

    return id;
  },

  updateLine: (id, patch) => {
    set((state) => {
      const line = state.lines[id];
      if (!line) return state;
      return {
        lines: {
          ...state.lines,
          [id]: { ...line, ...patch, updatedAt: nowIso() },
        },
      };
    });

    const userId = currentUserId();
    const updated = get().lines[id];
    if (userId && updated) {
      void upsertLine(updated, userId, get().lineOrder.indexOf(id));
    }
  },

  deleteLine: (id) => {
    let deletedNodeIds: string[] = [];

    set((state) => {
      const line = state.lines[id];
      if (!line) return state;
      const toDelete = new Set<string>();
      const collect = (nodeId: string) => {
        toDelete.add(nodeId);
        state.nodes[nodeId]?.childIds.forEach(collect);
      };
      line.rootNodeIds.forEach(collect);
      deletedNodeIds = [...toDelete];

      const nodes = { ...state.nodes };
      toDelete.forEach((nodeId) => delete nodes[nodeId]);

      for (const [otherId, other] of Object.entries(nodes)) {
        if (other.dependsOn.some((depId) => toDelete.has(depId))) {
          nodes[otherId] = {
            ...other,
            dependsOn: other.dependsOn.filter((depId) => !toDelete.has(depId)),
          };
        }
      }

      const lines = { ...state.lines };
      delete lines[id];

      return {
        lines,
        nodes,
        lineOrder: state.lineOrder.filter((lid) => lid !== id),
        activeLineId:
          state.activeLineId === id ? null : state.activeLineId,
        selectedNodeId: toDelete.has(state.selectedNodeId ?? "")
          ? null
          : state.selectedNodeId,
      };
    });

    void deleteLinesRemote([id]);
    void deleteNodesRemote(deletedNodeIds);
  },

  togglePinLine: (id) => {
    const line = get().lines[id];
    if (!line) return;
    get().updateLine(id, { pinned: !line.pinned });
  },

  toggleArchiveLine: (id) => {
    const line = get().lines[id];
    if (!line) return;
    get().updateLine(id, { archived: !line.archived });
  },

  setActiveLine: (id) => set({ activeLineId: id, selectedNodeId: null }),

  createNode: ({ lineId, parentId, title, initial }) => {
    const id = createId("node");
    const parentSnapshot = parentId ? get().nodes[parentId] : null;
    const node: LearningNode = {
      ...emptyNode({
        id,
        lineId,
        parentId,
        title,
        inherit: parentSnapshot
          ? {
              tags: parentSnapshot.tags,
              priority: parentSnapshot.priority,
              difficulty: parentSnapshot.difficulty,
            }
          : undefined,
      }),
      ...initial,
    };

    set((state) => {
      const nodes = { ...state.nodes, [id]: node };
      let lines = state.lines;

      if (parentId) {
        const parent = state.nodes[parentId];
        if (parent) {
          nodes[parentId] = {
            ...parent,
            childIds: [...parent.childIds, id],
            updatedAt: nowIso(),
          };
        }
      } else {
        const line = state.lines[lineId];
        if (line) {
          lines = {
            ...state.lines,
            [lineId]: {
              ...line,
              rootNodeIds: [...line.rootNodeIds, id],
              updatedAt: nowIso(),
            },
          };
        }
      }

      return { nodes, lines };
    });

    const userId = currentUserId();
    if (userId) {
      const state = get();
      const toSync = [state.nodes[id]];
      if (parentId && state.nodes[parentId]) toSync.push(state.nodes[parentId]);
      void upsertNodes(toSync, userId);
      if (!parentId && state.lines[lineId]) {
        void upsertLine(state.lines[lineId], userId, state.lineOrder.indexOf(lineId));
      }
    }

    get().autoArrange(lineId);
    return id;
  },

  createNodes: ({ lineId, parentId, titles }) => {
    const cleanTitles = titles.map((t) => t.trim()).filter(Boolean);
    if (cleanTitles.length === 0) return [];

    const parentSnapshot = parentId ? get().nodes[parentId] : null;
    const inherit = parentSnapshot
      ? {
          tags: parentSnapshot.tags,
          priority: parentSnapshot.priority,
          difficulty: parentSnapshot.difficulty,
        }
      : undefined;

    const ids: string[] = [];

    set((state) => {
      const nodes = { ...state.nodes };
      let lines = state.lines;
      const newIds: string[] = [];

      cleanTitles.forEach((title) => {
        const id = createId("node");
        newIds.push(id);
        nodes[id] = emptyNode({ id, lineId, parentId, title, inherit });
      });

      if (parentId) {
        const parent = nodes[parentId];
        if (parent) {
          nodes[parentId] = {
            ...parent,
            childIds: [...parent.childIds, ...newIds],
            updatedAt: nowIso(),
          };
        }
      } else {
        const line = state.lines[lineId];
        if (line) {
          lines = {
            ...state.lines,
            [lineId]: {
              ...line,
              rootNodeIds: [...line.rootNodeIds, ...newIds],
              updatedAt: nowIso(),
            },
          };
        }
      }

      ids.push(...newIds);
      return { nodes, lines };
    });

    const userId = currentUserId();
    if (userId) {
      const state = get();
      const toSync = ids.map((nid) => state.nodes[nid]).filter(Boolean);
      if (parentId && state.nodes[parentId]) toSync.push(state.nodes[parentId]);
      void upsertNodes(toSync, userId);
      if (!parentId && state.lines[lineId]) {
        void upsertLine(state.lines[lineId], userId, state.lineOrder.indexOf(lineId));
      }
    }

    get().autoArrange(lineId);
    return ids;
  },

  importOutline: ({ lineId, parentId, outline }) => {
    if (outline.length === 0) return [];
    const topIds: string[] = [];
    const allNewIds: string[] = [];
    const ts = nowIso();

    set((state) => {
      const nodes = { ...state.nodes };
      let lines = state.lines;

      const build = (
        entry: OutlineNode,
        entryParentId: string | null,
        inherit?: {
          tags: string[];
          priority: LearningNode["priority"];
          difficulty: LearningNode["difficulty"];
        },
      ): string => {
        const id = createId("node");
        allNewIds.push(id);
        nodes[id] = emptyNode({
          id,
          lineId,
          parentId: entryParentId,
          title: entry.title,
          inherit,
        });
        const childInherit = {
          tags: nodes[id].tags,
          priority: nodes[id].priority,
          difficulty: nodes[id].difficulty,
        };
        const childIds = entry.children.map((child) =>
          build(child, id, childInherit),
        );
        nodes[id] = { ...nodes[id], childIds };
        return id;
      };

      const parentSnapshot = parentId ? nodes[parentId] : null;
      const rootInherit = parentSnapshot
        ? {
            tags: parentSnapshot.tags,
            priority: parentSnapshot.priority,
            difficulty: parentSnapshot.difficulty,
          }
        : undefined;

      outline.forEach((entry) => {
        topIds.push(build(entry, parentId, rootInherit));
      });

      if (parentId) {
        const parent = nodes[parentId];
        if (parent) {
          nodes[parentId] = {
            ...parent,
            childIds: [...parent.childIds, ...topIds],
            updatedAt: ts,
          };
        }
      } else {
        const line = state.lines[lineId];
        if (line) {
          lines = {
            ...state.lines,
            [lineId]: {
              ...line,
              rootNodeIds: [...line.rootNodeIds, ...topIds],
              updatedAt: ts,
            },
          };
        }
      }

      return { nodes, lines };
    });

    const userId = currentUserId();
    if (userId) {
      const state = get();
      const toSync = allNewIds.map((nid) => state.nodes[nid]).filter(Boolean);
      if (parentId && state.nodes[parentId]) toSync.push(state.nodes[parentId]);
      void upsertNodes(toSync, userId);
      if (!parentId && state.lines[lineId]) {
        void upsertLine(state.lines[lineId], userId, state.lineOrder.indexOf(lineId));
      }
    }

    get().autoArrange(lineId);
    return topIds;
  },

  updateNode: (id, patch) => {
    const cascadedIds: string[] = [];

    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      const ts = nowIso();
      const next = { ...node, ...patch, updatedAt: ts };
      if (patch.status === "completed" && !node.completedDate) {
        next.completedDate = ts;
      }
      if (patch.status && patch.status !== "completed") {
        next.completedDate = null;
      }

      const nodes = { ...state.nodes, [id]: next };

      // A status change on a parent cascades down to its whole subtree,
      // so marking a chapter "completed" also completes its topics.
      if (patch.status && node.childIds.length > 0) {
        const status = patch.status;
        const cascade = (nodeId: string) => {
          const child = nodes[nodeId];
          if (!child) return;
          cascadedIds.push(nodeId);
          nodes[nodeId] = {
            ...child,
            status,
            completedDate:
              status === "completed" ? (child.completedDate ?? ts) : null,
            checklist: child.checklist.map((item) => ({
              ...item,
              done: status === "completed",
            })),
            updatedAt: ts,
          };
          child.childIds.forEach(cascade);
        };
        node.childIds.forEach(cascade);
      }

      return { nodes };
    });

    const userId = currentUserId();
    const updated = get().nodes[id];
    if (userId && updated) {
      const toSync = [updated, ...cascadedIds.map((cid) => get().nodes[cid])].filter(
        Boolean,
      ) as LearningNode[];
      void upsertNodes(toSync, userId);
    }
  },

  deleteNode: (id) => {
    let toDeleteIds: string[] = [];
    const touchedOtherIds: string[] = [];
    let touchedParentId: string | null = null;
    let touchedLineId: string | null = null;

    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;

      const descendants = getDescendantIds(state.nodes, id);
      const toDelete = new Set([id, ...descendants]);
      toDeleteIds = [...toDelete];

      const nodes = { ...state.nodes };
      toDelete.forEach((nodeId) => delete nodes[nodeId]);

      // Drop any dangling dependsOn references left pointing at deleted nodes.
      for (const [otherId, other] of Object.entries(nodes)) {
        if (other.dependsOn.some((depId) => toDelete.has(depId))) {
          nodes[otherId] = {
            ...other,
            dependsOn: other.dependsOn.filter((depId) => !toDelete.has(depId)),
          };
          touchedOtherIds.push(otherId);
        }
      }

      if (node.parentId) {
        const parent = nodes[node.parentId];
        if (parent) {
          nodes[node.parentId] = {
            ...parent,
            childIds: parent.childIds.filter((cid) => cid !== id),
          };
          touchedParentId = node.parentId;
        }
      }

      let lines = state.lines;
      const line = state.lines[node.lineId];
      if (line && !node.parentId) {
        lines = {
          ...state.lines,
          [node.lineId]: {
            ...line,
            rootNodeIds: line.rootNodeIds.filter((nid) => nid !== id),
          },
        };
        touchedLineId = node.lineId;
      }

      return {
        nodes,
        lines,
        selectedNodeId:
          state.selectedNodeId && toDelete.has(state.selectedNodeId)
            ? null
            : state.selectedNodeId,
      };
    });

    const userId = currentUserId();
    void deleteNodesRemote(toDeleteIds);
    if (userId) {
      const state = get();
      const touchedIds = [
        ...touchedOtherIds,
        ...(touchedParentId ? [touchedParentId] : []),
      ];
      const toSync = touchedIds.map((tid) => state.nodes[tid]).filter(Boolean);
      if (toSync.length > 0) void upsertNodes(toSync, userId);
      if (touchedLineId && state.lines[touchedLineId]) {
        void upsertLine(
          state.lines[touchedLineId],
          userId,
          state.lineOrder.indexOf(touchedLineId),
        );
      }
    }
  },

  toggleCollapse: (id) => {
    const node = get().nodes[id];
    if (!node) return;
    get().updateNode(id, { collapsed: !node.collapsed });
    get().autoArrange(node.lineId);
  },

  setNodePosition: (id, position) => {
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      return { nodes: { ...state.nodes, [id]: { ...node, position } } };
    });

    const userId = currentUserId();
    const updated = get().nodes[id];
    if (userId && updated) void upsertNodes([updated], userId);
  },

  autoArrange: (lineId) => {
    const touchedIds: string[] = [];

    set((state) => {
      const line = state.lines[lineId];
      if (!line) return state;
      const positions = computeTreeLayout(state.nodes, line.rootNodeIds);
      const nodes = { ...state.nodes };
      for (const [nodeId, position] of Object.entries(positions)) {
        const node = nodes[nodeId];
        if (node) {
          nodes[nodeId] = { ...node, position };
          touchedIds.push(nodeId);
        }
      }
      return { nodes };
    });

    const userId = currentUserId();
    if (userId && touchedIds.length > 0) {
      const state = get();
      void upsertNodes(
        touchedIds.map((tid) => state.nodes[tid]).filter(Boolean),
        userId,
      );
    }
  },

  spreadDeadlines: (parentId, startIso, endIso) => {
    const node = get().nodes[parentId];
    if (!node || node.childIds.length === 0) return;

    const start = parseLocalDate(startIso);
    const end = parseLocalDate(endIso);
    // Inclusive day count in the range: same start/end = 1 day.
    const daysAvailable = Math.max(
      1,
      differenceInCalendarDays(end, start) + 1,
    );
    const topicCount = node.childIds.length;
    // One topic per day when there's room; once topics outnumber the
    // days, group consecutive topics onto the same day instead of
    // spreading them proportionally across the range.
    const topicsPerDay = Math.max(1, Math.ceil(topicCount / daysAvailable));
    const ts = nowIso();

    set((state) => {
      const nodes = { ...state.nodes };
      node.childIds.forEach((childId, index) => {
        const child = nodes[childId];
        if (!child) return;
        const dayIndex = Math.min(
          Math.floor(index / topicsPerDay),
          daysAvailable - 1,
        );
        nodes[childId] = {
          ...child,
          deadline: format(addDays(start, dayIndex), "yyyy-MM-dd"),
          updatedAt: ts,
        };
      });
      return { nodes };
    });

    const userId = currentUserId();
    if (userId) {
      const state = get();
      void upsertNodes(
        node.childIds.map((cid) => state.nodes[cid]).filter(Boolean),
        userId,
      );
    }
  },

  toggleChecklistItem: (nodeId, itemId) => {
    const node = get().nodes[nodeId];
    if (!node) return;
    const checklist = node.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item,
    );
    get().updateNode(nodeId, {
      checklist,
      status: deriveStatusFromChecklist(checklist, node.status),
    });
  },

  addChecklistItem: (nodeId, text) => {
    const node = get().nodes[nodeId];
    if (!node || !text.trim()) return;
    const item: ChecklistItem = {
      id: createId("check"),
      text: text.trim(),
      done: false,
    };
    const checklist = [...node.checklist, item];
    get().updateNode(nodeId, {
      checklist,
      status: deriveStatusFromChecklist(checklist, node.status),
    });
  },

  removeChecklistItem: (nodeId, itemId) => {
    const node = get().nodes[nodeId];
    if (!node) return;
    const checklist = node.checklist.filter((c) => c.id !== itemId);
    get().updateNode(nodeId, {
      checklist,
      status: deriveStatusFromChecklist(checklist, node.status),
    });
  },

  addResource: (nodeId, resource) => {
    const node = get().nodes[nodeId];
    if (!node) return;
    const entry: ResourceLink = { id: createId("res"), ...resource };
    get().updateNode(nodeId, { resources: [...node.resources, entry] });
  },

  removeResource: (nodeId, resourceId) => {
    const node = get().nodes[nodeId];
    if (!node) return;
    get().updateNode(nodeId, {
      resources: node.resources.filter((r) => r.id !== resourceId),
    });
  },

  setSelectedNode: (id) => set({ selectedNodeId: id }),

  setPlanBucket: (nodeId, bucket) => {
    get().updateNode(nodeId, { planBucket: bucket });
  },

  toggleNodePinned: (id) => {
    const node = get().nodes[id];
    if (!node) return;
    get().updateNode(id, { pinned: !node.pinned });
  },

  exportData: () => {
    const { lines, nodes, lineOrder } = get();
    return {
      format: "liner-backup",
      version: STORE_VERSION,
      exportedAt: nowIso(),
      lines,
      nodes,
      lineOrder,
    };
  },

  importData: (data) => {
    const parsed = validateImportedData(data);
    if (!parsed) return false;
    set({
      lines: parsed.lines,
      nodes: parsed.nodes,
      lineOrder: parsed.lineOrder,
      activeLineId: null,
      selectedNodeId: null,
    });

    const userId = currentUserId();
    if (userId) {
      void Promise.all(
        parsed.lineOrder.map((id, index) => {
          const line = parsed.lines[id];
          return line ? upsertLine(line, userId, index) : Promise.resolve();
        }),
      );
      void upsertNodes(Object.values(parsed.nodes), userId);
    }

    return true;
  },
}));
