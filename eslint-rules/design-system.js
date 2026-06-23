/**
 * Local ESLint plugin enforcing the design-system boundary.
 *
 * Rule `no-raw-palette` errors on raw Tailwind palette color utilities
 * (e.g. `bg-emerald-500`, `text-red-600`, `border-amber-500/25`) and arbitrary
 * color values — hex (`bg-[#…]`), CSS color functions (`text-[rgb(…)]`,
 * `bg-[oklch(…)]`, `bg-[color-mix(…)]`, …), and CSS vars (`text-[var(--…)]`) —
 * across every color-bearing utility prefix, in feature code. Status color is a
 * design-system concern: it lives in the tone module (`src/components/ui/tone.ts`)
 * and is consumed through the tone maps (toneSoft/toneIcon/toneTint/toneSolid/…)
 * or components (SoftBadge/StatusPill/StatusBadge). The design system itself
 * (`src/components/ui/**`) is exempt — that exemption is applied in
 * `eslint.config.js` via the config block's `ignores`, not here.
 *
 * Semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`,
 * `bg-destructive`, `text-primary`, `bg-muted/40`, …) never match the palette
 * pattern, so they remain free to use everywhere.
 */

// Color-bearing utility prefixes. Shared by both PALETTE and ARBITRARY so the
// two can never drift out of sync. Every Tailwind utility that takes a color
// belongs here: backgrounds, text, borders, rings (+offset), gradient stops
// (from/via/to), SVG paint (fill/stroke), decoration, outline, divide, accent,
// caret, and shadow.
const PREFIX =
  "(?:bg|text|border|ring|ring-offset|from|via|to|fill|stroke|decoration|outline|divide|accent|caret|shadow)";

// `<prefix>-<paletteName>-<shade>` with optional `/<alpha>` opacity. Variant
// prefixes (dark:, hover:, focus:, group-hover:, data-[…]:, …) don't matter:
// the pattern is matched anywhere inside the class string.
const PALETTE =
  PREFIX + "-" +
  "(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|stone)-" +
  // 3-digit shades listed before `50` so the alternation reports the full token
  // (e.g. `bg-red-500`, not the `bg-red-50` prefix) in the error message.
  "(?:100|200|300|400|500|600|700|800|900|950|50)(?:/\\d{1,3})?";

// Arbitrary color literals: hex (`bg-[#fff]`), CSS color functions
// (`text-[rgb(…)]`, `bg-[oklch(…)]`, `bg-[color-mix(…)]`, `bg-[hwb(…)]`, …), and
// CSS vars (`text-[var(--brand)]`). The trailing `(` is required after function
// names so non-color arbitrary values (`text-[14px]`, `border-[2px]`,
// `bg-[url(…)]`) are NOT flagged. `rgb` covers `rgba`, `hsl` covers `hsla`,
// `color` covers both `color()` and `color-mix()`.
const ARBITRARY =
  PREFIX + "-\\[(?:#|(?:rgb|hsl|oklch|oklab|lab|lch|hwb|color(?:-mix)?|var)\\()";

// Non-global form kept for any single-match callers.
const PATTERN = new RegExp(`(?:^|\\s|:)(${PALETTE}|${ARBITRARY})`);
// Global form drives matchAll so every violation in one class string is reported.
const PATTERN_GLOBAL = new RegExp(PATTERN.source, "g");

/** Report every raw-palette match found in a class-like string. */
function inspect(context, node, text) {
  for (const m of text.matchAll(PATTERN_GLOBAL)) {
    context.report({ node, messageId: "rawPalette", data: { match: m[1] } });
  }
}

const noRawPalette = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw Tailwind palette / arbitrary colors in feature code; route status color through the design-system tone maps.",
      recommended: true,
    },
    messages: {
      rawPalette:
        "Raw palette color '{{match}}' bypasses the design system. Use a tone map (toneSoft / toneIcon / toneTint / toneBorder / toneSolid / toneGhostHover / toneIndicator) or a component (SoftBadge / StatusPill / StatusBadge) from '@/components/ui'. Status color belongs in src/components/ui/tone.ts.",
    },
    schema: [],
  },
  create(context) {
    return {
      // Plain string class names: className="bg-red-500", cn("text-amber-600")
      Literal(node) {
        if (typeof node.value === "string") inspect(context, node, node.value);
      },
      // Template-literal chunks: className={`… bg-red-500 …`}
      TemplateElement(node) {
        inspect(context, node, node.value.raw);
      },
    };
  },
};

export default {
  meta: { name: "design-system" },
  rules: { "no-raw-palette": noRawPalette },
};
