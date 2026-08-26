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
  // `layout` (standard/featured) stays a props enum, not a `states` entry
  // — it's a display variant, not an interaction state. Fixed 2026-08-26
  // (part of the TopNav-family pass — see TopNav.doc.mjs/TopNavLink.doc.mjs):
  // real hover/pressed/focus-visible states now exist, so they're
  // documented here instead of the old "there is no interactive state at
  // all" note.
  states: [
    { name: "hover", description: "Muted background on pointer hover — same token as Button's secondary/ghost hover.", tokens: ["hover background"] },
    { name: "pressed", description: "Slightly stronger background while the mouse button is held down.", tokens: ["pressed background"] },
    { name: "featured", description: "layout=\"featured\" only: muted background at rest, overridden by hover/pressed above while interacting.", tokens: ["featured background"] },
  ],
  accessibility: {
    focusBehaviors: [
      "Fixed: token-bound hover/pressed backgrounds and a focus-visible ring added (same pattern as Button/TopNavLink) — outline: none on :focus, a real outline on :focus-visible. Previously zero hover, pressed, or focus styling existed anywhere in the file despite being a real, clickable <button>.",
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
    "hover background": "color.action.secondary.hover",
    "pressed background": "color.action.secondary.pressed",
    "focus ring color": "color.border.focus",
    "focus ring width": "sizing.border.thin",
    "focus ring offset": "sizing.focus-ring-offset",
  },
};
