export default {
  name: "SubscribeField",
  summary: "An email-capture row pairing a real TextField instance with a real Button instance, plus a terms disclaimer below.",
  props: [
    { name: "buttonPosition", type: '"side" | "bottom"', default: "side", description: "side: button sits beside the input, inline. bottom: button stacks below the input." },
    { name: "placeholder", type: "string", default: '"Enter text"', description: "Placeholder text passed through to the nested TextField (rendered appearance=\"filled\")." },
    { name: "buttonLabel", type: "string", default: '"Subscribe"', description: "Label for the nested primary-variant Button." },
    { name: "label", type: "string", default: '"Email address"', description: "Accessible name for the input, via aria-label — not rendered visually, matching this component's placeholder-only design in Figma. Override if reusing this component for something other than email capture." },
    { name: "value", type: "string", default: "undefined", description: "The nested TextField's current text. Controlled — this component holds no internal state." },
    { name: "onChange", type: "(value: string) => void", default: "undefined", description: "Fires on every keystroke in the nested TextField." },
    { name: "onSubmit", type: "() => void", default: "undefined", description: "Fires when the Subscribe Button is clicked." },
  ],
  example: `<SubscribeField buttonPosition="side" value={email} onChange={setEmail} onSubmit={handleSubscribe} />`,
  doNot: [
    "Don't drop the disclaimer text via a wrapper override — it's a fixed part of this component's structure, not optional per Figma.",
  ],
  swizzlePath: "packages/core/src/SubscribeField.tsx",
  extends: null,
  // Fixed 2026-08-26, both gaps.
  accessibility: {
    ariaAttributes: [
      { attribute: "aria-label (via new `label` prop)", description: 'The nested TextField now has an accessible name via aria-label, defaulting to "Email address" — placeholder text alone (the previous state) is a known anti-pattern: it disappears once the user types, isn\'t announced consistently across screen readers, and typically fails color-contrast requirements. Deliberately aria-label rather than a visible <label> element, unlike Field: this component\'s Figma spec is placeholder-only by design, so the fix preserves the visual design while still giving assistive tech a real name.' },
    ],
    keyboardInteractions: [
      { key: "Enter (while focused in the input)", action: "Now fires onSubmit, matching Search's existing onKeyDown pattern (see Search.doc.mjs) — previously did nothing, since there's no <form> wrapping this component and no handler existed. A keyboard-only user no longer has to Tab all the way to the Button." },
    ],
  },
  // This component's radius/full submit-button precedent is what Search's
  // own circular submit button was built to match (see Search.doc.mjs).
  figmaTokens: {
    "row gap": "spacing.8",
    "disclaimer color": "color.text.tertiary",
    "disclaimer font-size": "font-style.body-small",
    "disclaimer line-height": "font-line-height.200-normal",
  },
};
