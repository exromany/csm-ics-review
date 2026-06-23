import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Tone, toneSoft } from "./tone";

export interface SoftBadgeProps extends ComponentProps<"span"> {
  tone?: Tone;
  icon?: LucideIcon;
  size?: "sm" | "md";
}

/**
 * Soft single-tint badge with an inset ring (Stripe/Tailwind-UI register) —
 * one low-saturation hue per tone, theme-aware, no shadow. Generalizes the
 * detail-page status badge: pass a tone for the tint, an optional leading icon,
 * and free-form children for the label. Forwards native `<span>` attributes
 * (e.g. `title` for a hover tooltip) so callers don't reach around the library.
 *
 * `size` "md" (default) is the headline look; "sm" is the compact inline variant.
 */
export const SoftBadge = ({
  tone = "neutral",
  icon: Icon,
  size = "md",
  className,
  children,
  ...props
}: SoftBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md font-medium ring-1 ring-inset",
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
      toneSoft[tone],
      className
    )}
    {...props}
  >
    {Icon && <Icon className={size === "sm" ? "size-3" : "size-4"} />}
    {children}
  </span>
);
