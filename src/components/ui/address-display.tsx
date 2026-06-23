import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  etherscanLink?: boolean;
  className?: string;
}

export const AddressDisplay = ({
  address,
  etherscanLink = false,
  className = "max-w-[150px]",
}: AddressDisplayProps) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <code className="block truncate rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground cursor-help">
            {address.slice(0, 8)}…{address.slice(-6)}
          </code>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{address}</p>
        </TooltipContent>
      </Tooltip>
      {etherscanLink && (
        <a
          href={`https://etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="View on Etherscan"
        >
          <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
};

interface ReviewerDisplayProps {
  reviewer: string | null | undefined;
}

export const ReviewerDisplay = ({ reviewer }: ReviewerDisplayProps) => {
  if (!reviewer) return <span>—</span>;

  if (reviewer.startsWith("0x")) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <code className="text-xs block truncate cursor-help">
            {`${reviewer.slice(0, 6)}...${reviewer.slice(-4)}`}
          </code>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs">{reviewer}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <code className="text-xs block truncate">{reviewer}</code>;
};
