export default {
  name: "AccordionItem",
  summary: "A single collapsible FAQ-style row. Not a full accordion list — stack multiple instances and control `open` per-instance to build one.",
  props: [
    { name: "title", type: "string", default: "—", description: "The header row's title text." },
    { name: "children", type: "React.ReactNode", default: "—", description: "The answer content, rendered only while open." },
    { name: "open", type: "boolean", default: "—", description: "Whether the answer is expanded." },
    { name: "onToggle", type: "(open: boolean) => void", default: "—", description: "Fires with the new open value when the header is clicked." },
    { name: "disabled", type: "boolean", default: "false", description: "Non-interactive, dimmed background/border." },
  ],
  example: `<AccordionItem title="What is Latent?" open={openId === "1"} onToggle={(open) => setOpenId(open ? "1" : null)}>A proof-of-concept design system.</AccordionItem>`,
  doNot: [
    "Don't render AccordionItem as a standalone list component — it's one row; map over your data and render one instance per row, tracking which id is open yourself.",
  ],
  swizzlePath: "packages/core/src/AccordionItem.tsx",
  extends: null,
  // Verified against the real .tsx/.css, not inferred from props alone.
  states: [
    { name: "closed", description: "Header row only; answer content unmounted, not just hidden.", tokens: [] },
    { name: "open", description: "Answer content mounted below the header; chevron rotated 180deg.", tokens: [] },
    { name: "hover", description: "Container border darkens.", tokens: ["container border (hover)"] },
    { name: "focus-within", description: "Container border switches to the brand color while the header button has focus — the component's actual focus indicator (see accessibility.focusBehaviors below), not a ring on the button itself.", tokens: ["container border (focus-within)"] },
    { name: "disabled", description: "Container background/border dim; header button gets the native disabled attribute.", tokens: ["container background (disabled)", "container border (disabled)"] },
  ],
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Toggles open/closed — native <button> behavior, not a custom key handler." },
    ],
    ariaAttributes: [
      { attribute: "aria-expanded", description: "Set on the header <button>, reflects the open prop directly." },
    ],
    focusBehaviors: [
      "AccordionItem.css sets `.lat-accordion-item__header:focus { outline: none; }`, removing the native outline — but this is a real, working replacement, not a gap: the parent container uses `:focus-within` to switch its border to color.border.brand, so a visible focus indicator does exist, just on the row's border rather than a traditional ring on the button. Confirmed by reading the CSS, not assumed.",
      "One real, minor gap: the header button has no aria-controls pointing at the answer content, and the answer <div> has no id/role — a screen reader user gets aria-expanded but no explicit programmatic link to which content the button controls.",
    ],
  },
  figmaTokens: {
    "container padding/gap": "spacing.16",
    "container background": "color.background.default",
    "container border (default)": "color.border.default",
    "container border (hover)": "color.border.strong",
    "container border (focus-within)": "color.border.brand",
    "container background (disabled)": "color.background.subtle",
    "container border (disabled)": "color.border.subtle",
    "container border-radius": "radius.lg",
    "header/answer gap": "spacing.8",
    "title color": "color.text.primary",
    "title font-family": "font-family.sans",
    "title font-size": "font-size.300",
    "title font-weight": "font-weight.600",
    "chevron color": "color.icon.default",
    "answer text color": "color.text.primary",
    "answer font-size": "font-style.body",
  },
};
