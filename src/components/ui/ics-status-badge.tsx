import { Check, X, Loader2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { IcsStatus } from "../../hooks/useIcsStatus";

interface IcsStatusBadgeProps {
  status?: IcsStatus;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}

const baseClass = "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium";

export const IcsStatusBadge = ({
  status,
  isLoading,
  isError,
  className,
}: IcsStatusBadgeProps) => {
  if (isLoading) {
    return (
      <Badge
        variant="outline"
        className={`${baseClass} border-slate-300 dark:border-slate-700 text-muted-foreground ${className ?? ""}`}
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking ICS
      </Badge>
    );
  }

  if (isError) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={`${baseClass} border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-900/30 cursor-help ${className ?? ""}`}
            >
              <AlertTriangle className="w-3 h-3" />
              ICS check failed
            </Badge>
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
      <Badge
        variant="outline"
        className={`${baseClass} border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30 ${className ?? ""}`}
      >
        <Check className="w-3 h-3" />
        ICS
      </Badge>
    );
  }

  if (status === "NOT_ICS") {
    return (
      <Badge
        variant="outline"
        className={`${baseClass} border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400 ${className ?? ""}`}
      >
        <X className="w-3 h-3" />
        Not ICS
      </Badge>
    );
  }

  return null;
};
