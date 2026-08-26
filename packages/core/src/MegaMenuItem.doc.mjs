export default {
  name: "MegaMenuItem",
  summary: "The atomic row used inside TopNav's Product and Download dropdown panels.",
  props: [
    { name: "layout", type: '"standard" | "featured"', default: "standard", description: "featured adds a muted background and a real Badge instance." },
    { name: "icon", type: "React.ReactNode", default: "undefined", description: "e.g. <Icon name=\"apple\" />, shown leading the title/description column." },
    { name: "title", type: "string", default: "—", description: "The item's headline." },
    { name: "description", type: "string", default: "—", description: "The item's supporting line below the title." },
    { name: "badgeLabel", type: "string", default: '"New"', description: "Only rendered when layout=\"featured\"." },
  ],
  example: `<MegaMenuItem layout="featured" icon={<Icon name="apple" />} title="Download for macOS" description="Recommended for most users" badgeLabel="New" />`,
  doNot: [
    "Don't pass badgeLabel with layout=\"standard\" and expect it to show — the Badge only renders when layout=\"featured\".",
  ],
  swizzlePath: "packages/core/src/MegaMenuItem.tsx",
  extends: "React.ButtonHTMLAttributes<HTMLButtonElement>",
  // No `states` here, by design, not omission: `layout` (standard/
  // featured) is a display variant already captured as a props enum, not
  // an interaction state — and confirmed by reading MegaMenuItem.css in
  // full, there is no hover/pressed/focus rule anywhere in the file at
  // all (see the accessibility gap below), so there's no real interactive
  // state to document beyond what the props already say.
  accessibility: {
    focusBehaviors: [
      "Significant gap, confirmed by reading MegaMenuItem.css in full: despite being cursor: pointer and a real <button>, there is zero hover, pressed, or focus-visible styling anywhere in the file — a keyboard or mouse user gets no visual feedback at all that this item is interactive or currently focused.",
    ],
  },
  figmaTokens: {
    "padding/gap": "spacing.12",
    "border-radius": "radius.lg",
    "featured background": "color.background.muted",
    "icon color": "color.icon.default",
    "title color": "color.text.primary",
    "title font-family": "font-family.sans",
    "title font-size": "font-style.body",
    "title font-weight": "font-weight.600",
    "description color": "color.text.tertiary",
    "description font-size": "font-style.body-small",
  },
};
