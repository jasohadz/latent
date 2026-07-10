export default {
  name: "Button",
  summary: "Primitive action trigger. Two variants, three sizes, optional loading state.",
  props: [
    { name: "variant", type: '"primary" | "secondary"', default: "primary", description: "Visual weight. Use primary for the single main action per view; secondary for everything else." },
    { name: "size", type: '"sm" | "md" | "lg"', default: "md", description: "Padding and font-size scale." },
    { name: "isLoading", type: "boolean", default: "false", description: "Disables the button and sets aria-busy. Does not render a spinner itself — compose with an icon if needed." },
    { name: "disabled", type: "boolean", default: "false", description: "Standard HTML disabled." },
  ],
  example: `<Button variant="primary" size="md" onClick={handleSave}>Save</Button>`,
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
    "padding (md, y-axis)": "spacing.8",
    "padding (md, x-axis)": "spacing.16",
    "font-size (md)": "typography.button.font-size.md",
    "background (primary)": "color.action.primary.default",
  },
};
