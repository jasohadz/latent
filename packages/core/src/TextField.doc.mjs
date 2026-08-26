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
  extends: "React.InputHTMLAttributes<HTMLInputElement>",
  states: [
    { name: "default", description: "Resting border color.", tokens: ["border (default)"] },
    { name: "hover", description: ":hover:not(:disabled) — real CSS pseudo-state, not manual.", tokens: ["border (hover)"] },
    { name: "focus", description: "Real CSS :focus (not :focus-visible — deliberately fires on any focus including mouse click, appropriate for a text field where clicking in should visibly show focus, unlike a button). Border widens and changes color; native outline suppressed and replaced by the border change, not removed outright.", tokens: ["border (focus)", "border width (focus/error)"] },
    { name: "disabled", description: "Native :disabled pseudo-state.", tokens: ["border (disabled)"] },
    { name: "error", description: "Manual boolean prop, not a CSS pseudo-state or native validity check. Now also drives aria-invalid — see accessibility below.", tokens: ["border (error)", "border width (focus/error)"] },
  ],
  // Fixed 2026-08-26: error now sets aria-invalid automatically instead
  // of only changing the border color. A caller can still override it
  // explicitly (aria-invalid is a real HTML attribute passed through
  // ...rest, spread after the automatic value) — the automatic value is
  // a default, not a lock.
  accessibility: {
    ariaAttributes: [
      { attribute: "aria-invalid", description: 'Set to "true" whenever error is true, undefined (omitted) otherwise — derived from the same prop that drives the visual danger border, so the two can no longer silently drift out of sync the way they could when a consumer had to set both separately.' },
    ],
  },
  // No focusBehaviors entry: unlike the components above, TextField's
  // focus indication is real and token-bound (border (focus) above) —
  // not the recurring missing-focus-ring gap, so nothing to flag here.
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
