import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The centered spinner shown while a page or panel loads. Fills a tall viewport
 * slot (`min-h-[60vh]`) by default so it reads as the page's primary state;
 * override the height via `className` when embedding in a smaller region.
 */
export const LoadingState = ({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) => (
  <div
    className={cn("flex min-h-[60vh] items-center justify-center", className)}
  >
    <div className="flex flex-col items-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  </div>
);
