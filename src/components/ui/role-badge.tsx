import { StatusPill, type StatusTone } from "@/components/ui/panel";

export type AdminRole = "VIEWER" | "REVIEWER" | "SUPERVISOR";

/**
 * Canonical tone + label for each admin role. The single source of truth for
 * how a role reads across the app — list cells, detail headers, anywhere a role
 * is surfaced — so the same SUPERVISOR never renders two different ways.
 */
const ROLE_META: Record<AdminRole, { label: string; tone: StatusTone }> = {
  VIEWER: { label: "Viewer", tone: "neutral" },
  REVIEWER: { label: "Reviewer", tone: "indigo" },
  SUPERVISOR: { label: "Supervisor", tone: "emerald" },
};

/**
 * Tone-driven pill for an admin role. Composes `StatusPill` with the shared
 * `ROLE_META` map — pass a role enum, get its house color + friendly label.
 */
export const RoleBadge = ({ role }: { role: AdminRole }) => {
  const meta = ROLE_META[role];
  return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>;
};
