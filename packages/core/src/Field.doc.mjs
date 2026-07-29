export default {
  name: "Field",
  summary: "A labeled form-field wrapper around a real TextField instance, for standard form layouts.",
  props: [
    { name: "label", type: "string", default: "—" },
    { name: "helperText", type: "string", default: "undefined", description: "Shown below the input. Gets a leading alert icon and danger color when `error` is true." },
    { name: "...rest", type: "TextFieldProps", default: "—", description: "All TextField props (appearance, error, value, onChange, disabled, etc.) pass through to the nested TextField." },
  ],
  example: `<Field label="Email" placeholder="you@example.com" helperText="This field is required" error />`,
  doNot: [
    "Don't set Field's own value/state independent of the nested TextField — there's no separate value axis at this level, per Figma's own note.",
  ],
  swizzlePath: "packages/core/src/Field.tsx",
  figmaTokens: {
    "field gap": "spacing.4",
    "label color": "color.text.secondary",
    "label font-family": "font-family.sans",
    "label font-size": "font-style.body-small",
    "label font-weight": "font-weight.600",
    "label line-height": "font-line-height.200-normal",
    "helper color": "color.text.tertiary",
    "helper color (error)": "color.text.danger",
    "helper font-size": "font-style.body-small",
    "helper line-height": "font-line-height.200-normal",
  },
};
