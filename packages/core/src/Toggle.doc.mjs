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
