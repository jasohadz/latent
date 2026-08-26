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
  extends: null,
  // Verified 2026-08-26 (resolves the "still unverified" flag left from
  // 2026-07-29's transient connection timeout): MessageBubble's own
  // standalone component instance only shows one static example (blue/
  // on-brand), so check-component-bindings correctly can't see "user"
  // evidence there. Confirmed instead via ChatWindow's real usage — its
  // example conversation instantiates 5 MessageBubbles alternating
  // assistant/user/assistant/user/assistant, matching an alternating
  // textFillVar of color/text/on-brand, color/text/primary, on-brand,
  // primary, on-brand exactly. Drilled into the second (color/text/
  // primary) bubble's own child tree: its ".Message Item" background
  // fill binds color/background/default, and its text fill binds
  // color/text/primary — both match what's already declared below. The
  // assistant/user assignment was correct all along, not backwards.
  // check-component-bindings still can't see this on its own (the
  // evidence lives in ChatWindow's usage, not MessageBubble's own
  // component tree), hence the skip list below.
  figmaTokensSkipLiveCheck: ["user background", "user text color"],
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
