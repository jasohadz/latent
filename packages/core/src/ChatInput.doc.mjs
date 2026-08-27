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
    "Don't assume the send button's filled-state color is blue/brand — it's color.background.inverse (dark), the same token the empty state's *container* uses elsewhere in the system, not color.action.primary.default. That was an earlier, unverified guess (see the 2026-08-27 correction note below), now replaced with the real Figma value.",
  ],
  swizzlePath: "packages/core/src/ChatInput.tsx",
  extends: null,
  // Verified against the real .tsx/.css, not inferred from props alone.
  states: [
    { name: "empty (value=empty)", description: "Send button uses a muted background — value.trim() is falsy. Matches Figma's real \"value=empty\" variant exactly.", tokens: ["send background"] },
    { name: "filled (value=filled)", description: "Send button switches to an inverse (dark) background once value.trim() is truthy — matches Figma's real \"value=filled\" variant exactly, not an invented affordance.", tokens: ["send background (filled)"] },
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
  // Three focus-ring entries: deliberate code-only addition, not a Figma
  // binding — Figma's real ChatInput field has no focus ring bound at all
  // (confirmed by the live pull this check is built on). Fixed 2026-08-26
  // to replace a bare outline: none with a real ring, filling a gap
  // Figma's own design doesn't have.
  // "field font-family": confirmed the live text node's font family is a
  // literal "Geist", not bound to any Variable — nothing for this check
  // to find regardless of correctness.
  // "field font-size": Figma's real text node binds font-size/body
  // (Breakpoint) — resolves to the same primitive as our declared
  // font-style.body (Semantic) at desktop. Same deliberate-simplification
  // pattern as Calendar's weekday font-size.
  // 2026-08-27 correction, found via a real live Figma pull of the actual
  // "Chat Input" COMPONENT_SET on the Ai Chat doc page (a real value=empty/
  // value=filled variant pair — this was NOT a foreign/context reference,
  // it's Latent's own already-ported component), prompted by the user
  // updating it in Figma and reporting the coded version didn't match:
  // - "send background" was color.background.inverse (dark) for the empty
  //   state — wrong. Figma's real value=empty variant binds
  //   color.background.muted (a light, subtle gray).
  // - The filled state was invented entirely (color.action.primary.default,
  //   a blue never present in Figma) — replaced with Figma's real
  //   value=filled binding, color.background.inverse (dark) — the exact
  //   value the empty state was wrongly using before.
  // - "send icon color" (color.icon.inverse) is unchanged and correct in
  //   both states — confirmed identical in the live pull, not something
  //   this correction touched.
  // This was a real, verifiable spec the whole time; the original 2026-07-29
  // port simply never found it and documented the whole state pair as an
  // unverified app-requested guess instead of investigating further.
  figmaTokensSkipLiveCheck: [
    "focus ring color",
    "focus ring width",
    "focus ring offset",
    "field font-family",
    "field font-size",
  ],
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
    "send background": "color.background.muted",
    "send background (filled)": "color.background.inverse",
    "send icon color": "color.icon.inverse",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "focus ring offset": "sizing.focus-ring-offset",
  },
};
