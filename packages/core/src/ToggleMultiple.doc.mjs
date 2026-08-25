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
