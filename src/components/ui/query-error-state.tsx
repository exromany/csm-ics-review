import type { ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Canonical "this query failed" block. Wraps {@link EmptyState} with a
 * destructive tone and a standard retry button — wire `onRetry` to the query's
 * `refetch` and `isRetrying` to its `isFetching`. Place it wherever loaded data
 * would render (inside a table cell with `py-14`, or a centered `Panel`).
 */
export const QueryErrorState = ({
  title = "Couldn't load data",
  description,
  error,
  onRetry,
  isRetrying = false,
  size = "sm",
  className,
}: {
  title?: string;
  description?: ReactNode;
  error?: Error | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  size?: "sm" | "md";
  className?: string;
}) => (
  <EmptyState
    icon={AlertTriangle}
    tone="destructive"
    size={size}
    title={title}
    description={
      description ??
      error?.message ??
      "Something went wrong while loading this data. Please try again."
    }
    action={
      onRetry ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RotateCcw className={cn("size-4", isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying…" : "Try again"}
        </Button>
      ) : undefined
    }
    className={className}
  />
);
