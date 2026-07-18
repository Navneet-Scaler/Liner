export type LineColor =
  | "violet"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "fuchsia"
  | "orange";

interface ColorClasses {
  dot: string;
  text: string;
  bg: string;
  bgSoft: string;
  border: string;
  ring: string;
  gradient: string;
}

// Apple-system-color inspired: each mode uses its own step so the accent
// stays vivid against both a near-white and a near-black surface, rather
// than reusing one fixed hex in both. Classes are written out literally
// (not template-built) since Tailwind statically scans source for class
// names — a dynamic `bg-${hue}-500` string would never be generated.
export const LINE_COLOR_CLASSES: Record<string, ColorClasses> = {
  violet: {
    dot: "bg-indigo-500 dark:bg-indigo-400",
    text: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500 dark:bg-indigo-400",
    bgSoft: "bg-indigo-500/10 dark:bg-indigo-400/15",
    border: "border-indigo-500/30 dark:border-indigo-400/30",
    ring: "ring-indigo-500/40 dark:ring-indigo-400/40",
    gradient: "from-indigo-500/25 to-indigo-500/0 dark:from-indigo-400/25 dark:to-indigo-400/0",
  },
  blue: {
    dot: "bg-blue-500 dark:bg-blue-400",
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500 dark:bg-blue-400",
    bgSoft: "bg-blue-500/10 dark:bg-blue-400/15",
    border: "border-blue-500/30 dark:border-blue-400/30",
    ring: "ring-blue-500/40 dark:ring-blue-400/40",
    gradient: "from-blue-500/25 to-blue-500/0 dark:from-blue-400/25 dark:to-blue-400/0",
  },
  emerald: {
    dot: "bg-emerald-500 dark:bg-emerald-400",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500 dark:bg-emerald-400",
    bgSoft: "bg-emerald-500/10 dark:bg-emerald-400/15",
    border: "border-emerald-500/30 dark:border-emerald-400/30",
    ring: "ring-emerald-500/40 dark:ring-emerald-400/40",
    gradient: "from-emerald-500/25 to-emerald-500/0 dark:from-emerald-400/25 dark:to-emerald-400/0",
  },
  amber: {
    dot: "bg-amber-500 dark:bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500 dark:bg-amber-400",
    bgSoft: "bg-amber-500/10 dark:bg-amber-400/15",
    border: "border-amber-500/30 dark:border-amber-400/30",
    ring: "ring-amber-500/40 dark:ring-amber-400/40",
    gradient: "from-amber-500/25 to-amber-500/0 dark:from-amber-400/25 dark:to-amber-400/0",
  },
  rose: {
    dot: "bg-rose-500 dark:bg-rose-400",
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500 dark:bg-rose-400",
    bgSoft: "bg-rose-500/10 dark:bg-rose-400/15",
    border: "border-rose-500/30 dark:border-rose-400/30",
    ring: "ring-rose-500/40 dark:ring-rose-400/40",
    gradient: "from-rose-500/25 to-rose-500/0 dark:from-rose-400/25 dark:to-rose-400/0",
  },
  cyan: {
    dot: "bg-cyan-500 dark:bg-cyan-400",
    text: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500 dark:bg-cyan-400",
    bgSoft: "bg-cyan-500/10 dark:bg-cyan-400/15",
    border: "border-cyan-500/30 dark:border-cyan-400/30",
    ring: "ring-cyan-500/40 dark:ring-cyan-400/40",
    gradient: "from-cyan-500/25 to-cyan-500/0 dark:from-cyan-400/25 dark:to-cyan-400/0",
  },
  fuchsia: {
    dot: "bg-fuchsia-500 dark:bg-fuchsia-400",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    bg: "bg-fuchsia-500 dark:bg-fuchsia-400",
    bgSoft: "bg-fuchsia-500/10 dark:bg-fuchsia-400/15",
    border: "border-fuchsia-500/30 dark:border-fuchsia-400/30",
    ring: "ring-fuchsia-500/40 dark:ring-fuchsia-400/40",
    gradient: "from-fuchsia-500/25 to-fuchsia-500/0 dark:from-fuchsia-400/25 dark:to-fuchsia-400/0",
  },
  orange: {
    dot: "bg-orange-500 dark:bg-orange-400",
    text: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-500 dark:bg-orange-400",
    bgSoft: "bg-orange-500/10 dark:bg-orange-400/15",
    border: "border-orange-500/30 dark:border-orange-400/30",
    ring: "ring-orange-500/40 dark:ring-orange-400/40",
    gradient: "from-orange-500/25 to-orange-500/0 dark:from-orange-400/25 dark:to-orange-400/0",
  },
};

export function getLineColorClasses(color: string): ColorClasses {
  return LINE_COLOR_CLASSES[color] ?? LINE_COLOR_CLASSES.violet;
}

export const PRIORITY_CLASSES: Record<string, string> = {
  low: "text-muted-foreground border-border",
  medium: "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10 dark:bg-blue-400/15",
  high: "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 dark:bg-amber-400/15",
  urgent: "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 dark:bg-rose-400/15",
};

export const STATUS_CLASSES: Record<string, string> = {
  not_started: "text-muted-foreground border-border bg-muted/40",
  in_progress: "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10 dark:bg-blue-400/15",
  completed: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-400/15",
  blocked: "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 dark:bg-rose-400/15",
};

export const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  blocked: "Blocked",
};
