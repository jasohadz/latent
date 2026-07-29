export default {
  name: "TextField",
  summary: "Single-line text input. filled/outline appearance, both react to hover/focus/disabled natively plus an explicit error state.",
  props: [
    { name: "appearance", type: '"filled" | "outline"', default: "outline", description: "filled has no border by default (gains one on hover); outline always has a border." },
    { name: "error", type: "boolean", default: "false", description: "Not a native pseudo-state — set explicitly (e.g. from form validation) to show the danger border." },
    { name: "...rest", type: "React.InputHTMLAttributes<HTMLInputElement>", default: "—", description: "All standard input props (value, onChange, disabled, etc.) pass through." },
  ],
  example: `<TextField appearance="outline" value={value} onChange={(e) => setValue(e.target.value)} />`,
  doNot: [
    "Don't hardcode the placeholder text via a className override — pass a `placeholder` prop like any native input.",
  ],
  swizzlePath: "packages/core/src/TextField.tsx",
  figmaTokens: {
    "padding": "spacing.8",
    "border-radius": "radius.lg",
    "text color": "color.text.primary",
    "placeholder color": "color.text.tertiary",
    "font-size": "font-style.body-small",
    "line-height": "font-line-height.200-normal",
    "border (default)": "color.border.default",
    "border (hover)": "color.border.strong",
    "border (focus)": "color.border.brand",
    "border width (focus/error)": "sizing.border.thin",
    "border (disabled)": "color.border.subtle",
    "border (error)": "color.border.danger",
    "background (filled)": "color.background.muted",
  },
};
