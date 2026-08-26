export default {
  name: "BadgeGroup",
  summary: "A clickable label row that optionally pairs with a real Badge instance, for \"what's new\" banners or filter-summary links.",
  props: [
    { name: "position", type: '"leading" | "trailing" | "none"', default: "leading", description: "leading: Badge -> text -> chevron. trailing: text -> Badge (no chevron). none: text -> chevron (no Badge)." },
    { name: "size", type: '"small" | "large"', default: "small", description: "Scales the row's font-size and the nested Badge's own size (small→small, large→medium)." },
    { name: "badgeLabel", type: "string", default: '"New"', description: "Passed to the nested Badge instance (variant is always brand)." },
    { name: "children", type: "React.ReactNode", default: "—", description: "The label text." },
  ],
  example: `<BadgeGroup position="leading" badgeLabel="New" onClick={handleClick}>Latent 2.0 is here</BadgeGroup>`,
  doNot: [
    "Don't pass position=\"trailing\" and expect a chevron — trailing intentionally has no chevron, only leading/none do.",
  ],
  swizzlePath: "packages/core/src/BadgeGroup.tsx",
  extends: "React.ButtonHTMLAttributes<HTMLButtonElement>",
  // No `states` field — position/size are the only variation, already
  // documented as props; no hover/disabled CSS exists to describe.
  accessibility: {
    keyboardInteractions: [
      { key: "Enter or Space", action: "Activates the click handler — native <button> behavior." },
    ],
    focusBehaviors: [
      "BadgeGroup.css sets no :focus/:focus-visible rule of its own — confirmed by reading the source. The browser's default focus outline applies unmodified, unlike Switch (no focus styling at all, a real gap) or AccordionItem (a custom :focus-within border). Worth knowing this is relying on the platform default, not a deliberate design choice either way.",
    ],
  },
  figmaTokens: {
    "container padding": "spacing.4",
    "container gap": "spacing.8",
    "container background": "color.background.muted",
    "container border-radius": "radius.full",
    "text color": "color.text.primary",
    "text font-size (small)": "font-style.body-small",
    "text font-size (large)": "font-style.body",
    "text line-height": "font-line-height.200-normal",
    "chevron color": "color.icon.default",
  },
};
