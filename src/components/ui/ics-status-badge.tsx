import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toneIcon } from "./tone";
import type { IcsStatus } from "../../hooks/useIcsStatus";

interface IcsStatusBadgeProps {
  status?: IcsStatus;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}

/**
 * Neutral pill base shared by every ICS state — the small leading icon carries
 * the meaning (and the only color), keeping the badge restrained in both themes
 * rather than relying on saturated tinted backgrounds.
 */
const base =
  "inline-flex items-center gap-1.5 rounded-md border bg-card px-2 py-0.5 text-xs font-medium text-foreground";

export const IcsStatusBadge = ({
  status,
  isLoading,
  isError,
  className,
}: IcsStatusBadgeProps) => {
  if (isLoading) {
    return (
      <span className={cn(base, "text-muted-foreground", className)}>
        <Loader2 className="size-3 animate-spin" />
        Checking ICS
      </span>
    );
  }

  if (isError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn(base, "cursor-help", className)}>
              <AlertTriangle className={cn("size-3", toneIcon.amber)} />
              ICS check failed
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>RPC or IPFS error. Click the retry button to try again.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status === "ICS") {
    return (
      <span className={cn(base, className)}>
        <Check className={cn("size-3", toneIcon.emerald)} />
        ICS
      </span>
    );
  }

  if (status === "NOT_ICS") {
    return (
      <span className={cn(base, "text-muted-foreground", className)}>
        <X className={cn("size-3", toneIcon.neutral)} />
        Not ICS
      </span>
    );
  }

  return null;
};
