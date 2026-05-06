import { Badge } from "@/components/ui/badge";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import type { FormStatus } from "../../types/api";

const statusConfig = {
  REVIEW: {
    variant: "secondary" as const,
    className:
      "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-semibold px-3 py-1.5 shadow-sm",
    Icon: Clock,
  },
  APPROVED: {
    variant: "default" as const,
    className:
      "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 font-semibold px-3 py-1.5 shadow-sm",
    Icon: CircleCheck,
  },
  REJECTED: {
    variant: "destructive" as const,
    className:
      "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700 font-semibold px-3 py-1.5 shadow-sm",
    Icon: CircleX,
  },
} as const;

export const DetailStatusBadge = ({ status }: { status: FormStatus }) => {
  const config = statusConfig[status];
  const IconComponent = config.Icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <IconComponent className="w-4 h-4 mr-1.5" />
      {status}
    </Badge>
  );
};
