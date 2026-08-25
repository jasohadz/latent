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
