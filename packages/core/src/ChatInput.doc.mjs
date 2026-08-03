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
  // radius/slimlg (the leading/trailing button radius in Figma) hasn't
  // been ported to code — using the existing radius.input, same
  // substitution already used elsewhere for this un-ported token.
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
