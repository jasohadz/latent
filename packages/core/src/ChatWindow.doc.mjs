export default {
  name: "ChatWindow",
  summary: "A full AI chat panel. Single component, no variants. A message slot stacked above a real ChatInput instance docked at the bottom.",
  props: [
    { name: "children", type: "React.ReactNode", default: "undefined", description: "Real MessageBubble instances, stacked per conversation." },
    { name: "inputProps", type: "ChatInputProps", default: "—", description: "Passed through to the docked ChatInput instance." },
  ],
  example: `<ChatWindow inputProps={{ value: message, onChange: setMessage, onSubmit: send }}><MessageBubble sender="assistant">Hi!</MessageBubble></ChatWindow>`,
  doNot: [
    "Don't pass raw strings/JSX as children — only real MessageBubble instances are the documented content model; anything else skips MessageBubble's own sender-based alignment/color tokens.",
  ],
  swizzlePath: "packages/core/src/ChatWindow.tsx",
  extends: null,
  // No states — single component, no variants, no interactive states of
  // its own (confirmed by reading the .tsx: a plain layout wrapper around
  // a message slot and a docked ChatInput).
  // Fixed 2026-08-26.
  accessibility: {
    ariaAttributes: [
      {
        attribute: 'role="log" / aria-live="polite" / aria-label="Chat messages" (message slot)',
        description: 'The message slot (.lat-chat-window__slot, the scrolling container children/MessageBubble instances stack into) now announces new messages to screen reader users as they\'re added. role="log" is the semantically correct role for this exact case (a stream of messages where new ones append and old ones remain relevant) — it implies aria-live="polite"/aria-atomic="false" on its own per the ARIA spec, but aria-live="polite" is set explicitly too for older/inconsistent AT support, matching common real-world practice rather than relying on implicit role semantics alone.',
      },
    ],
  },
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
