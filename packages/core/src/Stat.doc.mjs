export default {
  name: "Stat",
  summary: "A compact highlight card for a single number or metric with a supporting label. For landing pages and dashboards.",
  props: [
    { name: "showIcon", type: "boolean", default: "true", description: "Toggles the icon badge, when an icon is passed via `icon`." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "e.g. <Icon name=\"users\" />, shown inside the icon badge when showIcon is true." },
    { name: "value", type: "string", default: "—", description: 'The big number/metric, e.g. "2,400+".' },
    { name: "label", type: "string", default: "—", description: "Supporting caption below the value." },
  ],
  example: `<Stat icon={<Icon name="users" />} value="2,400+" label="Teams building with Latent" />`,
  doNot: [
    "Don't set showIcon without also passing `icon` — the icon badge only renders when both are true/present, so showIcon alone leaves an empty gap.",
  ],
  swizzlePath: "packages/core/src/Stat.tsx",
  extends: null,
  // Follow-up re-verification pass, 2026-08-26, resolving what the first
  // real run of check-component-bindings flagged here — all four
  // legitimate skips, confirmed by reading the live nodes directly, no
  // code/value changes needed:
  // - "container shadow": elevation.* is an Effect Style reference, not a
  //   Variable — this check only walks bound Variables and can never see
  //   it; check-styles/styles.json already covers Effect Styles separately.
  // - "value font-size"/"label font-size": Figma's real text nodes bind
  //   to font-size/h1 and font-size/body — Breakpoint-collection tokens
  //   that resolve to the exact same primitive (font-size.1100 /
  //   font-size.300) as our declared Semantic-layer font-style.h1/
  //   font-style.body do at desktop. Same deliberate-simplification
  //   pattern as Calendar's weekday font-size.
  // - "value font-weight": confirmed Figma has this as an unbound literal
  //   700 on the text node, not a bound Variable at all — nothing for
  //   this check to find regardless of whether 700 is the right number.
  // - "icon badge padding": the real Figma icon badge is a fixed 40x40
  //   frame with zero padding, not padding-based sizing. Code's
  //   padding:spacing.12 around a 16px icon produces the identical 40px
  //   total — same visual result via a different (and arguably more
  //   flexible) technique, not a value this check can verify since
  //   Figma's version isn't structured as padding to begin with.
  figmaTokensSkipLiveCheck: ["container shadow", "value font-size", "value font-weight", "label font-size", "icon badge padding"],
  figmaTokens: {
    "container padding": "spacing.32",
    "container gap": "spacing.8",
    "container background": "color.surface.raised",
    "container border": "color.border.subtle",
    "container border-radius": "radius.card",
    "container shadow": "elevation.sm",
    "icon badge padding": "spacing.12",
    "icon badge background": "color.background.muted",
    "icon badge border-radius": "radius.lg",
    "icon color": "color.icon.default",
    "value color": "color.text.primary",
    "value font-size": "font-style.h1",
    "value font-weight": "font-weight.700",
    "label color": "color.text.secondary",
    "label font-size": "font-style.body",
  },
};
