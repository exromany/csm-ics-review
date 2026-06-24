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
import type { LucideIcon } from "lucide-react";
import { SoftBadge, type Tone } from "@/components/ui";
import type {
  IdvtcAddressRole,
  IdvtcFormMatch,
  IdvtcMatchKind,
} from "../hooks/useIdvtcFormsByIdentifiers";

const statusVariant = (form: IdvtcFormMatch) => {
  if (form.status === "APPROVED" && form.issued) {
    return {
      Icon: CheckCircle,
      label: "Approved · Issued",
      tone: "emerald" as Tone,
    };
  }
  if (form.status === "APPROVED") {
    return {
      Icon: CircleCheck,
      label: "Approved",
      tone: "emerald" as Tone,
    };
  }
  if (form.status === "REVIEW") {
    return {
      Icon: Clock,
      label: "Under Review",
      tone: "amber" as Tone,
    };
  }
  return {
    Icon: CircleX,
    label: "Rejected",
    tone: "red" as Tone,
  };
};

interface MatchKindMeta {
  Icon: LucideIcon;
  label: string;
  title: string;
  tone: Tone;
}

const defaultMatchTone: Tone = "amber";

// Stronger signal: the queried address IS the linked form's primary identity.
const mainRoleMatchTone: Tone = "red";

const staticMatchKindMeta: Record<
  Exclude<IdvtcMatchKind, "address">,
  MatchKindMeta
> = {
  discordLink: {
    Icon: MessageSquare,
    label: "Discord",
    title: "Same Discord link or handle",
    tone: defaultMatchTone,
  },
  telegramUsername: {
    Icon: Send,
    label: "Telegram",
    title: "Same Telegram username",
    tone: defaultMatchTone,
  },
};

const addressMatchMeta = (role?: IdvtcAddressRole): MatchKindMeta => {
  if (role === "main") {
    return {
      Icon: User,
      label: "Main Address",
      title: "Address matches the linked form's main address",
      tone: mainRoleMatchTone,
    };
  }
  if (role === "member") {
    return {
      Icon: Users,
      label: "Member Address",
      title: "Address appears as a cluster member of the linked form",
      tone: defaultMatchTone,
    };
  }
  return {
    Icon: User,
    label: "Address",
    title: "Same cluster member address",
    tone: defaultMatchTone,
  };
};

const metaFor = (
  kind: IdvtcMatchKind,
  addressRole?: IdvtcAddressRole
): MatchKindMeta =>
  kind === "address" ? addressMatchMeta(addressRole) : staticMatchKindMeta[kind];

interface IdvtcLinkedFormRowContentProps {
  form: IdvtcFormMatch;
  matchedOn?: IdvtcMatchKind[];
  basePath?: string;
}

export const IdvtcLinkedFormRowContent = ({
  form,
  matchedOn,
  basePath = "/idvtc-forms",
}: IdvtcLinkedFormRowContentProps) => {
  const { Icon, label, tone } = statusVariant(form);
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Link
        to={`${basePath}/${form.id}`}
        className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
        title={`Open IDVTC form #${form.id}`}
      >
        IDVTC Form #{form.id}
        <ExternalLink className="size-3" />
      </Link>
      <SoftBadge tone={tone} size="sm" icon={Icon}>
        {label}
      </SoftBadge>
      {form.outdated && (
        <SoftBadge tone="neutral" size="sm" icon={Archive}>
          Outdated
        </SoftBadge>
      )}
      {matchedOn && matchedOn.length > 0 && (
        <span className="inline-flex items-center gap-1">
          <span className="text-muted-foreground">matched on</span>
          {matchedOn.map((kind) => {
            const meta = metaFor(kind, form.addressRole);
            return (
              <SoftBadge
                key={kind}
                tone={meta.tone}
                size="sm"
                icon={meta.Icon}
                className="[&>svg]:size-3"
                title={meta.title}
              >
                {meta.label}
              </SoftBadge>
            );
          })}
        </span>
      )}
      <Link
        to={`${basePath}/${form.id}`}
        className="ml-auto inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Eye className="size-3" />
        View
      </Link>
    </div>
  );
};
