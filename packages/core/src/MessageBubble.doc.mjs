export default {
  name: "MessageBubble",
  summary: "A single chat message. Meant to populate ChatWindow's message slot (one or more instances stacked per conversation).",
  props: [
    { name: "sender", type: '"user" | "assistant"', default: "—", description: "Controls bubble alignment (assistant left, user right) and styling." },
    { name: "children", type: "React.ReactNode", default: "—", description: "The message content, typically plain text." },
  ],
  example: `<MessageBubble sender="assistant">How can I help?</MessageBubble>`,
  doNot: [
    "Don't render MessageBubble outside ChatWindow's message slot — its row alignment (assistant left, user right) assumes ChatWindow's full-width flex container.",
  ],
  swizzlePath: "packages/core/src/MessageBubble.tsx",
  // Text color for the assistant bubble (color/text/on-brand, white) is
  // inferred from its blue color/action/primary/default fill matching
  // Button's primary variant — not independently re-verified against the
  // exact Figma text node due to a transient connection timeout during
  // the original port session (2026-07-29). Still unverified.
  figmaTokens: {
    "bubble padding (vertical)": "spacing.8",
    "bubble padding (horizontal)": "spacing.16",
    "bubble border-radius": "radius.slimlg",
    "assistant background": "color.action.primary.default",
    "assistant text color": "color.text.on-brand",
    "user background": "color.background.default",
    "user text color": "color.text.primary",
  },
};
