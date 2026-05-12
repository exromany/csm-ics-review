import { Link } from "react-router";
import {
  CheckCircle,
  CircleCheck,
  Clock,
  CircleX,
  Archive,
  ExternalLink,
  Eye,
  User,
  Users,
  MessageSquare,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  DvtAddressRole,
  DvtFormMatch,
  DvtMatchKind,
} from "../hooks/useDvtFormsByIdentifiers";

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

interface MatchKindMeta {
  Icon: typeof User;
  label: string;
  title: string;
  className: string;
}

const defaultMatchClass =
  "border-amber-300 text-amber-700 bg-amber-100/60 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-900/40";

// Stronger signal: the queried address IS the linked form's primary identity.
const mainRoleMatchClass =
  "border-red-300 text-red-700 bg-red-100/70 dark:border-red-700 dark:text-red-300 dark:bg-red-900/40";

const staticMatchKindMeta: Record<
  Exclude<DvtMatchKind, "address">,
  MatchKindMeta
> = {
  discordLink: {
    Icon: MessageSquare,
    label: "Discord",
    title: "Same Discord link or handle",
    className: defaultMatchClass,
  },
  telegramUsername: {
    Icon: Send,
    label: "Telegram",
    title: "Same Telegram username",
    className: defaultMatchClass,
  },
};

const addressMatchMeta = (role?: DvtAddressRole): MatchKindMeta => {
  if (role === "main") {
    return {
      Icon: User,
      label: "Main Address",
      title: "Address matches the linked form's main address",
      className: mainRoleMatchClass,
    };
  }
  if (role === "member") {
    return {
      Icon: Users,
      label: "Member Address",
      title: "Address appears as a cluster member of the linked form",
      className: defaultMatchClass,
    };
  }
  return {
    Icon: User,
    label: "Address",
    title: "Same cluster member address",
    className: defaultMatchClass,
  };
};

const metaFor = (
  kind: DvtMatchKind,
  addressRole?: DvtAddressRole
): MatchKindMeta =>
  kind === "address" ? addressMatchMeta(addressRole) : staticMatchKindMeta[kind];

interface DvtLinkedFormRowContentProps {
  form: DvtFormMatch;
  matchedOn?: DvtMatchKind[];
  basePath?: string;
}

export const DvtLinkedFormRowContent = ({
  form,
  matchedOn,
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
      {matchedOn && matchedOn.length > 0 && (
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground">matched on</span>
          {matchedOn.map((kind) => {
            const meta = metaFor(kind, form.addressRole);
            const MetaIcon = meta.Icon;
            return (
              <Badge
                key={kind}
                variant="outline"
                className={`${baseClass} ${meta.className}`}
                title={meta.title}
              >
                <MetaIcon className="w-3 h-3" />
                {meta.label}
              </Badge>
            );
          })}
        </span>
      )}
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
