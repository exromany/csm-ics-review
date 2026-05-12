import { Link } from "react-router";
import {
  CheckCircle,
  CircleCheck,
  Clock,
  CircleX,
  Archive,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DvtFormMatch } from "../hooks/useDvtFormsByAddress";

const baseClass =
  "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium";

const statusVariant = (form: DvtFormMatch) => {
  if (form.status === "APPROVED" && form.issued) {
    return {
      Icon: CheckCircle,
      label: "Approved · Issued",
      className:
        "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30",
    };
  }
  if (form.status === "APPROVED") {
    return {
      Icon: CircleCheck,
      label: "Approved",
      className:
        "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30",
    };
  }
  if (form.status === "REVIEW") {
    return {
      Icon: Clock,
      label: "Under Review",
      className:
        "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-900/30",
    };
  }
  return {
    Icon: CircleX,
    label: "Rejected",
    className:
      "border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30",
  };
};

interface DvtLinkedFormRowContentProps {
  form: DvtFormMatch;
  basePath?: string;
}

export const DvtLinkedFormRowContent = ({
  form,
  basePath = "/dvt-forms",
}: DvtLinkedFormRowContentProps) => {
  const { Icon, label, className } = statusVariant(form);
  return (
    <div className="flex items-center gap-2 flex-wrap text-xs">
      <Link
        to={`${basePath}/${form.id}`}
        className="font-medium hover:underline inline-flex items-center gap-1 text-foreground"
        title={`Open DVT form #${form.id}`}
      >
        DVT Form #{form.id}
        <ExternalLink className="w-3 h-3" />
      </Link>
      <Badge variant="outline" className={`${baseClass} ${className}`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
      {form.outdated && (
        <Badge
          variant="outline"
          className={`${baseClass} border-slate-300 text-slate-600 bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:bg-slate-900/30`}
        >
          <Archive className="w-3 h-3" />
          Outdated
        </Badge>
      )}
      <span className="text-muted-foreground">
        Submitted {new Date(form.createdAt).toLocaleDateString()}
      </span>
      <Link
        to={`${basePath}/${form.id}`}
        className="ml-auto inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Eye className="w-3 h-3" />
        View
      </Link>
    </div>
  );
};
