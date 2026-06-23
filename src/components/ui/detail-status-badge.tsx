import { CircleCheck, CircleX, Clock, type LucideIcon } from "lucide-react";
import { SoftBadge } from "./soft-badge";
import { type Tone } from "./tone";
import type { FormStatus } from "../../types/api";

/**
 * The form's headline status on the detail page. A "soft" badge — a single
 * low-saturation tint with an inset ring (Stripe/Tailwind-UI register), one hue
 * per status, theme-aware, no shadow. Tone + icon are driven entirely by the
 * shared tone module via {@link SoftBadge}.
 */
const statusConfig: Record<
  FormStatus,
  { tone: Tone; Icon: LucideIcon; label: string }
> = {
  REVIEW: { tone: "amber", Icon: Clock, label: "Review" },
  APPROVED: { tone: "emerald", Icon: CircleCheck, label: "Approved" },
  REJECTED: { tone: "red", Icon: CircleX, label: "Rejected" },
};

export const DetailStatusBadge = ({ status }: { status: FormStatus }) => {
  const { tone, Icon, label } = statusConfig[status];

  return (
    <SoftBadge tone={tone} icon={Icon} size="md">
      {label}
    </SoftBadge>
  );
};
