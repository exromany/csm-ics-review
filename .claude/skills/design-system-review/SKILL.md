---
name: design-system-review
description: Use when reviewing or writing any UI change in this app (pages, layout, feature components, anything rendering visuals) — checks design-system compliance before merge. Triggers on new/edited .tsx that renders UI, "review this component/page", raw Tailwind palette classes (bg-emerald-500, text-red-600), inline toast, hand-rolled panels/headers/badges, or adding a shared component.
---

# Design System Review

## Overview

`src/components/ui` IS the design system: a token layer (`tone.ts` + `App.css`), the shadcn primitives, and composed components. Feature code (everything else under `src`) must **compose the library, not reinvent or bypass it**. This skill is the reviewer's checklist for any change that renders UI.

**Core principle:** color and surface are design-system concerns. If a screen needs a status color, a panel, a header, a status badge, a table footer, or a toast, the component already exists — use it. New visual *primitives* go in the library; feature code only composes.

## When to Use

- Reviewing a PR/diff that touches `.tsx` rendering UI (pages, `src/components/**`, layout, menu).
- Before committing your own UI change.
- You see a raw palette class (`bg-amber-500`, `text-red-600`, `border-emerald-500/30`), an arbitrary color (`bg-[#…]`), a direct `toast.*`, or markup that looks like a re-implemented header/panel/badge/pagination.

Not for: pure logic/data changes with no UI, or edits inside `src/components/ui/**` itself (that's the library — palette lives there by design).

## The Checklist

Run every item. Cite `file:line` for each finding.

1. **No color bypass.** Zero raw Tailwind palette utilities and zero arbitrary colors in feature code. Status color comes from the tone maps (`toneSoft`, `toneIcon`, `toneTint`, `toneBorder`, `toneSolid`, `toneGhostHover`, `toneIndicator`) or a component. `eslint` rule `design-system/no-raw-palette` enforces the mechanical part — confirm it passes AND that the chosen tone is *semantically* right (see tone table).
2. **Reuse over reinvention.** Map the change against the catalog below. A hand-rolled title row, empty block, spinner, sortable `<th>`, pagination footer, search input, segmented filter, label+error group, or status pill is a defect — replace with the library component.
3. **One surface.** Card/panel surfaces use `<Panel>`, never an inline `rounded-xl border bg-card shadow-panel`.
4. **Import from the barrel.** UI imports come from `@/components/ui` (the canonical surface), not deep ad-hoc paths for composed components.
5. **State coverage.** Anything that fetches renders loading (`LoadingState`), empty (`EmptyState`), and error/denied (`EmptyState tone="destructive"`) — not just the happy path.
6. **Feedback through `notify`.** User feedback uses `notify.*`, never a raw `toast.*` import or `alert()`.
7. **Accessibility.** Interactive controls carry labels/roles (icon-only buttons need `aria-label`; toggle groups need `role`/`aria-pressed` — the library components already do this; new ones must too).
8. **New shared pattern?** If a visual pattern now appears 2+ times, it belongs in `src/components/ui` (with palette allowed there), exported from the barrel, and added to the `/design-system` showcase — not copy-pasted.
9. **Gate is green.** `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm exec eslint src` all pass. If a library component was added/changed, the `/design-system` showcase still renders it in light + dark.

## Component Catalog (reuse these)

| Need | Use | Don't hand-roll |
|------|-----|-----------------|
| Page title + count + actions | `PageHeader` | a flex `<h1>` row |
| Card/section surface | `Panel` | `rounded-xl border bg-card shadow-panel` |
| Status marker (dot) | `StatusPill` / `StatusBadge` | colored `<span>` |
| Soft tinted badge / callout | `SoftBadge` (+ `toneTint`/`toneBorder`) | `bg-*-50 text-*-700 ring-*` |
| Empty / access-denied | `EmptyState` | centered icon+text block |
| Loading | `LoadingState` | `Loader2` + centering |
| Search field | `SearchInput` | `<Input>` + absolute icon |
| Segmented filter | `SegmentedControl` | `role="group"` + buttons |
| Sortable header | `SortableHeader` / `ColumnLabel` | `<th>` + arrow logic |
| Skeleton rows | `TableSkeleton` | mapped `<Skeleton>` rows |
| List footer (range/size/pages) | `DataPagination` | `getPageNumbers` + markup |
| Label + control + error | `Field` | `<Label>` + manual error `<p>` |
| Address chip + tooltip | `AddressDisplay` / `ReviewerDisplay` | `slice(0,8)…` + `<Tooltip>` |
| Toast | `notify` | `toast.*` import |

## Tone Semantics (use the right one)

| Tone | Meaning | Misuse to flag |
|------|---------|----------------|
| `neutral` | informational / inactive | using it for success/error |
| `indigo` | brand / in-progress / info | using it for a final state |
| `emerald` | success / approved / active | success-coloring a pending item |
| `amber` | caution / pending review | **amber for an error** (use red) |
| `red` | error / rejected / destructive | red for a non-blocking warning |

## Common Mistakes

- **Mechanical-pass blindness.** ESLint passing ≠ correct: `toneSolid.emerald` on a *reject* button is green-but-wrong. Read the semantics.
- **"Just this once" inline color.** A one-off `bg-amber-500/10` is the start of the next 280-occurrence sprawl. If the tone vocabulary lacks what you need, extend `tone.ts` — don't inline.
- **Re-implementing to "match the design."** The library already matches the design; reinventing it guarantees drift.
- **Logic in a visual refactor.** A design-system migration must preserve behavior byte-for-byte — flag any handler/data-flow change riding along.
