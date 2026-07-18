import { supabase } from "./client";
import type { LearningLine, LearningNode } from "@/lib/types";

interface LineRow {
  id: string;
  title: string;
  type: string;
  emoji: string;
  color: string;
  description: string;
  notes: string;
  root_node_ids: string[];
  pinned: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

interface NodeRow {
  id: string;
  line_id: string;
  parent_id: string | null;
  child_ids: string[];
  title: string;
  description: string;
  notes: string;
  status: string;
  priority: string | null;
  difficulty: string | null;
  emoji: string | null;
  color: string | null;
  start_date: string | null;
  deadline: string | null;
  completed_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  checklist: LearningNode["checklist"];
  resources: LearningNode["resources"];
  depends_on: string[];
  plan_bucket: LearningNode["planBucket"];
  collapsed: boolean;
  pinned: boolean;
  archived: boolean;
  position: LearningNode["position"];
  created_at: string;
  updated_at: string;
}

function lineToRow(line: LearningLine, userId: string, sortOrder: number) {
  return {
    id: line.id,
    user_id: userId,
    title: line.title,
    type: line.type,
    emoji: line.emoji,
    color: line.color,
    description: line.description,
    notes: line.notes,
    root_node_ids: line.rootNodeIds,
    pinned: line.pinned,
    archived: line.archived,
    sort_order: sortOrder,
    created_at: line.createdAt,
    updated_at: line.updatedAt,
  };
}

function rowToLine(row: LineRow): LearningLine {
  return {
    id: row.id,
    title: row.title,
    type: row.type as LearningLine["type"],
    emoji: row.emoji,
    color: row.color,
    description: row.description,
    notes: row.notes ?? "",
    rootNodeIds: row.root_node_ids ?? [],
    pinned: row.pinned,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function nodeToRow(node: LearningNode, userId: string) {
  return {
    id: node.id,
    user_id: userId,
    line_id: node.lineId,
    parent_id: node.parentId,
    child_ids: node.childIds,
    title: node.title,
    description: node.description,
    notes: node.notes,
    status: node.status,
    priority: node.priority,
    difficulty: node.difficulty,
    emoji: node.emoji,
    color: node.color,
    start_date: node.startDate,
    deadline: node.deadline,
    completed_date: node.completedDate,
    estimated_hours: node.estimatedHours,
    actual_hours: node.actualHours,
    tags: node.tags,
    checklist: node.checklist,
    resources: node.resources,
    depends_on: node.dependsOn,
    plan_bucket: node.planBucket,
    collapsed: node.collapsed,
    pinned: node.pinned,
    archived: node.archived,
    position: node.position,
    created_at: node.createdAt,
    updated_at: node.updatedAt,
  };
}

function rowToNode(row: NodeRow): LearningNode {
  return {
    id: row.id,
    lineId: row.line_id,
    parentId: row.parent_id,
    childIds: row.child_ids ?? [],
    title: row.title,
    description: row.description,
    notes: row.notes,
    status: row.status as LearningNode["status"],
    priority: row.priority as LearningNode["priority"],
    difficulty: row.difficulty as LearningNode["difficulty"],
    emoji: row.emoji,
    color: row.color,
    startDate: row.start_date,
    deadline: row.deadline,
    completedDate: row.completed_date,
    estimatedHours: row.estimated_hours,
    actualHours: row.actual_hours,
    tags: row.tags ?? [],
    checklist: row.checklist ?? [],
    resources: row.resources ?? [],
    dependsOn: row.depends_on ?? [],
    planBucket: row.plan_bucket,
    collapsed: row.collapsed,
    pinned: row.pinned,
    archived: row.archived,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchAllForUser(userId: string) {
  const [linesRes, nodesRes] = await Promise.all([
    supabase
      .from("lines")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true }),
    supabase.from("nodes").select("*").eq("user_id", userId),
  ]);

  if (linesRes.error) throw linesRes.error;
  if (nodesRes.error) throw nodesRes.error;

  const lineRows = (linesRes.data ?? []) as LineRow[];
  const nodeRows = (nodesRes.data ?? []) as NodeRow[];

  return {
    lines: lineRows.map(rowToLine),
    lineOrder: lineRows.map((r) => r.id),
    nodes: nodeRows.map(rowToNode),
  };
}

export async function upsertLine(
  line: LearningLine,
  userId: string,
  sortOrder: number,
) {
  const { error } = await supabase
    .from("lines")
    .upsert(lineToRow(line, userId, sortOrder));
  if (error) console.error("upsertLine failed", error);
}

export async function upsertNodes(nodes: LearningNode[], userId: string) {
  if (nodes.length === 0) return;
  const { error } = await supabase
    .from("nodes")
    .upsert(nodes.map((n) => nodeToRow(n, userId)));
  if (error) console.error("upsertNodes failed", error);
}

export async function deleteLinesRemote(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase.from("lines").delete().in("id", ids);
  if (error) console.error("deleteLinesRemote failed", error);
}

export async function deleteNodesRemote(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase.from("nodes").delete().in("id", ids);
  if (error) console.error("deleteNodesRemote failed", error);
}
