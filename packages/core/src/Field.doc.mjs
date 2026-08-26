export default {
  name: "Field",
  summary: "A labeled form-field wrapper around a real TextField instance, for standard form layouts.",
  props: [
    { name: "label", type: "string", default: "—", description: "The field's visible label, rendered above the nested TextField." },
    { name: "helperText", type: "string", default: "undefined", description: "Shown below the input. Gets a leading alert icon and danger color when `error` is true." },
    { name: "...rest", type: "TextFieldProps", default: "—", description: "All TextField props (appearance, error, value, onChange, disabled, etc.) pass through to the nested TextField." },
  ],
  example: `<Field label="Email" placeholder="you@example.com" helperText="This field is required" error />`,
  doNot: [
    "Don't set Field's own value/state independent of the nested TextField — there's no separate value axis at this level, per Figma's own note.",
  ],
  swizzlePath: "packages/core/src/Field.tsx",
  extends: "TextFieldProps",
  states: [
    { name: "error", description: "helperText gets a leading alert icon and switches to the danger color; the nested TextField's own error state is separate and passes through via ...rest.", tokens: ["helper color (error)"] },
  ],
  accessibility: {
    ariaAttributes: [
      { attribute: "for/id association", description: "Real, undocumented gap, confirmed by reading Field.tsx: the <label> has no htmlFor, and the nested TextField's input has no id being passed down for it to reference. Label and input aren't programmatically associated — a screen reader won't announce the label on input focus, and clicking the label text won't focus the input. Not a deliberate design decision, flagged here rather than papered over." },
    ],
  },
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
