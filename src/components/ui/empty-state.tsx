import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The centered "no data" / "access restricted" block. A tinted circle holds the
 * icon above a title, an optional description, and optional action.
 *
 * `tone` "neutral" (default) uses muted grays; "destructive" tints the circle and
 * icon for access/permission states. `size` "sm" (default) suits empty tables;
 * "md" reads as a headline for full-panel states. The caller owns outer
 * padding/wrapping (e.g. a TableCell with `py-14`, or a Panel with `p-8`) via
 * `className`.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  size = "sm",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  tone?: "neutral" | "destructive";
  size?: "sm" | "md";
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 text-center",
      className
    )}
  >
    <div
      className={cn(
        "flex size-11 items-center justify-center rounded-full",
        tone === "destructive" ? "bg-destructive/10" : "bg-muted"
      )}
    >
      <Icon
        className={cn(
          "size-5",
          tone === "destructive" ? "text-destructive" : "text-muted-foreground"
        )}
      />
    </div>
    <div className="space-y-1">
      <p
        className={cn(
          size === "md" ? "text-base font-semibold" : "text-sm font-medium"
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {action ? <div className="mt-1">{action}</div> : null}
  </div>
);
