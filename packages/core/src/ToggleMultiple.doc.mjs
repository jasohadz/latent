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
  // Same component, same gaps — ToggleMultiple.tsx is Toggle.tsx's exact
  // recipe generalized to N options, confirmed by reading both sources.
  accessibility: {
    keyboardInteractions: [
      { key: "Tab", action: "Moves focus through each option button individually — all options are separately tabbable, regardless of count." },
      { key: "Enter or Space", action: "Selects the focused option — native <button>, not a custom handler." },
    ],
    ariaAttributes: [
      { attribute: 'role="tablist" / role="tab" / aria-selected', description: "Same real mismatch as Toggle: the WAI-ARIA tabs pattern these roles imply expects Left/Right arrow-key navigation with a roving tabindex — neither exists here (no onKeyDown for arrow keys, every option independently tabbable). More pronounced with more options, since Tab has to step through every one individually instead of a single tab stop plus arrow keys." },
    ],
    focusBehaviors: [
      "No focus-visible styling anywhere in ToggleMultiple.css — confirmed by reading the source. No outline: none either, so the browser's unstyled default outline is what actually shows.",
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
