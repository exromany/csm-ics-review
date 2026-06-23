import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The title block that opens every list and detail page. A leading icon,
 * the page title, and an optional count pill sit on one baseline-aligned row,
 * with an optional description below and optional actions trailing on the right.
 *
 * Layout follows the restrained Linear/Stripe register: actions wrap beneath the
 * title on narrow screens and pull right from the `sm` breakpoint up.
 */
export const PageHeader = ({
  title,
  description,
  count,
  actions,
  icon: Icon,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  count?: number;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
      className
    )}
  >
    <div className="space-y-1">
      <div className="flex items-center gap-2.5">
        {Icon ? <Icon className="size-5 text-muted-foreground" /> : null}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {typeof count === "number" ? (
          <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-medium tabular-nums text-muted-foreground">
            {count}
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="self-start sm:self-auto">{actions}</div> : null}
  </div>
);
