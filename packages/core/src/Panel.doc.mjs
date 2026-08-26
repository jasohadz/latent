export default {
  name: "Panel",
  summary: "Generic elevated floating surface for popovers/dropdowns. Content-agnostic — currently hosts Calendar as a date-picker popover, but not calendar-specific.",
  props: [],
  example: `<Panel><Calendar /></Panel>`,
  doNot: [
    "Don't put a border/shadow on the child you place inside Panel too — Panel already supplies the single visible edge (see Calendar's own instance, which strips its own border when nested in a Panel).",
    "Don't hardcode a shadow value — add or reuse a --lat-elevation-* custom property instead.",
  ],
  swizzlePath: "packages/core/src/Panel.tsx",
  extends: "React.HTMLAttributes<HTMLDivElement>",
  // No `states` — zero props, purely a visual surface, nothing that varies.
  accessibility: {
    ariaAttributes: [
      { attribute: "role", description: "Panel sets no role at all, despite existing specifically to host popovers/dropdowns — a real gap for a component whose stated purpose is exactly the kind of overlay (menu, listbox, dialog) where role and focus management matter most. Confirmed by reading the source: it's a plain <div> passthrough with zero popover-specific semantics. Not a bug in the traditional sense — it's an unopinionated primitive by design — but any consumer treating it as a real popover needs to supply role/aria-* and focus trapping themselves; Panel provides none of it." },
    ],
  },
  // Matches the surface recipe used by Side Nav and Top Nav's dropdown
  // panel in Figma (color/surface/raised + color/border/subtle +
  // radius/card), differing only in elevation tier (lg, for stronger
  // floating separation than Card's sm).
  figmaTokens: {
    background: "color.surface.raised",
    border: "color.border.subtle",
    "border-radius": "radius.card",
    // Sourced from packages/tokens/styles.json (Effect Style), not a
    // Variable — see the comment above --lat-elevation-lg in theme.css.
    "box-shadow": "elevation.lg",
  },
};
