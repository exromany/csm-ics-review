import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type Tone, toneDot } from "./tone";

/**
 * Shared surface primitive for the Linear/Stripe visual system.
 *
 * A single bordered card with the soft `shadow-panel` elevation (defined in
 * App.css, reset to flat in dark mode where the hairline border carries the
 * edge). Use this instead of stacking shadcn `Card`s — it gives one clean
 * surface to compose toolbars, tables, and footers inside, and clips children
 * to the rounded corners when `overflow-hidden` is added.
 */
export const Panel = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn("rounded-xl border bg-card shadow-panel", className)}>
    {children}
  </div>
);

/** Back-compat alias — older call sites import `StatusTone` from here. */
export type StatusTone = Tone;

/**
 * Restrained status marker: a neutral pill that carries meaning through a single
 * colored dot rather than a saturated fill. This is the Linear pattern — legible
 * in both themes with no per-status tint juggling, and it keeps the palette
 * disciplined (color appears only as a small dot).
 *
 * `size` "sm" (default) is the compact list/inline look; "md" is the roomier
 * variant for headline contexts.
 */
export const StatusPill = ({
  tone = "neutral",
  size = "sm",
  className,
  children,
}: {
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md border bg-card font-medium text-foreground",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
      className
    )}
  >
    <span
      className={cn(
        "rounded-full",
        size === "sm" ? "size-1.5" : "size-2",
        toneDot[tone]
      )}
      aria-hidden
    />
    {children}
  </span>
);
