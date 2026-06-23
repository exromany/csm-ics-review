import { StatusPill, type StatusTone } from "@/components/ui/panel";
import type { FormStatus } from "../../types/api";

const config: Record<FormStatus, { tone: StatusTone; label: string }> = {
  REVIEW: { tone: "amber", label: "Review" },
  APPROVED: { tone: "emerald", label: "Approved" },
  REJECTED: { tone: "red", label: "Rejected" },
};

export const StatusBadge = ({ status }: { status: FormStatus }) => {
  const { tone, label } = config[status];
  return <StatusPill tone={tone}>{label}</StatusPill>;
};
