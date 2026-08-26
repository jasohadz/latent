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
  // Fixed 2026-08-26 (the "TopNav family" pass — see TopNavLink.doc.mjs
  // and MegaMenuItem.doc.mjs for the other two components in the same
  // fix). Scope: aria-expanded/aria-haspopup on the two real triggers,
  // Escape-to-close, and a navigation landmark on the root. NOT in
  // scope: focus doesn't move anywhere on Escape (stays wherever it
  // was — no focus-return-to-trigger management), and there's still no
  // arrow-key navigation within an open panel (MegaMenuItem rows are
  // Tab-stops, not an ARIA menu widget) — same honest-scoping discipline
  // as Toggle/Calendar: no role implying behavior that isn't real.
  accessibility: {
    keyboardInteractions: [
      { key: "Escape", action: 'Closes the currently open panel (onMenuChange("none")) if one is open. No-op otherwise. Does not move focus.' },
    ],
    ariaAttributes: [
      { attribute: "aria-expanded (Product/Download TopNavLink instances)", description: "Now set to whether that link's own panel is open — matches NavDropdown's existing correct handling of the same trigger+panel pattern elsewhere in this repo." },
      { attribute: 'aria-haspopup="true" (Product/Download TopNavLink instances)', description: 'Deliberately the generic "true", not "menu" — the open panel is a set of Tab-stoppable buttons, not an ARIA menu widget with arrow-key navigation, so aria-haspopup="menu" would announce interaction support that does not exist.' },
      { attribute: 'role="navigation" / aria-label="Main navigation" (root)', description: "The root was a bare <div> with no landmark at all — added the role (rather than swapping to a real <nav> element, to avoid changing the forwardRef'd element type for existing consumers)." },
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
