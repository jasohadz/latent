export default {
  name: "SubscribeField",
  summary: "An email-capture row pairing a real TextField instance with a real Button instance, plus a terms disclaimer below.",
  props: [
    { name: "buttonPosition", type: '"side" | "bottom"', default: "side", description: "side: button sits beside the input, inline. bottom: button stacks below the input." },
    { name: "placeholder", type: "string", default: '"Enter text"' },
    { name: "buttonLabel", type: "string", default: '"Subscribe"' },
    { name: "value", type: "string", default: "undefined" },
    { name: "onChange", type: "(value: string) => void", default: "undefined" },
    { name: "onSubmit", type: "() => void", default: "undefined" },
  ],
  example: `<SubscribeField buttonPosition="side" value={email} onChange={setEmail} onSubmit={handleSubscribe} />`,
  doNot: [
    "Don't drop the disclaimer text via a wrapper override — it's a fixed part of this component's structure, not optional per Figma.",
  ],
  swizzlePath: "packages/core/src/SubscribeField.tsx",
  // This component's radius/full submit-button precedent is what Search's
  // own circular submit button was built to match (see Search.doc.mjs).
  figmaTokens: {
    "row gap": "spacing.8",
    "disclaimer color": "color.text.tertiary",
    "disclaimer font-size": "font-style.body-small",
    "disclaimer line-height": "font-line-height.200-normal",
  },
};
