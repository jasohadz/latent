export default {
  name: "TopNavLink",
  summary: "The atomic link used inside TopNav's bar for Product, Download, and Pricing.",
  props: [
    { name: "label", type: "string", default: "—", description: "The link's text." },
    { name: "active", type: "boolean", default: "false", description: "Applies the active label color — used by TopNav when its own `menu` matches this link (Product/Download)." },
    { name: "showChevron", type: "boolean", default: "true", description: "Toggles the trailing chevron. TopNav sets this false for its plain Pricing link, which has no dropdown." },
  ],
  example: `<TopNavLink label="Product" active showChevron onClick={openProductMenu} />`,
  doNot: [
    "Don't set active on a link with no corresponding open panel (e.g. Pricing) — active only styles the label color, it doesn't open anything itself; TopNav is what wires active/onClick to its own menu state.",
  ],
  swizzlePath: "packages/core/src/TopNavLink.tsx",
  // Previously: Active=No's Label was raw unbound "Inter Regular" in
  // Figma (a real bug, not reproduced in the original port). Fixed at
  // the source — both Active=No and Active=Yes now share the same real
  // "Body/Small/SemiBold" text style (Geist SemiBold, font-weight.600);
  // only the fill color differs between states.
  figmaTokens: {
    "font-family": "font-family.sans",
    "font-size": "font-style.body-small",
    "label weight": "font-weight.600",
    "label line-height": "font-line-height.200-normal",
    "label color": "color.text.secondary",
    "chevron color": "color.icon.default",
    "active label color": "color.text.primary",
  },
};
