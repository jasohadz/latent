export default {
  name: "Toggle",
  summary: "A 2-option segmented control for mutually exclusive choices (e.g. switching between two views).",
  props: [
    { name: "options", type: "[string, string]", default: "—", description: "The two option labels, in order." },
    { name: "selectedIndex", type: "0 | 1", default: "—", description: "Which option is currently selected." },
    { name: "onChange", type: "(index: 0 | 1) => void", default: "—", description: "Fires when an option is clicked." },
  ],
  example: `<Toggle options={["List", "Grid"]} selectedIndex={0} onChange={setView} />`,
  doNot: [
    "Don't use Toggle for more than 2 options — use ToggleMultiple instead.",
  ],
  swizzlePath: "packages/core/src/Toggle.tsx",
  extends: null,
  states: [
    { name: "selected", description: "Raised surface background, primary text color, semibold weight.", tokens: ["option selected background", "option selected color", "option selected weight"] },
    { name: "unselected", description: "No background, tertiary text color, regular weight.", tokens: ["option unselected color", "option unselected weight"] },
  ],
  // Fixed 2026-08-26 — was a real ARIA-pattern-vs-implementation mismatch
  // (see git history): role="tablist"/"tab" implies Left/Right arrow-key
  // navigation with a roving tabindex, and neither existed. Now does.
  accessibility: {
    keyboardInteractions: [
      { key: "Tab", action: 'Enters/exits the control at exactly one point (the selected option\'s roving tabindex), not once per option — matches the WAI-ARIA tabs pattern role="tablist"/"tab" already implies.' },
      { key: "ArrowRight / ArrowLeft", action: "Moves selection to the other option — automatic activation (arrow moves focus AND fires onChange together, matching the APG's \"Tabs with Automatic Activation\" example), since this is an instant segmented control, not a tabs-with-panel-loading widget. Wraps at both ends." },
      { key: "Home / End", action: "Jumps to the first/last option." },
      { key: "Enter or Space", action: "Selects the focused option — native <button> activation, not a custom handler." },
    ],
    ariaAttributes: [
      { attribute: 'role="tablist" / role="tab" / aria-selected', description: "Now backed by the keyboard behavior these roles imply — previously present without it, which is worse than no ARIA role at all (announces behavior that doesn't exist)." },
    ],
    focusBehaviors: [
      "No custom/token-bound focus ring exists in Toggle.css — confirmed by reading the source. Toggle.css never sets outline: none either, so the browser's own unstyled default outline still shows on keyboard focus (it isn't literally invisible) — same recurring gap as Switch's, an accident of omission, not a deliberate design.",
    ],
  },
  figmaTokens: {
    "track background": "color.background.muted",
    "track padding/gap": "spacing.4",
    "track border-radius": "radius.full",
    "option padding (vertical)": "spacing.8",
    "option padding (horizontal)": "spacing.24",
    "option border-radius": "radius.full",
    "option font-size": "font-size.300",
    "option unselected weight": "font-weight.400",
    "option unselected color": "color.text.tertiary",
    "option selected background": "color.surface.raised",
    "option selected color": "color.text.primary",
    "option selected weight": "font-weight.600",
  },
};
