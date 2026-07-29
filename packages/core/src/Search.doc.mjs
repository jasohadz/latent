export default {
  name: "Search",
  summary: "Search field with a leading search icon, optional trailing clear button, and an attached circular submit button reusing Button's primary color ramp.",
  props: [
    { name: "appearance", type: '"filled" | "outline"', default: "outline" },
    { name: "value", type: "string", default: "—" },
    { name: "onChange", type: "(value: string) => void", default: "—" },
    { name: "onSubmit", type: "() => void", default: "undefined", description: "Fires on Enter or clicking the submit button." },
    { name: "placeholder", type: "string", default: '"Search..."' },
    { name: "disabled", type: "boolean", default: "false" },
  ],
  example: `<Search appearance="outline" value={query} onChange={setQuery} onSubmit={handleSearch} />`,
  doNot: [
    "Don't expect a small/condensed size tier — built at one size (Density=Default) for v1, per Figma's own documented gap.",
  ],
  swizzlePath: "packages/core/src/Search.tsx",
  // Submit button is a bespoke circular element, not a <Button> instance —
  // Button.tsx doesn't support a true icon-only circular shape (same gap
  // noted in Calendar's nav buttons and Card's CTA). Styled directly with
  // the same tokens the real Figma Button instance underneath it uses.
  figmaTokens: {
    "container padding": "spacing.4",
    "container gap": "spacing.8",
    "container background": "color.background.default",
    "container border": "color.border.default",
    "container border (hover)": "color.border.strong",
    "container border-radius": "radius.lg",
    "container background (filled)": "color.background.muted",
    "container background (disabled)": "color.action.secondary.disabled",
    "field border-radius": "radius.input",
    "field padding": "spacing.12",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "leading icon color": "color.icon.subtle",
    "input text color": "color.text.primary",
    "input placeholder color": "color.text.tertiary",
    "input font-size": "font-style.body",
    "clear icon color": "color.icon.subtle",
    "submit border": "color.border.brand",
    "submit border-radius": "radius.full",
    "submit background": "color.action.primary.default",
    "submit icon color": "color.icon.inverse",
    "submit padding": "spacing.8",
  },
};
