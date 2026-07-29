export default {
  name: "ChatWindow",
  summary: "A full AI chat panel. Single component, no variants. A message slot stacked above a real ChatInput instance docked at the bottom.",
  props: [
    { name: "children", type: "React.ReactNode", default: "undefined", description: "Real MessageBubble instances, stacked per conversation." },
    { name: "inputProps", type: "ChatInputProps", default: "—", description: "Passed through to the docked ChatInput instance." },
  ],
  example: `<ChatWindow inputProps={{ value: message, onChange: setMessage, onSubmit: send }}><MessageBubble sender="assistant">Hi!</MessageBubble></ChatWindow>`,
  doNot: [],
  swizzlePath: "packages/core/src/ChatWindow.tsx",
  // Only "fills" and the slot's own itemSpacing were captured as bound
  // variables on this node — outer padding wasn't directly verified (no
  // bound paddingLeft/Top/etc showed up in the fetch), so spacing.16 here
  // is a reasonable inferred default matching the component's visible
  // inset, not a confirmed Figma binding. No border-radius was bound
  // either, so none is applied here.
  figmaTokens: {
    "container background": "color.background.subtle",
    "slot gap": "spacing.12",
  },
};
