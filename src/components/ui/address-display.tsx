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
    <div className={`flex items-center space-x-1 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <code className="text-sm bg-muted px-2 py-1 rounded block truncate cursor-help">
            {address.slice(0, 8)}...{address.slice(-6)}
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
          className="flex items-center justify-center w-6 h-6 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 rounded transition-colors duration-200 shrink-0"
          title="View on Etherscan"
        >
          <ExternalLink className="w-3 h-3" />
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
