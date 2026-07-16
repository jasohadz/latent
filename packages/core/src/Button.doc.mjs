export default {
  name: "Button",
  summary: "Primitive action trigger. Two variants, three sizes, optional loading state.",
  props: [
    { name: "variant", type: '"primary" | "secondary"', default: "primary", description: "Visual weight. Use primary for the single main action per view; secondary for everything else." },
    { name: "size", type: '"sm" | "md" | "lg"', default: "md", description: "Padding and font-size scale." },
    { name: "isLoading", type: "boolean", default: "false", description: "Disables the button, sets aria-busy, and swaps content for a 3-dot bounce spinner (matches the Figma LoadingSpinner prototype). Children remain in the DOM for the accessible name, just visually hidden." },
    { name: "disabled", type: "boolean", default: "false", description: "Standard HTML disabled." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "Optional trailing icon, e.g. <Icon name=\"chevron-right\" size=\"xs\" />. Rendered after children; omit for no icon. Marked aria-hidden — the button's accessible name comes from its text content." },
  ],
  example: `<Button variant="primary" size="md" icon={<Icon name="chevron-right" size="xs" />} onClick={handleSave}>Save</Button>`,
  doNot: [
    "Don't use more than one primary-variant button per view — it defeats the hierarchy signal.",
    "Don't hardcode colors via className overrides; add or reuse a --lat-* custom property instead.",
  ],
  swizzlePath: "packages/core/src/Button.tsx",
  // Token paths this component is expected to consume, keyed by the CSS
  // property they should end up styling. check-parity greps the compiled
  // CSS for the corresponding --lat-* variable to confirm no drift.
  figmaTokens: {
    "border-radius": "radius.input",
    "padding (md, all sides)": "spacing.8",
    "font-size (md)": "typography.button.font-size.md",
    "line-height (md)": "typography.button.line-height.md",
    "background (primary default)": "color.action.primary.default",
    "background (primary hover)": "color.action.primary.hover",
    "background (primary pressed)": "color.action.primary.pressed",
    "background (disabled)": "color.action.secondary.disabled",
    "text (disabled)": "color.text.disabled",
    "border (primary)": "color.border.brand",
    "border (disabled)": "color.border.strong",
    "border color (focus ring)": "color.border.focus",
    "border width (focus ring)": "sizing-border.thin",
    // Not in primitives/semantic/density.json — Figma's Plugin API has no
    // x/y-position variable binding, so this can't be pulled from a Figma
    // variable. Value is measured off the Button focus-ring layer (46:41)
    // directly; see theme.css for the fixed 3px and the reasoning.
    "focus ring offset": "sizing.focus-ring-offset",
    "gap (icon)": "spacing.4",
    "spinner dot resting color": "color.icon.subtle",
    "spinner dot active color": "color.icon.inverse",
    "spinner dot size": "spacing.4",
  },
};
