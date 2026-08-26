export default {
  name: "ChatInput",
  summary: "A message composer bar for AI chat interfaces. Used as the input row inside ChatWindow.",
  props: [
    { name: "value", type: "string", default: "—", description: "The composer field's current text. Controlled — this component holds no internal state." },
    { name: "onChange", type: "(value: string) => void", default: "—", description: "Fires on every keystroke with the field's new text." },
    { name: "onSubmit", type: "() => void", default: "undefined", description: "Fires on Enter or clicking the send button." },
    { name: "onAttach", type: "() => void", default: "undefined", description: "Fires when the leading attach (+) button is clicked." },
    { name: "placeholder", type: "string", default: '"Message Latent..."', description: "Placeholder text shown when value is empty." },
  ],
  example: `<ChatInput value={message} onChange={setMessage} onSubmit={sendMessage} />`,
  doNot: [
    "The send button's active (non-empty value) color isn't a documented Figma state — it's an app-requested affordance reusing color.action.primary.default, not a verified spec value.",
  ],
  swizzlePath: "packages/core/src/ChatInput.tsx",
  extends: null,
  // Verified against the real .tsx/.css, not inferred from props alone.
  states: [
    { name: "empty", description: "Send button uses the default inverse background — value.trim() is falsy.", tokens: ["send background"] },
    { name: "has value", description: "Send button switches to the primary action color once value.trim() is truthy — a real, class-driven state change, not just a visual affordance.", tokens: ["send background (active, has value)"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter", action: "Submits the message — a custom onKeyDown handler on the text <input>, not native form-submit behavior (there's no <form> element here)." },
    ],
    ariaAttributes: [
      { attribute: 'aria-label="Attach"', description: "Set on the leading icon-only button — required since it has no visible text label." },
      { attribute: 'aria-label="Send message"', description: "Set on the trailing icon-only button — required since it has no visible text label." },
    ],
    focusBehaviors: [
      "Fixed 2026-08-26: a real :focus-visible style was added, bound to color.border.focus/sizing.border.thin/sizing.focus-ring-offset — the same tokens Button's own focus ring uses. Previously `outline: none` on :focus had no replacement, actively removing the browser's native default outline rather than simply lacking a custom one — worse than a missing ring, not just equivalent to one. Scoped to the text field only, matching what was actually flagged — the attach/send icon buttons were never called out as a gap and weren't touched.",
    ],
  },
  figmaTokens: {
    "container padding": "spacing.2",
    "container gap": "spacing.8",
    "container background": "color.background.default",
    "container border-radius": "radius.lg",
    "attach background": "color.action.secondary.default",
    "attach/send border-radius": "radius.slimlg",
    "attach icon color": "color.icon.default",
    "field text color": "color.text.primary",
    "field placeholder color": "color.text.tertiary",
    "field font-family": "font-family.sans",
    "field font-size": "font-style.body",
    "send background": "color.background.inverse",
    "send background (active, has value)": "color.action.primary.default",
    "send icon color": "color.icon.inverse",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "focus ring offset": "sizing.focus-ring-offset",
  },
};
