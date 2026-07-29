export default {
  name: "MessageBubble",
  summary: "A single chat message. Meant to populate ChatWindow's message slot (one or more instances stacked per conversation).",
  props: [
    { name: "sender", type: '"user" | "assistant"', default: "—", description: "Controls bubble alignment (assistant left, user right) and styling." },
    { name: "children", type: "React.ReactNode", default: "—" },
  ],
  example: `<MessageBubble sender="assistant">How can I help?</MessageBubble>`,
  doNot: [],
  swizzlePath: "packages/core/src/MessageBubble.tsx",
  // radius/slimlg (Figma's actual bubble radius) hasn't been ported to
  // code — using the existing radius.input, same substitution used
  // elsewhere for this un-ported token. Text color for the assistant
  // bubble (color/text/on-brand, white) is inferred from its blue
  // color/action/primary/default fill matching Button's primary variant —
  // not independently re-verified against the exact Figma text node due
  // to a transient connection timeout during this session.
  figmaTokens: {
    "bubble padding (vertical)": "spacing.8",
    "bubble padding (horizontal)": "spacing.16",
    "bubble border-radius": "radius.input",
    "assistant background": "color.action.primary.default",
    "assistant text color": "color.text.on-brand",
    "user background": "color.background.default",
    "user text color": "color.text.primary",
  },
};
