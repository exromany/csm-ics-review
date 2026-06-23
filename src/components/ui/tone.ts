/**
 * Tone — the single source of truth for status color semantics across the
 * design system. Every colored marker (dot pills, soft badges, inline status
 * icons) draws from these maps instead of hand-rolling palette classes, so the
 * five semantic tones stay byte-identical everywhere and the ESLint bypass
 * guard can keep raw palette colors out of feature code.
 *
 *   neutral — informational / inactive (token-based, no palette)
 *   indigo  — brand / in-progress / accent
 *   emerald — success / approved / active
 *   amber   — caution / pending review
 *   red     — error / rejected / destructive
 */
export type Tone = "neutral" | "indigo" | "emerald" | "amber" | "red";

export const TONES: readonly Tone[] = [
  "neutral",
  "indigo",
  "emerald",
  "amber",
  "red",
] as const;

/** Solid 1.5 dot used by {@link StatusPill}. */
export const toneDot: Record<Tone, string> = {
  neutral: "bg-zinc-400 dark:bg-zinc-500",
  indigo: "bg-indigo-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

/**
 * Soft single-tint surface with an inset ring (Stripe/Tailwind-UI register) —
 * one low-saturation hue per tone, theme-aware, no shadow. Used by SoftBadge
 * and any tinted callout. Neutral stays token-based to avoid palette drift.
 */
export const toneSoft: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground ring-border",
  indigo:
    "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-400/25",
  emerald:
    "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-400/25",
  amber:
    "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/25",
  red: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/25",
};

/** Foreground color for a small inline icon — or any accent text — carrying the tone's meaning. */
export const toneIcon: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  indigo: "text-indigo-600 dark:text-indigo-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
};

/**
 * Barely-there tinted background for callouts, info cards, and selected states.
 * Composable: pair with {@link toneBorder} for an outline and {@link toneIcon}
 * for the accent text/icon inside.
 */
export const toneTint: Record<Tone, string> = {
  neutral: "bg-muted/40",
  indigo: "bg-indigo-500/5",
  emerald: "bg-emerald-500/5",
  amber: "bg-amber-500/5",
  red: "bg-red-500/5",
};

/** Low-alpha tonal border (add a `border` width class alongside it). */
export const toneBorder: Record<Tone, string> = {
  neutral: "border-border",
  indigo: "border-indigo-500/25",
  emerald: "border-emerald-500/25",
  amber: "border-amber-500/25",
  red: "border-red-500/25",
};

/**
 * Solid filled interactive surface — the active state of a tonal control such
 * as a decision button (Approve / Review / Reject). Saturated background with
 * white text; hover deepens one step. Neutral falls back to the secondary token.
 */
export const toneSolid: Record<Tone, string> = {
  neutral:
    "border-border bg-secondary text-secondary-foreground hover:bg-secondary/80",
  indigo:
    "border-indigo-600 bg-indigo-600 text-white hover:border-indigo-700 hover:bg-indigo-700",
  emerald:
    "border-emerald-600 bg-emerald-600 text-white hover:border-emerald-700 hover:bg-emerald-700",
  amber:
    "border-amber-500 bg-amber-500 text-white hover:border-amber-600 hover:bg-amber-600",
  red: "border-red-600 bg-red-600 text-white hover:border-red-700 hover:bg-red-700",
};

/**
 * Faint hover affordance for the INACTIVE state of a tonal control — pairs with
 * {@link toneSolid} (active) on the same button group.
 */
export const toneGhostHover: Record<Tone, string> = {
  neutral: "hover:bg-accent hover:text-foreground",
  indigo:
    "hover:border-indigo-500/40 hover:bg-indigo-500/5 hover:text-foreground",
  emerald:
    "hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-foreground",
  amber:
    "hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-foreground",
  red: "hover:border-red-500/40 hover:bg-red-500/5 hover:text-foreground",
};

/** Fill color for a Radix Progress indicator (targets the inner `[&>div]`). */
export const toneIndicator: Record<Tone, string> = {
  neutral: "[&>div]:bg-muted-foreground",
  indigo: "[&>div]:bg-indigo-500",
  emerald: "[&>div]:bg-emerald-500",
  amber: "[&>div]:bg-amber-500",
  red: "[&>div]:bg-red-500",
};
