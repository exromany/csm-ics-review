import { Badge } from "@/components/ui/badge";
import type { FormStatus } from "../../types/api";

const variants = {
  REVIEW: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
} as const;

export const StatusBadge = ({ status }: { status: FormStatus }) => {
  return (
    <Badge variant={variants[status]} className="text-xs">
      {status}
    </Badge>
  );
};
