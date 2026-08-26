export default {
  name: "ToggleMultiple",
  summary: "Toggle's 2-option segmented-control recipe generalized to N options (demonstrated with 5 in Figma).",
  props: [
    { name: "options", type: "string[]", default: "—", description: "The option labels, in order." },
    { name: "selectedIndex", type: "number", default: "—", description: "Which option is currently selected." },
    { name: "onChange", type: "(index: number) => void", default: "—", description: "Fires when an option is clicked." },
  ],
  example: `<ToggleMultiple options={["Day", "Week", "Month", "Quarter", "Year"]} selectedIndex={1} onChange={setRange} />`,
  doNot: [
    "Don't use ToggleMultiple for exactly 2 options — use Toggle instead (same recipe, narrower/simpler API).",
  ],
  swizzlePath: "packages/core/src/ToggleMultiple.tsx",
  extends: null,
  states: [
    { name: "selected", description: "Raised surface background, primary text color, semibold weight.", tokens: ["option selected background", "option selected color", "option selected weight"] },
    { name: "unselected", description: "No background, tertiary text color, regular weight.", tokens: ["option unselected color", "option unselected weight"] },
  ],
  // Same component, same fix — ToggleMultiple.tsx is Toggle.tsx's exact
  // recipe generalized to N options (modulo wraparound instead of a
  // 2-option ternary), confirmed by reading both sources. Fixed 2026-08-26,
  // same change and same reasoning as Toggle.doc.mjs — see there.
  accessibility: {
    keyboardInteractions: [
      { key: "Tab", action: 'Enters/exits the control at exactly one point (the selected option\'s roving tabindex), not once per option, regardless of option count — matches the WAI-ARIA tabs pattern role="tablist"/"tab" already implies.' },
      { key: "ArrowRight / ArrowLeft", action: "Moves selection to the next/previous option — automatic activation (arrow moves focus AND fires onChange together), matching the APG's \"Tabs with Automatic Activation\" example. Wraps at both ends (End → ArrowRight goes to the first option, and vice versa)." },
      { key: "Home / End", action: "Jumps to the first/last option." },
      { key: "Enter or Space", action: "Selects the focused option — native <button> activation, not a custom handler." },
    ],
    ariaAttributes: [
      { attribute: 'role="tablist" / role="tab" / aria-selected', description: "Now backed by the keyboard behavior these roles imply — previously present without it. Matters more here than on Toggle since more options meant more Tab stops to step through with nothing to indicate the tabs pattern was only cosmetic." },
    ],
    focusBehaviors: [
      "No custom/token-bound focus ring exists in ToggleMultiple.css — confirmed by reading the source. No outline: none either, so the browser's own unstyled default outline still shows on keyboard focus — same recurring gap as Toggle's/Switch's, an accident of omission, not a deliberate design.",
    ],
  },
  // "option unselected weight" is skipped below (figmaTokensSkipLiveCheck):
  // confirmed correct (400, matching font-weight.400 exactly) but Figma
  // has this as an unbound literal on the text node, not a Variable —
  // nothing for check-component-bindings to find regardless of correctness.
  figmaTokensSkipLiveCheck: ["option unselected weight"],
  figmaTokens: {
    "track background": "color.background.muted",
    "track padding/gap": "spacing.4",
    "track border-radius": "radius.full",
    "option padding (vertical)": "spacing.8",
    "option padding (horizontal)": "spacing.24",
    "option border-radius": "radius.full",
    // Fixed 2026-08-26: was font-size.300 (16px) — a real, visible size
    // bug, not just a wrong-token-same-value case. Figma's real option
    // text is 14px, bound to font-style.body-small (confirmed by reading
    // the live text nodes directly, all 5 options).
    "option font-size": "font-style.body-small",
    "option unselected weight": "font-weight.400",
    "option unselected color": "color.text.tertiary",
    "option selected background": "color.surface.raised",
    "option selected color": "color.text.primary",
    "option selected weight": "font-weight.600",
  },
};
