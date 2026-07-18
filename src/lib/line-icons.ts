import {
  Brain,
  BookOpen,
  Code2,
  Rocket,
  Target,
  Dumbbell,
  Palette,
  LineChart,
  Microscope,
  Settings2,
  PenTool,
  Cpu,
  Globe,
  Briefcase,
  GraduationCap,
  Music,
  Camera,
  Languages,
  Calculator,
  FlaskConical,
  Repeat,
  Map,
  Sparkles,
  Trophy,
  Flame,
  Layers,
  Database,
  Server,
  Wallet,
  Heart,
  type LucideIcon,
} from "lucide-react";

export const LINE_ICONS: Record<string, LucideIcon> = {
  brain: Brain,
  book: BookOpen,
  code: Code2,
  rocket: Rocket,
  target: Target,
  dumbbell: Dumbbell,
  palette: Palette,
  chart: LineChart,
  microscope: Microscope,
  settings: Settings2,
  pen: PenTool,
  cpu: Cpu,
  globe: Globe,
  briefcase: Briefcase,
  graduation: GraduationCap,
  music: Music,
  camera: Camera,
  languages: Languages,
  calculator: Calculator,
  flask: FlaskConical,
  repeat: Repeat,
  map: Map,
  sparkles: Sparkles,
  trophy: Trophy,
  flame: Flame,
  layers: Layers,
  database: Database,
  server: Server,
  wallet: Wallet,
  heart: Heart,
};

export const LINE_ICON_KEYS = Object.keys(LINE_ICONS);

const ICON_PREFIX = "icon:";

export function iconValue(key: string): string {
  return `${ICON_PREFIX}${key}`;
}

export function resolveLineIcon(value: string): LucideIcon | null {
  if (!value.startsWith(ICON_PREFIX)) return null;
  const key = value.slice(ICON_PREFIX.length);
  return LINE_ICONS[key] ?? null;
}
