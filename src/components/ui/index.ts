/**
 * Design system — canonical public API.
 *
 * `src/components/ui` IS the design system: a token layer, the shadcn
 * primitives, and the composed components extracted from repeated patterns.
 * Feature code (pages, layout, domain components) must import UI from this
 * barrel — `import { Panel, PageHeader, StatusPill } from "@/components/ui"` —
 * and must not hand-roll surfaces or status colors. The ESLint bypass guard
 * enforces that boundary; the /design-system showcase documents every export.
 *
 * Layers below are ordered tokens → primitives → composed.
 */

/* ── Tokens ─────────────────────────────────────────────────────────────── */
export * from "./tone";

/* ── Primitives (shadcn/ui) ─────────────────────────────────────────────── */
export * from "./alert";
export * from "./avatar";
export * from "./badge";
export * from "./breadcrumb";
export * from "./button";
export * from "./card";
export * from "./dialog";
export * from "./dropdown-menu";
export * from "./input";
export * from "./label";
export * from "./pagination";
export * from "./progress";
export * from "./radio-group";
export * from "./scroll-area";
export * from "./select";
export * from "./separator";
export * from "./skeleton";
export * from "./sonner";
export * from "./switch";
export * from "./table";
export * from "./textarea";
export * from "./toggle";
export * from "./toggle-group";
export * from "./tooltip";

/* ── Composed components ─────────────────────────────────────────────────── */
export * from "./address-display";
export * from "./data-pagination";
export * from "./date-range-filter";
export * from "./detail-status-badge";
export * from "./empty-state";
export * from "./field";
export * from "./filter-toolbar";
export * from "./ics-status-badge";
export * from "./loading-state";
export * from "./notify";
export * from "./page-header";
export * from "./query-error-state";
export * from "./panel";
export * from "./role-badge";
export * from "./search-input";
export * from "./segmented-control";
export * from "./soft-badge";
export * from "./sortable-header";
export * from "./status-badge";
export * from "./table-skeleton";
