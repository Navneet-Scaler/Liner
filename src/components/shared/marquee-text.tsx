"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Ticks long text right-to-left on a seamless loop when it doesn't fit its
 * box; sits still (no animation) when it does. Hovering pauses the ticker
 * (plain CSS `:hover`, see `.marquee` in globals.css) so it can be read,
 * and it resumes the moment the cursor leaves. */
export function MarqueeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const el = textRef.current;
      if (!container || !el) return;
      setOverflowing(el.scrollWidth > container.clientWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  const duration = Math.max(8, Math.min(30, text.length / 6));

  return (
    <div
      ref={containerRef}
      className={cn(overflowing && "marquee", className)}
      style={overflowing ? ({ "--marquee-duration": `${duration}s` } as React.CSSProperties) : undefined}
    >
      <div className={overflowing ? "marquee-track" : "truncate"}>
        <span ref={textRef} className={overflowing ? "pr-10" : undefined}>
          {text}
        </span>
        {overflowing && (
          <span aria-hidden className="pr-10">
            {text}
          </span>
        )}
      </div>
    </div>
  );
}
