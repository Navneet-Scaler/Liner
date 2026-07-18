export type LineType = "roadmap" | "activity";

export type NodeStatus = "not_started" | "in_progress" | "completed" | "blocked";

export type Priority = "low" | "medium" | "high" | "urgent";

export type Difficulty = "easy" | "medium" | "hard";

export type PlanBucket = "today" | "tomorrow" | "this_week" | "later" | null;

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  kind: "link" | "video" | "article" | "doc" | "course" | "github" | "book";
}

export interface LearningNode {
  id: string;
  lineId: string;
  parentId: string | null;
  childIds: string[];

  title: string;
  description: string;
  notes: string;

  status: NodeStatus;
  priority: Priority | null;
  difficulty: Difficulty | null;

  emoji: string | null;
  color: string | null;

  startDate: string | null;
  deadline: string | null;
  completedDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;

  tags: string[];
  checklist: ChecklistItem[];
  resources: ResourceLink[];
  dependsOn: string[];

  planBucket: PlanBucket;
  collapsed: boolean;
  pinned: boolean;
  archived: boolean;

  position: { x: number; y: number } | null;

  createdAt: string;
  updatedAt: string;
}

export interface LearningLine {
  id: string;
  title: string;
  type: LineType;
  emoji: string;
  color: string;
  description: string;
  rootNodeIds: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DayLogEntry {
  date: string;
  completedNodeIds: string[];
}
