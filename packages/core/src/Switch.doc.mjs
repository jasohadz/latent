export default {
  name: "Switch",
  summary: "An on/off toggle for boolean settings.",
  props: [
    { name: "pressed", type: "boolean", default: "—", description: "Whether the switch is on." },
    { name: "onChange", type: "(pressed: boolean) => void", default: "—", description: "Fires with the new pressed value when clicked." },
    { name: "disabled", type: "boolean", default: "false", description: "50% opacity on the track; the on+disabled track uses a distinct dimmed brand color, not just opacity over the normal on-color." },
    { name: "supportingText", type: "string", default: "undefined", description: "Optional caption rendered beside the track. It's also the switch's accessible name (aria-labelledby)." },
    { name: "aria-label", type: "string", default: "undefined", description: "Accessible name for a switch with no supportingText. Ignored when supportingText is set. Without either, the switch has no name and warns in dev." },
  ],
  example: `<Switch pressed={enabled} onChange={setEnabled} supportingText="Enable notifications" />`,
  doNot: [
    "Don't render a Switch with neither supportingText nor aria-label — screen readers announce it as an unnamed switch.",
    "Don't hardcode the thumb travel distance in a consumer override — it's derived from the track/thumb/padding sizes here; change those instead.",
  ],
  swizzlePath: "packages/core/src/Switch.tsx",
  extends: null,
  // Verified against the real .tsx/.css, not inferred from props alone.
  states: [
    { name: "off", description: "Track uses the muted background color; thumb sits at the track's start.", tokens: ["track background (off)"] },
    { name: "on", description: "Track uses the primary action color; thumb translates to the track's end.", tokens: ["track background (on)"] },
    { name: "disabled (off)", description: "Track drops to 50% opacity via a plain CSS opacity rule — no dedicated token exists for this specific combination, unlike on+disabled below.", tokens: [] },
    { name: "disabled (on)", description: "Track uses a distinct dimmed brand color, not just opacity over the on-color — the one state where disabled looks different depending on pressed value.", tokens: ["track background (on + disabled)"] },
  ],
  // No keyboardInteractions custom handler exists in the source — Enter/
  // Space activation is native <button> behavior, not something this
  // component implements itself, which is exactly why it's reliable.
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Toggles the switch — inherited for free from rendering role=\"switch\" on a real <button>, not a custom key handler." },
    ],
    ariaAttributes: [
      { attribute: 'role="switch"', description: "Identifies the control as a switch, not a generic button, to assistive tech." },
      { attribute: "aria-checked", description: "Kept in sync with the pressed prop directly." },
      { attribute: "aria-labelledby / aria-label", description: "Fixed 2026-10-02 (axe button-name, found by the Storybook a11y audit): the supportingText caption now names the switch via aria-labelledby; with no caption, the aria-label prop does. Before, the caption sat beside the button unconnected and the switch had no accessible name." },
    ],
    focusBehaviors: [
      "Fixed 2026-08-26: token-bound :focus-visible ring added, same pattern as Button/MegaMenuItem/TopNavLink — outline: none on :focus, a real outline on :focus-visible bound to color.border.focus/sizing.border.thin/sizing.focus-ring-offset. Previously relied on the browser's unstyled default outline by accident (Switch.css never set outline: none either), not a deliberate design.",
    ],
  },
  // The three focus-ring entries are skipped below (figmaTokensSkipLiveCheck)
  // — deliberate code-only additions, not Figma bindings: Figma's real
  // Switch component has no focus ring at all (confirmed by the live pull
  // this check is built on), this was an accessibility fix filling a gap
  // Figma's own design doesn't have. Not "unverified" — verified by
  // reading the real component and finding the gap, just not verifiable
  // by this particular mechanical check.
  figmaTokensSkipLiveCheck: ["focus ring color", "focus ring width", "focus ring offset"],
  figmaTokens: {
    "track background (off)": "color.background.muted",
    "track background (on)": "color.action.primary.default",
    "track background (on + disabled)": "color.action.primary.disabled",
    "track/thumb border-radius": "radius.full",
    "thumb background": "color.surface.raised",
    "supporting text color": "color.text.tertiary",
    // Fixed 2026-08-26: was font-size.200 — resolves to the same 14px
    // value but isn't the token Figma actually has bound (font/style/
    // body-small, confirmed by reading the live text node directly).
    "supporting text font-size": "font-style.body-small",
    "supporting text line-height": "font-line-height.200-normal",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "focus ring offset": "sizing.focus-ring-offset",
  },
};
