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
  accessibility: {
    keyboardInteractions: [
      { key: "Tab", action: "Moves focus through each option button individually — both buttons are separately tabbable." },
      { key: "Enter or Space", action: "Selects the focused option — native <button>, not a custom handler." },
    ],
    ariaAttributes: [
      { attribute: 'role="tablist" / role="tab" / aria-selected', description: "Real, undocumented mismatch, confirmed by reading Toggle.tsx: the WAI-ARIA tabs pattern these roles imply expects Left/Right arrow-key navigation between tabs with only the active tab in the Tab order (a roving tabindex) — neither exists here. Every option is independently Tab-stoppable and there's no onKeyDown for arrow keys at all. Screen reader users get announced tab semantics without the interaction pattern those semantics promise." },
    ],
    focusBehaviors: [
      "No focus-visible styling anywhere in Toggle.css — confirmed by reading the source, not assumed. Same recurring gap as Switch/Badge's dismiss button: no custom ring, and no outline: none either, so the browser's default outline is what's actually shown, unstyled.",
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
