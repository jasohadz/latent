export default {
  name: "TopNav",
  summary: "A floating glass top navigation bar with mega-menu dropdowns for Product and Download.",
  props: [
    { name: "menu", type: '"none" | "product" | "download"', default: "none", description: "Which mega-menu panel is open. Controlled — this component holds no internal state; Product/Download links call onMenuChange to request a change." },
    { name: "onMenuChange", type: "(menu: TopNavMenu) => void", default: "undefined", description: "Fires when Product or Download is clicked, with the requested next `menu` value (clicking the already-open one requests \"none\", i.e. toggle-closed)." },
    { name: "logo", type: "React.ReactNode", default: "undefined", description: "Latent's own logo mark isn't a ported component — supply your own brand icon." },
    { name: "ctaLabel", type: "string", default: '"Free Trial"', description: "Label for the primary-variant CTA Button at the end of the bar." },
    { name: "onCtaClick", type: "() => void", default: "undefined", description: "Fires when the CTA Button is clicked." },
    { name: "productItems", type: "Omit<MegaMenuItemProps, 'layout'>[]", default: "[]", description: "4 Standard-layout items for the Product panel's 2x2 grid." },
    { name: "downloadFeatured", type: "Omit<MegaMenuItemProps, 'layout'>", default: "undefined", description: "The single Featured-layout item in the Download panel." },
    { name: "downloadItems", type: "Omit<MegaMenuItemProps, 'layout'>[]", default: "[]", description: "3 Standard-layout items, alongside downloadFeatured, in the same 2-column grid as the Product panel." },
  ],
  example: `<TopNav menu={menu} onMenuChange={setMenu} productItems={products} downloadFeatured={macDownload} downloadItems={otherDownloads} />`,
  doNot: [
    "Don't render Pricing with a chevron/menu — it's a plain link, unlike Product/Download.",
  ],
  swizzlePath: "packages/core/src/TopNav.tsx",
  extends: null,
  states: [
    { name: "menu: none", description: "No panel rendered below the bar.", tokens: [] },
    { name: "menu: product / download", description: "Corresponding panel renders below the bar; the matching TopNavLink shows its active label color (see TopNavLink.doc.mjs).", tokens: ["panel padding", "panel background", "panel border", "panel border-radius", "panel shadow"] },
  ],
  accessibility: {
    focusBehaviors: [
      "Gap, confirmed by reading the source: the Product/Download TopNavLink triggers receive no aria-expanded here — TopNav never passes one through, and TopNavLink doesn't accept one as a distinct concern (see TopNavLink.doc.mjs). Worth noting: NavDropdown (a structurally similar trigger+panel pattern elsewhere in this repo) does set aria-expanded correctly — this is an inconsistency between two components solving the same disclosure problem, not a universal gap.",
      "Gap, confirmed by reading the source: no Escape-to-close handling for an open panel, and the root has no role=\"navigation\"/aria-label landmark.",
    ],
  },
  figmaTokens: {
    "bar padding (vertical)": "spacing.8",
    "bar padding (horizontal)": "spacing.16",
    "bar gap": "spacing.24",
    "bar border-radius": "radius.lg",
    "bar border": "color.border.subtle",
    "bar background": "color.surface.raised",
    "panel padding": "spacing.12",
    "panel background": "color.surface.raised",
    "panel border": "color.border.subtle",
    "panel border-radius": "radius.card",
    "panel shadow": "elevation.md",
  },
};
