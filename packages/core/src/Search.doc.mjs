export default {
  name: "Search",
  summary: "Search field with an optional trailing clear button and an attached circular submit button reusing Button's primary color ramp. No leading icon rendered — Figma's Search component has a leading-icon boolean property, but it's off in every one of the 16 current variants.",
  props: [
    { name: "appearance", type: '"filled" | "outline"', default: "outline", description: "outline shows a border around the container. filled swaps it for a solid muted background, no border." },
    { name: "value", type: "string", default: "—", description: "The field's current text. Controlled — this component holds no internal state. Also gates the trailing clear button (shown only when non-empty)." },
    { name: "onChange", type: "(value: string) => void", default: "—", description: "Fires on every keystroke, and once with an empty string when the clear button is clicked." },
    { name: "onSubmit", type: "() => void", default: "undefined", description: "Fires on Enter or clicking the submit button." },
    { name: "placeholder", type: "string", default: '"Search..."', description: "Placeholder text shown when value is empty." },
    { name: "disabled", type: "boolean", default: "false", description: "Disables the input and the submit button, and applies the disabled container styling." },
  ],
  example: `<Search appearance="outline" value={query} onChange={setQuery} onSubmit={handleSearch} />`,
  doNot: [
    "Don't expect a small/condensed size tier — built at one size (Density=Default) for v1, per Figma's own documented gap.",
    "Don't expect a leading icon inside the field — Figma's Search component has a leading-icon boolean property, but it's off in all 16 current variants, so it isn't built. Revisit if a variant ever turns it on.",
  ],
  swizzlePath: "packages/core/src/Search.tsx",
  extends: null,
  states: [
    { name: "default (outline)", description: "Bordered container, no fill.", tokens: ["container border"] },
    { name: "filled", description: "Solid muted background, no border.", tokens: ["container background (filled)"] },
    { name: "hover", description: "Container border darkens (outline appearance only — filled has no hover token of its own).", tokens: ["container border (hover)"] },
    { name: "focus-within", description: "Container gets a real focus outline bound to color.border.focus, confirmed in Search.css — not a gap, a working implementation.", tokens: ["focus ring color", "focus ring width"] },
    { name: "disabled", description: "Container background dims; input and submit Button both get the native disabled attribute.", tokens: ["container background (disabled)"] },
  ],
  // Genuinely well-implemented, worth documenting positively, not just
  // hunting for gaps: Enter-to-submit IS wired (onKeyDown on the input),
  // unlike SubscribeField's real gap of the same shape. Confirmed by
  // reading the source.
  accessibility: {
    keyboardInteractions: [
      { key: "Enter (while focused in the input)", action: "Fires onSubmit — an explicit onKeyDown handler, not relying on a <form> submit." },
      { key: "Enter or Space (on the clear or submit button)", action: "Native <button> activation." },
    ],
    ariaAttributes: [
      { attribute: "aria-label (clear button)", description: '"Clear search" — set explicitly, since the clear button has only an icon, no visible text.' },
      { attribute: "aria-label (submit button)", description: '"Submit search" — same reasoning, the submit Button is iconOnly.' },
    ],
    focusBehaviors: [
      "A minor, non-critical observation, not a bug: the input is type=\"text\" rather than type=\"search\" — native type=\"search\" semantics (some browsers' built-in clear affordance, screen reader announcement as a search field) aren't used, in favor of the custom clear button implemented here instead. A legitimate alternative pattern, not a gap.",
    ],
  },
  // Submit is a real Button instance (variant="primary" iconOnly), not a
  // bespoke element — Button.tsx gained a true icon-only mode 2026-07-30
  // (see Button.doc.mjs), superseding the earlier gap noted here (still
  // present in Calendar's nav buttons and Card's CTA, neither revisited
  // yet). Its border/radius/background/icon-color tokens now live in
  // Button's own figmaTokens map — check-parity greps Search.css alone, so
  // duplicating them here would just assert against a file that no longer
  // declares them.
  // "focus ring width" is skipped below (figmaTokensSkipLiveCheck):
  // confirmed correct (1px, matching sizing.border.thin exactly) but
  // Figma has this as an unbound literal on the focused state, not a
  // Variable — nothing for check-component-bindings to find regardless
  // of correctness.
  // "input font-size": Figma's real text node binds font-size/body
  // (Breakpoint) — resolves to the same primitive as our declared
  // font-style.body (Semantic) at desktop. Same deliberate-simplification
  // pattern as Calendar's weekday font-size.
  figmaTokensSkipLiveCheck: ["focus ring width", "input font-size"],
  figmaTokens: {
    "container padding": "spacing.4",
    "container gap": "spacing.8",
    "container background": "color.background.default",
    "container border": "color.border.default",
    "container border (hover)": "color.border.strong",
    "container border-radius": "radius.lg",
    "container background (filled)": "color.background.muted",
    "container background (disabled)": "color.action.secondary.disabled",
    "field border-radius": "radius.input",
    "field padding": "spacing.12",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "input text color": "color.text.primary",
    "input placeholder color": "color.text.tertiary",
    "input font-size": "font-style.body",
    "clear icon color": "color.icon.subtle",
  },
};
