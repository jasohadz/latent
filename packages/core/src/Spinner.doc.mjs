export default {
  name: "Spinner",
  summary: "Indeterminate loading indicator, built entirely from tokens Button already consumes — size from Button's font-size scale, color from Button's action/text tokens.",
  props: [
    { name: "size", type: '"sm" | "md" | "lg"', default: "md", description: "Diameter, matching Button's own size scale 1:1 (typography.button.font-size.sm/md, font.size.500 for lg)." },
    { name: "variant", type: '"primary" | "secondary"', default: "primary", description: "Matches Button's variant: primary tracks color.action.primary.default with a color.text.on-brand sweep (for use on a primary-colored surface); secondary tracks color.border.default with a color.text.primary sweep (for use on a neutral surface)." },
    { name: "label", type: "string", default: '"Loading"', description: "Visually-hidden text for screen readers (role=\"status\", aria-live=\"polite\")." },
  ],
  example: `<Button variant="primary" isLoading><Spinner size="sm" variant="secondary" /></Button>`,
  doNot: [
    "Don't hardcode a diameter or color via style/className overrides — use size/variant and let the shared Button tokens drive both.",
    "Don't use variant=\"primary\" on a neutral/white surface — its sweep color (color.text.on-brand) is tuned for contrast against color.action.primary.default, not against a light background.",
  ],
  swizzlePath: "packages/core/src/Spinner.tsx",
  // Every token here is one Button.css already binds to — Spinner
  // intentionally introduces no new token vocabulary, so it composes
  // cleanly into Button's isLoading state (see Button.doc.mjs).
  figmaTokens: {
    "font-size (sm)": "typography.button.font-size.sm",
    "font-size (md)": "typography.button.font-size.md",
    "font-size (lg)": "font.size.500",
    "border-color (primary)": "color.action.primary.default",
    "border-top-color (primary)": "color.text.on-brand",
    "border-color (secondary)": "color.border.default",
    "border-top-color (secondary)": "color.text.primary",
  },
};
