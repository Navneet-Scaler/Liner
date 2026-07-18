import { resolveLineIcon } from "@/lib/line-icons";
import { cn } from "@/lib/utils";

export function LineIcon({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const Icon = resolveLineIcon(value);
  if (Icon) {
    // eslint-disable-next-line react-hooks/static-components -- stable lookup from a fixed registry, not a component defined at render time
    return <Icon className={cn("shrink-0", className)} />;
  }
  return <span className="leading-none">{value}</span>;
}
