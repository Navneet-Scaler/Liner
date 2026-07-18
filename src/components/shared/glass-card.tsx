"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  strength?: "glass" | "glass-strong" | "glass-thin";
  interactive?: boolean;
  distort?: boolean;
}

export function GlassCard({
  children,
  className,
  strength = "glass",
  interactive = true,
  distort = false,
  ...rest
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={interactive ? onPointerMove : undefined}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "relative",
        strength,
        distort && "glass-distort",
        interactive && "glass-interactive",
        className,
      )}
      {...rest}
    >
      <div className="glass-content">{children}</div>
    </motion.div>
  );
}
