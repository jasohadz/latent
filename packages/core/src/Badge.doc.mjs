export default {
  name: "Badge",
  summary: "A small status/label pill. 5 semantic variants, 3 sizes, optional leading icon and dismiss button.",
  props: [
    { name: "variant", type: '"neutral" | "brand" | "success" | "warning" | "danger"', default: "neutral", description: "Semantic color. neutral uses the same muted fill Avatar's icon badge and Stat's icon badge reuse." },
    { name: "size", type: '"small" | "medium" | "large"', default: "medium", description: "Padding and font-size scale." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "Optional leading icon, e.g. <Icon name=\"sparkles\" />. Its size prop is overridden automatically to match Badge's size." },
    { name: "onDismiss", type: "() => void", default: "undefined", description: "When provided, renders a trailing dismiss (x) button that fires this on click." },
  ],
  example: `<Badge variant="brand" size="medium" icon={<Icon name="sparkles" />}>New</Badge>`,
  doNot: [
    "Don't hardcode colors — each variant already maps to its own semantic background/text token pair; add a new variant rather than overriding via className.",
  ],
  swizzlePath: "packages/core/src/Badge.tsx",
  extends: "React.HTMLAttributes<HTMLSpanElement>",
  // No states field: Badge's only real variation is the variant/size prop
  // combinations, already fully covered by figmaTokens below — restating
  // them as "states" would be filler, not new information.
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Activates the dismiss button when onDismiss is provided — native <button>, not a custom handler." },
    ],
    ariaAttributes: [
      { attribute: 'aria-label="Dismiss"', description: "Hardcoded on the dismiss button when onDismiss is provided — not customizable per instance. The badge's own label content (children) has no ARIA role of its own; Badge is a plain <span>, not announced as a distinct control unless a parent adds one." },
    ],
    focusBehaviors: [
      "The dismiss button has no custom/token-bound focus ring in Badge.css — confirmed by reading the source. No outline: none is set either, so the browser's unstyled default outline still shows on keyboard focus; same real, undocumented gap as Switch's track.",
    ],
  },
  figmaTokens: {
    "gap": "spacing.4",
    "border-radius": "radius.full",
    "font-family": "font-family.sans",
    "font-weight": "font-weight.600",
    "padding (small, horizontal)": "spacing.8",
    "padding (small/medium, vertical)": "spacing.2",
    "font-size (small)": "font-size.100",
    "font-size (medium/large)": "font-size.200",
    "padding (large, horizontal)": "spacing.12",
    "padding (large, vertical)": "spacing.4",
    "background (neutral)": "color.background.muted",
    "text (neutral)": "color.text.secondary",
    "background (brand)": "color.background.brand",
    "text (brand)": "color.text.link",
    "background (success)": "color.background.success",
    "text (success)": "color.text.success",
    "background (warning)": "color.background.warning",
    "text (warning)": "color.text.warning",
    "background (danger)": "color.background.danger",
    "text (danger)": "color.text.danger",
  },
};
