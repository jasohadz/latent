export default {
  name: "ChatInput",
  summary: "A message composer bar for AI chat interfaces. Used as the input row inside ChatWindow.",
  props: [
    { name: "value", type: "string", default: "—" },
    { name: "onChange", type: "(value: string) => void", default: "—" },
    { name: "onSubmit", type: "() => void", default: "undefined", description: "Fires on Enter or clicking the send button." },
    { name: "onAttach", type: "() => void", default: "undefined" },
    { name: "placeholder", type: "string", default: '"Message Latent..."' },
  ],
  example: `<ChatInput value={message} onChange={setMessage} onSubmit={sendMessage} />`,
  doNot: [
    "The send button's active (non-empty value) color isn't a documented Figma state — it's an app-requested affordance reusing color.action.primary.default, not a verified spec value.",
  ],
  swizzlePath: "packages/core/src/ChatInput.tsx",
  // Figma's leading/trailing button radius is radius/slimlg, now ported to
  // code as radius.slimlg (2026-08-20) — this still uses radius.input as a
  // substitute, unchanged since that substitution predates the port and
  // wasn't re-verified against Figma here; worth checking whether it should
  // switch to radius.slimlg now that it's available.
  figmaTokens: {
    "container padding": "spacing.2",
    "container gap": "spacing.8",
    "container background": "color.background.default",
    "container border-radius": "radius.lg",
    "attach background": "color.action.secondary.default",
    "attach/send border-radius": "radius.input",
    "attach icon color": "color.icon.default",
    "field text color": "color.text.primary",
    "field placeholder color": "color.text.tertiary",
    "field font-family": "font-family.sans",
    "field font-size": "font-style.body",
    "send background": "color.background.inverse",
    "send background (active, has value)": "color.action.primary.default",
    "send icon color": "color.icon.inverse",
  },
};
