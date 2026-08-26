export default {
  name: "Panel",
  summary: "Generic elevated floating surface for popovers/dropdowns. Content-agnostic — currently hosts Calendar as a date-picker popover, but not calendar-specific.",
  props: [],
  example: `<Panel><Calendar /></Panel>`,
  doNot: [
    "Don't put a border/shadow on the child you place inside Panel too — Panel already supplies the single visible edge. (Corrected 2026-08-26: this used to cite Calendar's border as \"stripped when nested in a Panel,\" a plausible-sounding claim that was never actually true — Calendar's real Figma component has no border at all in any context, confirmed by reading its live node directly, and the code never had any Panel-aware conditional border logic either. Calendar just never had a border to strip; Panel's own edge is what you're seeing, same as for any other child.)",
    "Don't hardcode a shadow value — add or reuse a --lat-elevation-* custom property instead.",
  ],
  swizzlePath: "packages/core/src/Panel.tsx",
  extends: "React.HTMLAttributes<HTMLDivElement>",
  // No `states` — zero props, purely a visual surface, nothing that varies.
  //
  // Re-examined 2026-08-26 alongside the TopNav-family pass: this was
  // flagged as a gap ("no role"), but Panel already sets no *default*
  // role by design — it's an unopinionated visual surface (border/
  // background/shadow only), reused for genuinely different semantic
  // roles (a date-picker popover here, a dropdown menu elsewhere). No
  // single default role would be correct for all of them, and guessing
  // one would announce interaction support that may not exist for a
  // given consumer — the same "don't imply behavior that isn't real"
  // problem Toggle's unimplemented ARIA-tabs roles had. Since Panel
  // `extends React.HTMLAttributes<HTMLDivElement>` and spreads `...rest`
  // onto the div, `role` (and any other aria-* attribute) already passes
  // straight through with zero code change needed — `<Panel
  // role="dialog">`, `<Panel role="menu">`, etc. all already work today.
  // The actual gap was that this wasn't documented anywhere; fixed here,
  // not in code.
  accessibility: {
    ariaAttributes: [
      { attribute: "role", description: 'No default — Panel is intentionally unopinionated about what it hosts. Already a supported pass-through prop via `extends`/`...rest`, not a missing capability: supply the role matching what you\'re actually building (e.g. "dialog" for a modal popover — and add real focus trapping yourself, Panel does none — or "menu"/"listbox" for a list of choices with the arrow-key navigation those roles imply). Panel provides the visual surface only; role and any interaction pattern it implies are the consumer\'s responsibility.' },
    ],
  },
  // Matches the surface recipe used by Side Nav and Top Nav's dropdown
  // panel in Figma (color/surface/raised + color/border/subtle +
  // radius/card), differing only in elevation tier (lg, for stronger
  // floating separation than Card's sm).
  // "box-shadow" is skipped below (figmaTokensSkipLiveCheck): elevation.*
  // is an Effect Style reference, not a Variable — check-component-bindings
  // only walks bound Variables and can never see this; check-styles/
  // styles.json already covers Effect Styles separately.
  figmaTokensSkipLiveCheck: ["box-shadow"],
  figmaTokens: {
    background: "color.surface.raised",
    border: "color.border.subtle",
    "border-radius": "radius.card",
    // Sourced from packages/tokens/styles.json (Effect Style), not a
    // Variable — see the comment above --lat-elevation-lg in theme.css.
    "box-shadow": "elevation.lg",
  },
};
